import mongoose from 'mongoose';

const supportRequestSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, lowercase: true, trim: true },
  message: { type: String, required: true, trim: true, maxlength: 1200 },
  // Optional clinic-directory ID; this service does not own or populate it.
  hospital: { type: mongoose.Schema.Types.ObjectId, default: null },
  status: { type: String, enum: ['open', 'in_progress', 'resolved'], default: 'open' }
}, { timestamps: true });

export default mongoose.model('SupportRequest', supportRequestSchema);
