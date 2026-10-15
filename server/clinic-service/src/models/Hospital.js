import mongoose from 'mongoose';

const hospitalSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
  branchCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
  region: {
    type: String,
    required: true,
    enum: ['Coimbatore', 'Chennai', 'Madurai', 'Tiruchirappalli', 'Salem', 'Other'],
    index: true
  },
  locality: { type: String, required: true, trim: true, index: true },
  address: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  openingHours: { type: String, trim: true, maxlength: 240, default: '' },
  emergencyPhone: { type: String, trim: true },
  services: [{ type: String, trim: true }],
  imageUrl: { type: String, default: '' },
  isActive: { type: Boolean, default: true, index: true }
}, { timestamps: true });

export default mongoose.model('Hospital', hospitalSchema);
