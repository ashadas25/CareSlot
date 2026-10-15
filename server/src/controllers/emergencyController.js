import crypto from 'node:crypto';
import EmergencyAlert from '../models/EmergencyAlert.js';
import { getHospital } from '../services/clinicClient.js';

export async function createEmergencyAlert(req, res) {
  const { patientName, patientPhone, hospitalId, situation, urgency = 'emergency' } = req.body;
  if (!patientName?.trim() || !patientPhone?.trim() || !hospitalId || !['emergency', 'urgent'].includes(urgency)) {
    return res.status(400).json({ message: 'Name, phone, selected clinic and a valid urgency level are required.' });
  }
  if (urgency === 'urgent' && !situation?.trim()) {
    return res.status(400).json({ message: 'Add a brief description for a non-life-threatening clinic alert.' });
  }
  if (!/^[+\d][\d\s()-]{6,23}$/.test(patientPhone.trim())) {
    return res.status(400).json({ message: 'Enter a valid phone number so the clinic can call back.' });
  }

  const hospital = await getHospital(hospitalId);
  const alert = await EmergencyAlert.create({
    alertCode: `EM-${crypto.randomBytes(4).toString('hex').toUpperCase()}`,
    patientName: patientName.trim(),
    patientPhone: patientPhone.trim(),
    hospital: hospital._id,
    hospitalName: hospital.name,
    region: hospital.region,
    situation: situation?.trim() || 'Immediate emergency. No description was provided; call the patient using the callback number.',
    priority: urgency
  });
  res.status(201).json({
    message: 'Emergency alert added to the selected clinic’s CareSlot staff dashboard.',
    alert: { id: alert._id, alertCode: alert.alertCode, hospitalName: hospital.name, createdAt: alert.createdAt }
  });
}

export async function listHospitalEmergencyAlerts(req, res) {
  const filter = req.user.role === 'admin' ? {} : { hospital: req.user.hospital };
  if (!filter.hospital && req.user.role !== 'admin') return res.status(400).json({ message: 'Your staff account is not assigned to a clinic branch.' });
  const alerts = await EmergencyAlert.find(filter).sort({ createdAt: -1 }).limit(100).lean();
  res.json({ alerts });
}

export async function updateEmergencyAlert(req, res) {
  if (!['acknowledged', 'resolved'].includes(req.body.status)) {
    return res.status(400).json({ message: 'Choose acknowledged or resolved for this alert.' });
  }
  const filter = { _id: req.params.id };
  if (req.user.role !== 'admin') filter.hospital = req.user.hospital;
  const alert = await EmergencyAlert.findOneAndUpdate(filter, { status: req.body.status }, { new: true, runValidators: true });
  if (!alert) return res.status(404).json({ message: 'Emergency alert not found for your clinic.' });
  res.json({ alert });
}
