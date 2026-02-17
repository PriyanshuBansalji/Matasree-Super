import { Router } from 'express';
import * as addressController from '../controllers/addressController';
import { verifyToken, verifyCustomer } from '../middleware/auth';

const router = Router();

// All address routes require authentication
router.use(verifyToken);

router.get('/', addressController.getAddresses);
router.get('/:id', addressController.getAddressById);
router.post('/', addressController.createAddress);
router.put('/:id', addressController.updateAddress);
router.delete('/:id', addressController.deleteAddress);
router.post('/:id/set-default', addressController.setDefaultAddress);

export default router;
