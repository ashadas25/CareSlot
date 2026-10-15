import { Router } from 'express';
import { createSupportRequest, listSupportRequests, updateSupportStatus } from '../controllers/supportController.js';
import { requireAuth, requireStaff } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
const router = Router();
router.post('/', asyncHandler(createSupportRequest));
router.get('/', requireAuth, requireStaff, listSupportRequests);
router.patch('/:id/status', requireAuth, requireStaff, updateSupportStatus);
export default router;
