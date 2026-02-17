import { Response } from 'express';
import Partnership from '../models/Partnership';
import User from '../models/User';
import { sendEmail } from '../utils/email';
import { AuthenticatedRequest } from '../middleware/auth';

export const submitPartnershipApplication = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;
    
    console.log('🔍 Partnership Application Debug:');
    console.log('req.user:', req.user);
    console.log('userId:', userId);
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated. Please login again.' });
    }
    
    const {
      fullName,
      email,
      phone,
      businessName,
      businessType,
      areaOfInterest,
      cities,
      businessExperience,
      bankAccountHolder,
      bankAccountNumber,
      ifscCode,
      gstNumber,
      businessRegistration,
      address,
      city,
      state,
      pincode,
      country,
      additionalInfo,
    } = req.body;

    // Validate required fields
    if (
      !fullName ||
      !email ||
      !phone ||
      !businessName ||
      !businessType ||
      !areaOfInterest ||
      !cities ||
      businessExperience === undefined ||
      !bankAccountHolder ||
      !bankAccountNumber ||
      !ifscCode ||
      !gstNumber ||
      !address ||
      !city ||
      !state ||
      !pincode
    ) {
      return res
        .status(400)
        .json({ success: false, message: 'Please provide all required fields' });
    }

    // Check if user already has a pending or approved application
    const existingApplication = await Partnership.findOne({
      userId,
      status: { $in: ['pending', 'approved'] },
    });

    if (existingApplication) {
      return res.status(400).json({
        success: false,
        message: 'You already have a pending or approved partnership application',
      });
    }

    // Create partnership application
    const partnershipData = new Partnership({
      userId,
      fullName,
      email,
      phone,
      businessName,
      businessType,
      areaOfInterest,
      cities: Array.isArray(cities) ? cities : [cities],
      businessExperience,
      bankAccountHolder,
      bankAccountNumber,
      ifscCode,
      gstNumber,
      businessRegistration,
      address,
      city,
      state,
      pincode,
      country: country || 'India',
      additionalInfo,
      status: 'pending',
    });

    const partnership = await partnershipData.save();

    // Send confirmation email to user
    const userConfirmationEmailHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #D4A373 0%, #C9533B 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">Partnership Application Received</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p>Dear ${fullName},</p>
          <p>Thank you for your interest in becoming a Matasree Super distributor!</p>
          <p>We have successfully received your partnership application. Our team will review your application and get back to you within 3-5 business days.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D4A373;">
            <h3 style="color: #D4A373; margin-top: 0;">Application Details:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Application ID:</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${partnership._id}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Business Name:</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${businessName}</td>
              </tr>
              <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Area of Interest:</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${areaOfInterest}</td>
              </tr>
              <tr>
                <td style="padding: 8px; font-weight: bold;">Cities:</td>
                <td style="padding: 8px;">${Array.isArray(cities) ? cities.join(', ') : cities}</td>
              </tr>
            </table>
          </div>

          <p>In the meantime, if you have any questions, please feel free to contact us at:</p>
          <p>
            📧 Email: <a href="mailto:info@matasreesuper.com">info@matasreesuper.com</a><br>
            📱 Phone: <a href="tel:7505675163">7505675163</a> / <a href="tel:6937475400">6937475400</a>
          </p>

          <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            Best regards,<br>
            <strong>Matasree Super Industries</strong><br>
            Clement Town, Dehradun - Uttarakhand, India<br>
            Est. 2008
          </p>
        </div>
      </div>
    `;

    // Send notification email to admin
    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #D4A373 0%, #C9533B 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">New Partnership Application</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p><strong>A new partnership application has been submitted:</strong></p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D4A373;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold; width: 30%;">Application ID:</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${partnership._id}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold;">Name:</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${fullName}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold;">Email:</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee;"><a href="mailto:${email}">${email}</a></td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold;">Phone:</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${phone}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold;">Business Name:</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${businessName}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold;">Business Type:</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${businessType}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold;">Area of Interest:</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${areaOfInterest}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold;">Cities:</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${Array.isArray(cities) ? cities.join(', ') : cities}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold;">Experience:</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${businessExperience} years</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold;">GST Number:</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${gstNumber}</td>
              </tr>
              <tr>
                <td style="padding: 12px; border-bottom: 1px solid #eee; font-weight: bold;">Address:</td>
                <td style="padding: 12px; border-bottom: 1px solid #eee;">${address}, ${city}, ${state} - ${pincode}</td>
              </tr>
              <tr>
                <td style="padding: 12px; font-weight: bold;">Status:</td>
                <td style="padding: 12px;">Pending Review</td>
              </tr>
            </table>
          </div>

          <p>
            <a href="${process.env.ADMIN_DASHBOARD_URL || 'http://localhost:3000/admin/dashboard'}" style="display: inline-block; background: #D4A373; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              Review Application
            </a>
          </p>
        </div>
      </div>
    `;

    try {
      // Send emails
      await Promise.all([
        sendEmail({
          email,
          subject: 'Partnership Application Confirmation - Matasree Super',
          html: userConfirmationEmailHtml,
        }),
        sendEmail({
          email: process.env.ADMIN_EMAIL || 'info@matasreesuper.com',
          subject: `New Partnership Application - ${businessName}`,
          html: adminEmailHtml,
        }),
      ]);
    } catch (emailError) {
      console.error('Error sending emails:', emailError);
      // Don't fail the request if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Partnership application submitted successfully. Confirmation email sent.',
      data: partnership,
    });
  } catch (error: any) {
    console.error('Error submitting partnership application:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to submit partnership application',
    });
  }
};

export const getPartnershipApplications = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const userId = req.user?.userId;

    // Get user's applications
    const applications = await Partnership.find({ userId }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: applications,
    });
  } catch (error: any) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch applications',
    });
  }
};

export const getPartnershipApplicationById = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    const application = await Partnership.findById(id);

    if (!application) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Check if user owns this application
    if (application.userId.toString() !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to view this application',
      });
    }

    res.status(200).json({
      success: true,
      data: application,
    });
  } catch (error: any) {
    console.error('Error fetching application:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch application',
    });
  }
};

// Admin functions

export const getAllPartnershipApplications = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;

    const query: any = {};
    if (status) {
      query.status = status;
    }

    const skip = (Number(page) - 1) * Number(limit);
    const applications = await Partnership.find(query)
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 })
      .populate('userId', 'name email phone');

    const total = await Partnership.countDocuments(query);

    res.status(200).json({
      success: true,
      data: applications,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error: any) {
    console.error('Error fetching applications:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to fetch applications',
    });
  }
};

export const updatePartnershipStatus = async (
  req: AuthenticatedRequest,
  res: Response
) => {
  try {
    const { id } = req.params;
    const { status, rejectionReason } = req.body;

    if (!['pending', 'approved', 'rejected', 'on-hold'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status',
      });
    }

    const partnership = await Partnership.findByIdAndUpdate(
      id,
      {
        status,
        rejectionReason: status === 'rejected' ? rejectionReason : undefined,
      },
      { new: true }
    );

    if (!partnership) {
      return res.status(404).json({
        success: false,
        message: 'Application not found',
      });
    }

    // Send status update email
    const statusEmailHtml = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #D4A373 0%, #C9533B 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0;">Partnership Application Status Update</h1>
        </div>
        <div style="padding: 30px; background: #f9f9f9;">
          <p>Dear ${partnership.fullName},</p>
          <p>Your partnership application has been updated.</p>
          
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #D4A373;">
            <p><strong>Status: </strong><span style="color: ${status === 'approved' ? '#4CAF50' : status === 'rejected' ? '#f44336' : '#FF9800'}; font-weight: bold;">${status.toUpperCase()}</span></p>
            ${status === 'rejected' ? `<p><strong>Reason:</strong> ${rejectionReason || 'N/A'}</p>` : ''}
            <p><strong>Application ID:</strong> ${partnership._id}</p>
          </div>

          ${status === 'approved' ? '<p>We are excited to have you as part of the Matasree Super family. Our team will contact you soon with further details.</p>' : ''}
          
          <p>If you have any questions, please contact us at:</p>
          <p>
            📧 Email: <a href="mailto:info@matasreesuper.com">info@matasreesuper.com</a><br>
            📱 Phone: <a href="tel:7505675163">7505675163</a> / <a href="tel:6937475400">6937475400</a>
          </p>

          <p style="color: #666; font-size: 12px; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px;">
            Best regards,<br>
            <strong>Matasree Super Industries</strong><br>
            Clement Town, Dehradun - Uttarakhand, India
          </p>
        </div>
      </div>
    `;

    try {
      await sendEmail({
        email: partnership.email,
        subject: `Partnership Application ${status.toUpperCase()} - Matasree Super`,
        html: statusEmailHtml,
      });
    } catch (emailError) {
      console.error('Error sending status update email:', emailError);
    }

    res.status(200).json({
      success: true,
      message: 'Application status updated successfully',
      data: partnership,
    });
  } catch (error: any) {
    console.error('Error updating application:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update application',
    });
  }
};
