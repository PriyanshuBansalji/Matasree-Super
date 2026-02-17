"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const partnershipController_1 = require("../controllers/partnershipController");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
// User routes (requires authentication)
router.post('/apply', auth_1.verifyToken, partnershipController_1.submitPartnershipApplication);
router.get('/my-applications', auth_1.verifyToken, partnershipController_1.getPartnershipApplications);
router.get('/application/:id', auth_1.verifyToken, partnershipController_1.getPartnershipApplicationById);
// Admin routes (requires authentication and admin role)
router.get('/admin/all', auth_1.verifyToken, auth_1.verifyAdmin, partnershipController_1.getAllPartnershipApplications);
router.put('/admin/update-status/:id', auth_1.verifyToken, auth_1.verifyAdmin, partnershipController_1.updatePartnershipStatus);
exports.default = router;
//# sourceMappingURL=partnershipRoutes.js.map