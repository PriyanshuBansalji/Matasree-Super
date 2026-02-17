"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setDefaultAddress = exports.deleteAddress = exports.updateAddress = exports.createAddress = exports.getAddressById = exports.getAddresses = void 0;
const Address_1 = __importDefault(require("../models/Address"));
const response_1 = require("../utils/response");
const joi_1 = __importDefault(require("joi"));
const addressSchema = joi_1.default.object({
    name: joi_1.default.string().required().trim(),
    phone: joi_1.default.string().required(),
    addressLine1: joi_1.default.string().required(),
    addressLine2: joi_1.default.string().optional(),
    city: joi_1.default.string().required(),
    state: joi_1.default.string().required(),
    pincode: joi_1.default.string().required(),
    isDefault: joi_1.default.boolean().optional(),
});
/**
 * Get user's addresses
 */
const getAddresses = async (req, res) => {
    try {
        const addresses = await Address_1.default.find({ userId: req.user?.userId }).sort({ isDefault: -1 });
        res.status(200).json(new response_1.ApiResponse(true, 'Addresses fetched', addresses));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to fetch addresses', null, 500));
    }
};
exports.getAddresses = getAddresses;
/**
 * Get address by ID
 */
const getAddressById = async (req, res) => {
    try {
        const address = await Address_1.default.findOne({
            _id: req.params.id,
            userId: req.user?.userId,
        });
        if (!address) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Address not found', null, 404));
        }
        res.status(200).json(new response_1.ApiResponse(true, 'Address fetched', address));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to fetch address', null, 500));
    }
};
exports.getAddressById = getAddressById;
/**
 * Create address
 */
const createAddress = async (req, res) => {
    try {
        const { error, value } = addressSchema.validate(req.body);
        if (error) {
            return res.status(400).json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const address = await Address_1.default.create({
            userId: req.user?.userId,
            ...value,
        });
        res.status(201).json(new response_1.ApiResponse(true, 'Address created', address));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to create address', null, 500));
    }
};
exports.createAddress = createAddress;
/**
 * Update address
 */
const updateAddress = async (req, res) => {
    try {
        const { error, value } = addressSchema.validate(req.body, { stripUnknown: true });
        if (error) {
            return res.status(400).json(new response_1.ApiResponse(false, error.details[0].message, null, 400));
        }
        const address = await Address_1.default.findOneAndUpdate({ _id: req.params.id, userId: req.user?.userId }, value, { new: true });
        if (!address) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Address not found', null, 404));
        }
        res.status(200).json(new response_1.ApiResponse(true, 'Address updated', address));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to update address', null, 500));
    }
};
exports.updateAddress = updateAddress;
/**
 * Delete address
 */
const deleteAddress = async (req, res) => {
    try {
        const address = await Address_1.default.findOneAndDelete({
            _id: req.params.id,
            userId: req.user?.userId,
        });
        if (!address) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Address not found', null, 404));
        }
        res.status(200).json(new response_1.ApiResponse(true, 'Address deleted'));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to delete address', null, 500));
    }
};
exports.deleteAddress = deleteAddress;
/**
 * Set default address
 */
const setDefaultAddress = async (req, res) => {
    try {
        // Remove default from all other addresses
        await Address_1.default.updateMany({ userId: req.user?.userId }, { isDefault: false });
        // Set new default
        const address = await Address_1.default.findOneAndUpdate({ _id: req.params.id, userId: req.user?.userId }, { isDefault: true }, { new: true });
        if (!address) {
            return res.status(404).json(new response_1.ApiResponse(false, 'Address not found', null, 404));
        }
        res.status(200).json(new response_1.ApiResponse(true, 'Default address set', address));
    }
    catch (error) {
        res.status(500).json(new response_1.ApiResponse(false, error.message || 'Failed to set default address', null, 500));
    }
};
exports.setDefaultAddress = setDefaultAddress;
//# sourceMappingURL=addressController.js.map