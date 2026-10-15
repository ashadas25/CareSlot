import { Router } from 'express';
import {
  getAdminDoctors, getAdminHospitals, getAdminOverview, patchAdminDoctor, patchAdminHospital,
  postAdminDoctor, postAdminHospital, removeAdminDoctor, removeAdminHospital
} from '../controllers/adminController.js';
import { requireAdmin, requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = Router();
router.use(requireAuth, requireAdmin);
router.get('/overview', asyncHandler(getAdminOverview));
router.get('/hospitals', asyncHandler(getAdminHospitals));
router.get('/doctors', asyncHandler(getAdminDoctors));
router.post('/hospitals', asyncHandler(postAdminHospital));
router.patch('/hospitals/:id', asyncHandler(patchAdminHospital));
router.delete('/hospitals/:id', asyncHandler(removeAdminHospital));
router.post('/doctors', asyncHandler(postAdminDoctor));
router.patch('/doctors/:id', asyncHandler(patchAdminDoctor));
router.delete('/doctors/:id', asyncHandler(removeAdminDoctor));
export default router;
