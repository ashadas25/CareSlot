import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { createEmergencyAlert, listHospitalEmergencyAlerts, updateEmergencyAlert } from '../controllers/emergencyController.js';
import { requireAuth, requireStaff } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();
const emergencySubmissionLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { message: 'Too many alerts were submitted from this connection. Call 112 if there is an immediate emergency.' }
});

router.post('/', emergencySubmissionLimit, asyncHandler(createEmergencyAlert));
router.get('/hospital', requireAuth, requireStaff, asyncHandler(listHospitalEmergencyAlerts));
router.patch('/:id', requireAuth, requireStaff, asyncHandler(updateEmergencyAlert));

export default router;
