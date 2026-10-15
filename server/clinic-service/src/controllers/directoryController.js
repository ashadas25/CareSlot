import mongoose from 'mongoose';
import Hospital from '../models/Hospital.js';
import Doctor from '../models/Doctor.js';

const makeSlug = (value) => String(value).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export async function listHospitals(req, res) {
  const filter = { isActive: true };
  if (req.query.region) filter.region = req.query.region;
  const hospitals = await Hospital.find(filter).sort({ region: 1, locality: 1 }).lean();
  res.json({ hospitals, count: hospitals.length, service: 'clinic-directory' });
}

export async function listAdminHospitals(req, res) {
  const hospitals = await Hospital.find().sort({ region: 1, locality: 1 }).lean();
  res.json({ hospitals, count: hospitals.length });
}

export async function getHospital(req, res) {
  const hospital = await Hospital.findOne({ _id: req.params.id, isActive: true }).lean();
  if (!hospital) return res.status(404).json({ message: 'Clinic branch not found.' });
  res.json({ hospital });
}

export async function createHospital(req, res) {
  const { name, region, locality, address, phone, emergencyPhone, openingHours = '', services = [], imageUrl = '' } = req.body;
  if (!name || !region || !locality || !address || !phone) {
    return res.status(400).json({ message: 'Name, region, locality, address, and phone are required.' });
  }
  const slug = makeSlug(`careslot-${region}-${locality}`);
  const branchCode = String(req.body.branchCode || `CS-${makeSlug(region).slice(0, 3)}-${makeSlug(locality).slice(0, 5)}`).toUpperCase();
  const hospital = await Hospital.create({ name, slug, branchCode, region, locality, address, phone, emergencyPhone, openingHours, services, imageUrl });
  res.status(201).json({ hospital });
}

export async function updateHospital(req, res) {
  const allowed = ['name', 'region', 'locality', 'address', 'phone', 'emergencyPhone', 'openingHours', 'services', 'imageUrl', 'isActive'];
  const update = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  const hospital = await Hospital.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!hospital) return res.status(404).json({ message: 'Clinic branch not found.' });
  res.json({ hospital });
}

export async function deactivateHospital(req, res) {
  const hospital = await Hospital.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!hospital) return res.status(404).json({ message: 'Clinic branch not found.' });
  res.json({ message: 'Clinic branch deactivated.', hospital });
}

export async function listDoctors(req, res) {
  const filter = { isActive: true, isAvailable: true };
  if (req.query.hospitalId) filter.hospital = req.query.hospitalId;
  if (req.query.specialty) filter.specialty = req.query.specialty;
  if (req.query.day) filter.availableDays = req.query.day;
  const doctors = await Doctor.find(filter)
    .populate('hospital', 'name region locality branchCode')
    .sort({ specialty: 1, name: 1 }).lean();
  res.json({ doctors, count: doctors.length, service: 'clinic-directory' });
}

export async function listAdminDoctors(req, res) {
  const filter = {};
  if (req.query.hospitalId) filter.hospital = req.query.hospitalId;
  if (req.query.specialty) filter.specialty = req.query.specialty;
  const doctors = await Doctor.find(filter)
    .populate('hospital', 'name region locality branchCode isActive')
    .sort({ specialty: 1, name: 1 }).lean();
  res.json({ doctors, count: doctors.length });
}

export async function adminDirectoryOverview(req, res) {
  const [branches, activeBranches, clinicians, availableClinicians] = await Promise.all([
    Hospital.countDocuments(),
    Hospital.countDocuments({ isActive: true }),
    Doctor.countDocuments(),
    Doctor.countDocuments({ isActive: true, isAvailable: true })
  ]);
  res.json({ counts: { branches, activeBranches, clinicians, availableClinicians } });
}

export async function createDoctor(req, res) {
  const { name, specialty, hospitalId, qualifications = [], experienceYears = 0, imageUrl = '', consultationFee = 0, availableDays = [] } = req.body;
  if (!name || !specialty || !hospitalId) {
    return res.status(400).json({ message: 'Name, specialty, and hospitalId are required.' });
  }
  const hospital = await Hospital.findOne({ _id: hospitalId, isActive: true });
  if (!hospital) return res.status(404).json({ message: 'Clinic branch not found.' });
  if (!hospital.services.includes(specialty)) return res.status(400).json({ message: 'This branch does not offer that specialty.' });
  const doctor = await Doctor.create({ name, specialty, hospital: hospital._id, qualifications, experienceYears, imageUrl, consultationFee, availableDays, isAvailable: true });
  res.status(201).json({ doctor });
}

export async function updateDoctor(req, res) {
  const allowed = ['name', 'specialty', 'qualifications', 'experienceYears', 'imageUrl', 'consultationFee', 'availableDays', 'isAvailable', 'isActive', 'hospitalId'];
  const update = Object.fromEntries(Object.entries(req.body).filter(([key]) => allowed.includes(key)));
  if (update.hospitalId) update.hospital = update.hospitalId;
  const doctor = await Doctor.findByIdAndUpdate(req.params.id, update, { new: true, runValidators: true });
  if (!doctor) return res.status(404).json({ message: 'Doctor not found.' });
  res.json({ doctor });
}

export async function internalListDoctors(req, res) {
  const { hospitalId, specialty, day } = req.query;
  if (!hospitalId || !specialty) return res.status(400).json({ message: 'hospitalId and specialty are required.' });
  const filter = { hospital: hospitalId, specialty, isActive: true, isAvailable: true };
  if (day) filter.availableDays = day;
  const doctors = await Doctor.find(filter).sort({ name: 1 }).lean();
  res.json({ doctors });
}

export async function deactivateDoctor(req, res) {
  const doctor = await Doctor.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
  if (!doctor) return res.status(404).json({ message: 'Doctor not found.' });
  res.json({ message: 'Doctor deactivated.', doctor });
}

export async function internalGetHospital(req, res) {
  const hospital = await Hospital.findOne({ _id: req.params.id, isActive: true }).lean();
  if (!hospital) return res.status(404).json({ message: 'Clinic branch not found.' });
  res.json({ hospital });
}

export async function internalGetDoctor(req, res) {
  const { hospitalId, specialty, day } = req.query;
  const filter = { _id: req.params.id, hospital: hospitalId, specialty, isActive: true, isAvailable: true };
  if (day) filter.availableDays = day;
  const doctor = await Doctor.findOne(filter).lean();
  if (!doctor) return res.status(404).json({ message: 'That doctor is not available for this branch, specialty, or day.' });
  res.json({ doctor });
}

export async function internalLookup(req, res) {
  const hospitalIds = [...new Set((req.body.hospitalIds || []).filter(mongoose.isValidObjectId).map(String))];
  const doctorIds = [...new Set((req.body.doctorIds || []).filter(mongoose.isValidObjectId).map(String))];
  const [hospitals, doctors] = await Promise.all([
    Hospital.find({ _id: { $in: hospitalIds } }).lean(),
    Doctor.find({ _id: { $in: doctorIds } }).lean()
  ]);
  res.json({
    hospitals: Object.fromEntries(hospitals.map((item) => [String(item._id), item])),
    doctors: Object.fromEntries(doctors.map((item) => [String(item._id), item]))
  });
}
