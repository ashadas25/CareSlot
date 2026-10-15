import { Router } from 'express';
import {
  adminDirectoryOverview, createDoctor, createHospital, deactivateDoctor, deactivateHospital,
  internalGetDoctor, internalGetHospital, internalListDoctors, internalLookup,
  listAdminDoctors, listAdminHospitals, updateDoctor, updateHospital
} from '../controllers/directoryController.js';
import { requireServiceKey } from '../middleware/keys.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();
router.use(requireServiceKey);
router.get('/admin/overview', asyncHandler(adminDirectoryOverview));
router.get('/admin/hospitals', asyncHandler(listAdminHospitals));
router.get('/admin/doctors', asyncHandler(listAdminDoctors));
router.post('/admin/hospitals', asyncHandler(createHospital));
router.patch('/admin/hospitals/:id', asyncHandler(updateHospital));
router.delete('/admin/hospitals/:id', asyncHandler(deactivateHospital));
router.post('/admin/doctors', asyncHandler(createDoctor));
router.patch('/admin/doctors/:id', asyncHandler(updateDoctor));
router.delete('/admin/doctors/:id', asyncHandler(deactivateDoctor));
router.get('/hospitals/:id', asyncHandler(internalGetHospital));
router.get('/doctors/:id', asyncHandler(internalGetDoctor));
router.get('/doctors', asyncHandler(internalListDoctors));
router.post('/lookup', asyncHandler(internalLookup));
export default router;
