import mongoose from 'mongoose';

const emergencyAlertSchema = new mongoose.Schema({
  alertCode: { type: String, required: true, unique: true, index: true },
  patientName: { type: String, required: true, trim: true, maxlength: 100 },
  patientPhone: { type: String, required: true, trim: true, maxlength: 25 },
  hospital: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  hospitalName: { type: String, required: true, trim: true },
  region: { type: String, required: true, trim: true, index: true },
  situation: { type: String, required: true, trim: true, maxlength: 500 },
  status: { type: String, enum: ['new', 'acknowledged', 'resolved'], default: 'new', index: true },
  priority: { type: String, enum: ['emergency', 'urgent'], default: 'urgent', immutable: true }
}, { timestamps: true });

emergencyAlertSchema.index({ hospital: 1, status: 1, createdAt: -1 });
export default mongoose.model('EmergencyAlert', emergencyAlertSchema);
