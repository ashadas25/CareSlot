import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { getHospital } from '../services/clinicClient.js';

function issueToken(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '8h' });
}

async function publicUser(user) {
  let hospital = null;
  if (user.hospital) {
    try {
      const branch = await getHospital(user.hospital);
      hospital = { _id: branch._id, name: branch.name, region: branch.region, locality: branch.locality };
    } catch (error) {
      if (error.status !== 404) throw error;
    }
  }
  return { id: user._id, name: user.name, email: user.email, role: user.role, hospital };
}

export async function register(req, res) {
  const { name, email, password, phone, role = 'patient', hospitalId } = req.body;
  if (!name || !email || !password || password.length < 8) return res.status(400).json({ message: 'Name, email, and a password of at least 8 characters are required.' });
  if (!['patient', 'staff', 'admin'].includes(role)) return res.status(400).json({ message: 'Choose a valid account type.' });
  let branchId = null;
  let assignedRole = 'patient';
  if (role !== 'patient') {
    if (!process.env.ADMIN_SETUP_KEY || req.headers['x-setup-key'] !== process.env.ADMIN_SETUP_KEY) return res.status(403).json({ message: 'Staff accounts must be provisioned by an administrator.' });
    if (!hospitalId) return res.status(400).json({ message: 'A hospital is required for staff accounts.' });
    const branch = await getHospital(hospitalId);
    branchId = branch._id;
    assignedRole = role === 'admin' ? 'admin' : 'staff';
  }
  if (await User.exists({ email: String(email).trim().toLowerCase() })) {
    return res.status(409).json({ message: 'An account with this email already exists. Sign in, or use the administrator setup form to assign admin access to this existing account.' });
  }
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await User.create({ name, email, phone, passwordHash, role: assignedRole, hospital: branchId });
  return res.status(201).json({ token: issueToken(user), user: await publicUser(user) });
}

export async function provisionAdmin(req, res) {
  const { name, email, password, phone, hospitalId } = req.body;
  const setupKeyMatches = Boolean(process.env.ADMIN_SETUP_KEY && req.headers['x-setup-key'] === process.env.ADMIN_SETUP_KEY);
  const hasAdmin = await User.exists({ role: 'admin' });
  const requestIp = req.ip || req.socket?.remoteAddress || '';
  const isLocalhost = ['::1', '127.0.0.1', '::ffff:127.0.0.1'].includes(requestIp);
  const firstAdminLocalSetup = !hasAdmin && process.env.NODE_ENV !== 'production' && isLocalhost;
  if (!setupKeyMatches && !firstAdminLocalSetup) {
    return res.status(403).json({ message: hasAdmin
      ? 'Administrator registration is closed. Ask an existing CareSlot administrator to provision another account.'
      : 'For security, first admin setup must be completed from the project computer or by the server owner.' });
  }
  if (!name?.trim() || !email?.trim() || !password || password.length < 8 || !hospitalId) {
    return res.status(400).json({ message: 'Name, email, a password of at least 8 characters, and a primary hospital are required.' });
  }
  const hospital = await getHospital(hospitalId);
  const emailAddress = String(email).trim().toLowerCase();
  const passwordHash = await bcrypt.hash(password, 12);
  let user = await User.findOne({ email: emailAddress }).select('+passwordHash');
  const updatingExisting = Boolean(user);
  if (!user) user = new User({ email: emailAddress });
  user.name = name.trim();
  user.phone = phone?.trim() || '';
  user.passwordHash = passwordHash;
  user.role = 'admin';
  user.hospital = hospital._id;
  await user.save();
  return res.status(updatingExisting ? 200 : 201).json({
    message: updatingExisting ? 'Existing account assigned administrator access.' : 'Administrator account created.',
    user: await publicUser(user)
  });
}

export async function getAdminSetupStatus(req, res) {
  const hasAdmin = await User.exists({ role: 'admin' });
  const requestIp = req.ip || req.socket?.remoteAddress || '';
  const isLocalhost = ['::1', '127.0.0.1', '::ffff:127.0.0.1'].includes(requestIp);
  res.json({ setupAvailable: !hasAdmin && process.env.NODE_ENV !== 'production' && isLocalhost });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email: String(email || '').toLowerCase() }).select('+passwordHash');
  if (!user || !(await bcrypt.compare(password || '', user.passwordHash))) return res.status(401).json({ message: 'Email or password is incorrect.' });
  return res.json({ token: issueToken(user), user: await publicUser(user) });
}

export async function me(req, res) {
  res.json({ user: await publicUser(req.user) });
}
