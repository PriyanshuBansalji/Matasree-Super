import { Response } from 'express';
import Address from '../models/Address';
import { ApiResponse } from '../utils/response';
import { AuthenticatedRequest } from '../middleware/auth';
import Joi from 'joi';

const addressSchema = Joi.object({
  name: Joi.string().required().trim(),
  phone: Joi.string().required(),
  addressLine1: Joi.string().required(),
  addressLine2: Joi.string().optional(),
  city: Joi.string().required(),
  state: Joi.string().required(),
  pincode: Joi.string().required(),
  isDefault: Joi.boolean().optional(),
});

/**
 * Get user's addresses
 */
export const getAddresses = async (req: any, res: Response) => {
  try {
    const addresses = await Address.find({ userId: req.user?.userId }).sort({ isDefault: -1 });
    res.status(200).json(new ApiResponse(true, 'Addresses fetched', addresses));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch addresses', null, 500));
  }
};

/**
 * Get address by ID
 */
export const getAddressById = async (req: any, res: Response) => {
  try {
    const address = await Address.findOne({
      _id: req.params.id,
      userId: req.user?.userId,
    });

    if (!address) {
      return res.status(404).json(new ApiResponse(false, 'Address not found', null, 404));
    }

    res.status(200).json(new ApiResponse(true, 'Address fetched', address));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch address', null, 500));
  }
};

/**
 * Create address
 */
export const createAddress = async (req: any, res: Response) => {
  try {
    const { error, value } = addressSchema.validate(req.body);
    if (error) {
      return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
    }

    const address = await Address.create({
      userId: req.user?.userId,
      ...value,
    });

    res.status(201).json(new ApiResponse(true, 'Address created', address));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to create address', null, 500));
  }
};

/**
 * Update address
 */
export const updateAddress = async (req: any, res: Response) => {
  try {
    const { error, value } = addressSchema.validate(req.body, { stripUnknown: true });
    if (error) {
      return res.status(400).json(new ApiResponse(false, error.details[0].message, null, 400));
    }

    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?.userId },
      value,
      { new: true }
    );

    if (!address) {
      return res.status(404).json(new ApiResponse(false, 'Address not found', null, 404));
    }

    res.status(200).json(new ApiResponse(true, 'Address updated', address));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to update address', null, 500));
  }
};

/**
 * Delete address
 */
export const deleteAddress = async (req: any, res: Response) => {
  try {
    const address = await Address.findOneAndDelete({
      _id: req.params.id,
      userId: req.user?.userId,
    });

    if (!address) {
      return res.status(404).json(new ApiResponse(false, 'Address not found', null, 404));
    }

    res.status(200).json(new ApiResponse(true, 'Address deleted'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to delete address', null, 500));
  }
};

/**
 * Set default address
 */
export const setDefaultAddress = async (req: any, res: Response) => {
  try {
    // Remove default from all other addresses
    await Address.updateMany({ userId: req.user?.userId }, { isDefault: false });

    // Set new default
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, userId: req.user?.userId },
      { isDefault: true },
      { new: true }
    );

    if (!address) {
      return res.status(404).json(new ApiResponse(false, 'Address not found', null, 404));
    }

    res.status(200).json(new ApiResponse(true, 'Default address set', address));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to set default address', null, 500));
  }
};
