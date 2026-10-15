import Appointment from '../models/Appointment.js';
import {
  createAdminDoctor, createAdminHospital, deactivateAdminDoctor, deactivateAdminHospital,
  getAdminDirectoryOverview, listAdminDoctors, listAdminHospitals,
  updateAdminDoctor, updateAdminHospital
} from '../services/clinicClient.js';

const appointmentStatuses = ['requested', 'confirmed', 'completed', 'cancelled'];

export async function getAdminOverview(req, res) {
  const [statusRows, regionRows, recentActivity, directory] = await Promise.all([
    Appointment.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Appointment.aggregate([{ $group: { _id: '$region', count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Appointment.find().select('referenceCode status region specialty appointmentAt createdAt')
      .sort({ createdAt: -1 }).limit(8).lean(),
    getAdminDirectoryOverview()
  ]);
  const appointmentCounts = Object.fromEntries(appointmentStatuses.map((status) => [status, 0]));
  for (const row of statusRows) appointmentCounts[row._id] = row.count;
  res.json({
    appointments: { total: Object.values(appointmentCounts).reduce((sum, count) => sum + count, 0), byStatus: appointmentCounts },
    regions: regionRows.map(({ _id: region, count }) => ({ region, count })),
    directory: directory.counts,
    recentActivity
  });
}

export async function getAdminHospitals(req, res) { res.json(await listAdminHospitals()); }
export async function getAdminDoctors(req, res) { res.json(await listAdminDoctors(req.query)); }
export async function postAdminHospital(req, res) { res.status(201).json(await createAdminHospital(req.body)); }
export async function patchAdminHospital(req, res) { res.json(await updateAdminHospital(req.params.id, req.body)); }
export async function removeAdminHospital(req, res) { res.json(await deactivateAdminHospital(req.params.id)); }
export async function postAdminDoctor(req, res) { res.status(201).json(await createAdminDoctor(req.body)); }
export async function patchAdminDoctor(req, res) { res.json(await updateAdminDoctor(req.params.id, req.body)); }
export async function removeAdminDoctor(req, res) { res.json(await deactivateAdminDoctor(req.params.id)); }
