import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  patientName: { type: String, required: true, trim: true, maxlength: 100 },
  patientEmail: { type: String, required: true, trim: true, lowercase: true },
  patientPhone: { type: String, required: true, trim: true, maxlength: 20 },
  // Directory IDs are owned by the independent Clinic Directory Service.
  hospital: { type: mongoose.Schema.Types.ObjectId, required: true, index: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, default: null },
  specialty: { type: String, required: true, trim: true },
  region: { type: String, required: true, index: true },
  appointmentAt: { type: Date, required: true, index: true },
  reason: { type: String, trim: true, maxlength: 500 },
  status: { type: String, enum: ['requested', 'confirmed', 'completed', 'cancelled'], default: 'requested', index: true },
  updates: [{
    status: { type: String, enum: ['requested', 'confirmed', 'completed', 'cancelled'], required: true },
    actorRole: { type: String, enum: ['patient', 'staff', 'admin'], required: true },
    note: { type: String, trim: true, maxlength: 300 },
    createdAt: { type: Date, default: Date.now }
  }],
  messages: [{
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole: { type: String, enum: ['patient', 'staff', 'admin'], required: true },
    body: { type: String, required: true, trim: true, maxlength: 1200 },
    createdAt: { type: Date, default: Date.now }
  }],
  patientReadAt: { type: Date, default: Date.now },
  hospitalReadAt: { type: Date, default: Date.now },
  referenceCode: { type: String, required: true, unique: true, index: true }
}, { timestamps: true });

appointmentSchema.index({ hospital: 1, appointmentAt: 1, status: 1 });
export default mongoose.model('Appointment', appointmentSchema);
