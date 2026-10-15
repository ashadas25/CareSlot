import { Router } from 'express';
import {
  createDoctor, createHospital, deactivateDoctor, deactivateHospital,
  getHospital, listDoctors, listHospitals, updateDoctor, updateHospital
} from '../controllers/directoryController.js';
import { requireClinicAdmin } from '../middleware/keys.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.get('/hospitals', asyncHandler(listHospitals));
router.get('/hospitals/:id', asyncHandler(getHospital));
router.post('/hospitals', requireClinicAdmin, asyncHandler(createHospital));
router.patch('/hospitals/:id', requireClinicAdmin, asyncHandler(updateHospital));
router.delete('/hospitals/:id', requireClinicAdmin, asyncHandler(deactivateHospital));
router.get('/doctors', asyncHandler(listDoctors));
router.post('/doctors', requireClinicAdmin, asyncHandler(createDoctor));
router.patch('/doctors/:id', requireClinicAdmin, asyncHandler(updateDoctor));
router.delete('/doctors/:id', requireClinicAdmin, asyncHandler(deactivateDoctor));
export default router;
