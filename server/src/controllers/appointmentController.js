import crypto from 'node:crypto';
import Appointment from '../models/Appointment.js';
import { getHospital, getDoctor, listAvailableDoctors, lookupDirectoryRecords } from '../services/clinicClient.js';

const idOf = (value) => value?._id?.toString?.() || value?.toString?.() || '';
const weekdayInIndia = (date) => new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'Asia/Kolkata' }).format(date);

const statusNotes = {
  confirmed: 'The hospital confirmed this visit request.',
  completed: 'The hospital marked this visit complete.',
  cancelled: 'The hospital cancelled this visit request.'
};

function unreadCount(record, viewer) {
  const patientView = viewer.role === 'patient';
  const seenAt = new Date(patientView ? record.patientReadAt || record.createdAt : record.hospitalReadAt || record.createdAt);
  const incomingMessageCount = (record.messages || []).filter((message) =>
    patientView ? message.senderRole !== 'patient' : message.senderRole === 'patient'
  ).filter((message) => new Date(message.createdAt) > seenAt).length;
  const incomingUpdateCount = patientView
    ? (record.updates || []).filter((update) => update.actorRole !== 'patient' && new Date(update.createdAt) > seenAt).length
    : 0;
  return incomingMessageCount + incomingUpdateCount;
}

async function attachDirectory(appointments, viewer) {
  if (!appointments.length) return appointments;
  const directory = await lookupDirectoryRecords(
    appointments.map((item) => idOf(item.hospital)),
    appointments.map((item) => idOf(item.doctor)).filter(Boolean)
  );
  return appointments.map((item) => {
    const record = item.toObject ? item.toObject() : item;
    return {
      ...record,
      unreadCount: unreadCount(record, viewer),
      updates: (record.updates || []).map(({ status, actorRole, note, createdAt }) => ({ status, actorRole, note, createdAt })),
      messages: (record.messages || []).map(({ senderRole, body, createdAt }) => ({ senderRole, body, createdAt })),
      hospital: directory.hospitals[idOf(item.hospital)] || { _id: idOf(item.hospital), name: 'Clinic branch' },
      doctor: idOf(item.doctor) ? directory.doctors[idOf(item.doctor)] || null : null
    };
  });
}

export async function createAppointment(req, res) {
  const { hospitalId, doctorId, specialty, appointmentAt, reason, patientPhone } = req.body;
  if (!hospitalId || !specialty || !appointmentAt || !req.user?.name || !req.user?.email || !patientPhone?.trim()) {
    return res.status(400).json({ message: 'Please complete all required booking details.' });
  }
  const date = new Date(appointmentAt);
  if (Number.isNaN(date.valueOf()) || date <= new Date()) return res.status(400).json({ message: 'Choose a future appointment date and time.' });

  const hospital = await getHospital(hospitalId);
  if (!hospital.services.includes(specialty)) return res.status(400).json({ message: 'Choose a specialty offered at the selected clinic branch.' });
  const day = weekdayInIndia(date);
  let doctor;
  if (doctorId && doctorId !== 'any') {
    doctor = await getDoctor(doctorId, { hospitalId, specialty, day });
  } else {
    const choices = await listAvailableDoctors({ hospitalId, specialty, day });
    doctor = choices[0];
    if (!doctor) return res.status(409).json({ message: `No ${specialty} doctor is listed as available at this branch on ${day}. Choose another date or branch.` });
  }

  const appointment = await Appointment.create({
    patient: req.user._id, patientName: req.user.name, patientEmail: req.user.email, patientPhone: patientPhone.trim(),
    hospital: hospital._id, doctor: doctor?._id || null, specialty,
    region: hospital.region, appointmentAt: date, reason,
    referenceCode: `CS-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
    updates: [{ status: 'requested', actorRole: 'patient', note: 'Your request was sent to the selected hospital.' }]
  });
  res.status(201).json({
    message: 'Your request has been sent to the selected hospital.',
    appointment: { ...appointment.toObject(), hospital, doctor }
  });
}

export async function listMyAppointments(req, res) {
  const records = await Appointment.find({ patient: req.user._id }).sort({ appointmentAt: -1 }).limit(100);
  res.json({ appointments: await attachDirectory(records, req.user) });
}

export async function listMyNotifications(req, res) {
  const records = await Appointment.find({ patient: req.user._id })
    .select('referenceCode status updates messages patientReadAt createdAt')
    .sort({ updatedAt: -1 }).limit(100).lean();
  const notifications = records.map((record) => ({
    appointmentId: record._id,
    referenceCode: record.referenceCode,
    status: record.status,
    unreadCount: unreadCount(record, req.user),
    latestUpdate: [...(record.updates || []).filter((item) => item.actorRole !== 'patient'), ...(record.messages || []).filter((item) => item.senderRole !== 'patient')]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))[0] || null
  })).filter((item) => item.unreadCount > 0);
  res.json({ notifications, unreadCount: notifications.reduce((sum, item) => sum + item.unreadCount, 0) });
}

export async function listHospitalAppointments(req, res) {
  const filter = req.user.role === 'admin' ? {} : { hospital: req.user.hospital };
  if (!filter.hospital && req.user.role !== 'admin') return res.status(400).json({ message: 'Your staff account is not assigned to a hospital.' });
  if (req.query.status) filter.status = req.query.status;
  const records = await Appointment.find(filter).sort({ appointmentAt: 1 }).limit(200);
  res.json({ appointments: await attachDirectory(records, req.user) });
}

export async function updateAppointmentStatus(req, res) {
  const filter = { _id: req.params.id };
  if (req.user.role !== 'admin') filter.hospital = req.user.hospital;
  const appointment = await Appointment.findOne(filter);
  if (!appointment) return res.status(404).json({ message: 'Appointment not found for your hospital.' });
  if (!['confirmed', 'completed', 'cancelled'].includes(req.body.status)) return res.status(400).json({ message: 'Choose a valid appointment status.' });
  appointment.status = req.body.status;
  appointment.updates.push({ status: req.body.status, actorRole: req.user.role, note: statusNotes[req.body.status] });
  await appointment.save();
  res.json({ appointment: (await attachDirectory([appointment], req.user))[0] });
}

async function findAuthorizedAppointment(req, res) {
  const filter = { _id: req.params.id };
  if (req.user.role === 'patient') filter.patient = req.user._id;
  else if (req.user.role === 'staff') filter.hospital = req.user.hospital;
  if (req.user.role === 'staff' && !req.user.hospital) {
    res.status(403).json({ message: 'Your staff account is not assigned to a hospital.' });
    return null;
  }
  const appointment = await Appointment.findOne(filter);
  if (!appointment) res.status(404).json({ message: 'Appointment not found for this account.' });
  return appointment;
}

export async function postAppointmentMessage(req, res) {
  const body = String(req.body.body || '').trim();
  if (!body || body.length > 1200) return res.status(400).json({ message: 'Write a message of up to 1,200 characters.' });
  const appointment = await findAuthorizedAppointment(req, res);
  if (!appointment) return;
  appointment.messages.push({ sender: req.user._id, senderRole: req.user.role, body });
  await appointment.save();
  res.status(201).json({ message: 'Message sent to the appointment conversation.' });
}

export async function markAppointmentRead(req, res) {
  const appointment = await findAuthorizedAppointment(req, res);
  if (!appointment) return;
  if (req.user.role === 'patient') appointment.patientReadAt = new Date();
  else appointment.hospitalReadAt = new Date();
  await appointment.save();
  res.json({ message: 'Conversation marked as read.' });
}
