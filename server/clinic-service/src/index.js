import dotenv from 'dotenv';
dotenv.config({ path: process.env.DOTENV_CONFIG_PATH || '../.env' });
import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { connectDatabase } from './config/db.js';
import directoryRoutes from './routes/directory.js';
import internalRoutes from './routes/internal.js';

await connectDatabase();
const app = express();
app.disable('x-powered-by');
app.use(helmet());
const origins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((item) => item.trim());
app.use(cors({ origin: origins }));
app.use(express.json({ limit: '32kb' }));
app.use(morgan('tiny'));
app.use('/api', rateLimit({ windowMs: 15 * 60 * 1000, limit: 240, standardHeaders: 'draft-7', legacyHeaders: false }));
app.get('/api/health', (req, res) => {
  const databaseConnected = mongoose.connection.readyState === 1;
  res.status(databaseConnected ? 200 : 503).json({
    status: databaseConnected ? 'ok' : 'unavailable',
    service: 'clinic-directory',
    database: databaseConnected ? 'connected' : 'disconnected'
  });
});
app.use('/api', directoryRoutes);
app.use('/api/internal', internalRoutes);
app.use((req, res) => res.status(404).json({ message: `Route not found: ${req.method} ${req.path}` }));
app.use((error, req, res, next) => {
  console.error(error);
  if (error.name === 'ValidationError') return res.status(400).json({ message: 'Please check the submitted details.', details: Object.values(error.errors).map((item) => item.message) });
  if (error.code === 11000) return res.status(409).json({ message: 'That branch code or slug already exists.' });
  if (error.name === 'CastError') return res.status(400).json({ message: 'Invalid record identifier.' });
  res.status(500).json({ message: 'Clinic Directory Service error.' });
});

// CLINIC_PORT separates the local directory process from PORT=5000 in server/.env.
// Cloud deployments should leave CLINIC_PORT unset so the platform's PORT is used.
const port = process.env.CLINIC_PORT?.trim() || (process.env.PORT === '5000' ? 5001 : process.env.PORT || 5001);
app.listen(port, () => console.log(`CareSlot Clinic Directory Service listening on port ${port}`));
