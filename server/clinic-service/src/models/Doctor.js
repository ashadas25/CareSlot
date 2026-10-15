import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  specialty: { type: String, required: true, trim: true, index: true },
  hospital: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital', required: true, index: true },
  qualifications: [{ type: String, trim: true }],
  experienceYears: { type: Number, min: 0, default: 0 },
  imageUrl: { type: String, default: '' },
  consultationFee: { type: Number, min: 0, default: 0 },
  availableDays: [{ type: String, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] }],
  isAvailable: { type: Boolean, default: true, index: true },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

doctorSchema.index({ hospital: 1, specialty: 1, isAvailable: 1, isActive: 1 });
export default mongoose.model('Doctor', doctorSchema);
