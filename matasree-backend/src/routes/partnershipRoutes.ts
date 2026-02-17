import express from 'express';
import {
  submitPartnershipApplication,
  getPartnershipApplications,
  getPartnershipApplicationById,
  getAllPartnershipApplications,
  updatePartnershipStatus,
} from '../controllers/partnershipController';
import { verifyToken, verifyAdmin, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();

// User routes (requires authentication)
router.post('/apply', verifyToken, submitPartnershipApplication);
router.get('/my-applications', verifyToken, getPartnershipApplications);
router.get('/application/:id', verifyToken, getPartnershipApplicationById);

// Admin routes (requires authentication and admin role)
router.get('/admin/all', verifyToken, verifyAdmin, getAllPartnershipApplications);
router.put('/admin/update-status/:id', verifyToken, verifyAdmin, updatePartnershipStatus);

export default router;
