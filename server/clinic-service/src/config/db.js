import mongoose from 'mongoose';

export async function connectDatabase() {
  if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is not configured');
  await mongoose.connect(process.env.MONGODB_URI, {
    dbName: process.env.MONGODB_DB_NAME || 'careslot_directory'
  });
  console.log(`Clinic Directory MongoDB connected: ${mongoose.connection.name}`);
}
