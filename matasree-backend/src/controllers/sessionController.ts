import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import RefreshToken from '../models/RefreshToken';
import { ApiResponse } from '../utils/response';
import { logSecurityEvent } from '../middleware/auditLogger';

/**
 * Get all active sessions for the logged-in user.
 */
export const getActiveSessions = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    const currentToken = req.cookies?.refreshToken;

    const sessions = await RefreshToken.find({
      userId,
      isRevoked: false,
      expiresAt: { $gt: new Date() }
    }).select('_id ipAddress userAgent createdAt token');

    const formattedSessions = sessions.map(session => ({
      id: session._id,
      ipAddress: session.ipAddress || 'Unknown IP',
      userAgent: session.userAgent || 'Unknown Device',
      createdAt: session.createdAt,
      isCurrent: session.token === currentToken
    }));

    res.status(200).json(new ApiResponse(true, 'Active sessions retrieved', formattedSessions));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to fetch sessions', null, 500));
  }
};

/**
 * Revoke a specific session (Log out from a device).
 */
export const revokeSession = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    const { sessionId } = req.params;

    const session = await RefreshToken.findOne({
      _id: sessionId,
      userId
    });

    if (!session) {
      return res.status(404).json(new ApiResponse(false, 'Session not found', null, 404));
    }

    session.isRevoked = true;
    await session.save();

    await logSecurityEvent(
      userId,
      'REVOKE_SESSION',
      'Session',
      sessionId,
      { ip: session.ipAddress, userAgent: session.userAgent },
      req
    );

    res.status(200).json(new ApiResponse(true, 'Session revoked successfully'));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to revoke session', null, 500));
  }
};

/**
 * Revoke all other sessions (Log out from all other devices).
 */
export const revokeAllOtherSessions = async (req: any, res: Response) => {
  try {
    const userId = req.user?.userId;
    const currentToken = req.cookies?.refreshToken;

    const result = await RefreshToken.updateMany(
      {
        userId,
        token: { $ne: currentToken },
        isRevoked: false
      },
      { isRevoked: true }
    );

    await logSecurityEvent(
      userId,
      'REVOKE_ALL_OTHER_SESSIONS',
      'Session',
      undefined,
      { count: result.modifiedCount },
      req
    );

    res.status(200).json(new ApiResponse(true, `Successfully logged out from ${result.modifiedCount} other device(s)`));
  } catch (error: any) {
    res.status(500).json(new ApiResponse(false, error.message || 'Failed to revoke sessions', null, 500));
  }
};
