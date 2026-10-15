import SupportRequest from '../models/SupportRequest.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export async function createSupportRequest(req, res) {
  const { name, email, message, hospitalId } = req.body;
  if (!name || !email || !message) return res.status(400).json({ message: 'Name, email, and message are required.' });
  const support = await SupportRequest.create({ name, email, message, hospital: hospitalId || null });
  res.status(201).json({ message: 'Your support question has been received.', id: support._id });
}

export const listSupportRequests = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Administrator access required.' });
  const requests = await SupportRequest.find().sort({ createdAt: -1 }).limit(200).lean();
  res.json({ requests });
});

export const updateSupportStatus = asyncHandler(async (req, res) => {
  if (req.user.role !== 'admin') return res.status(403).json({ message: 'Administrator access required.' });
  if (!['open', 'in_progress', 'resolved'].includes(req.body.status)) return res.status(400).json({ message: 'Choose a valid support status.' });
  const request = await SupportRequest.findByIdAndUpdate(req.params.id, { status: req.body.status }, { new: true, runValidators: true });
  if (!request) return res.status(404).json({ message: 'Support request not found.' });
  res.json({ request });
});
