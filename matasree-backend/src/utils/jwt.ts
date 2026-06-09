import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';

export interface ITokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role: 'admin' | 'customer';
}

export const generateAccessToken = (userId: string, email: string, role: string): string => {
  const secret: Secret = (process.env.JWT_SECRET || 'default_secret') as Secret;
  const options: SignOptions = {
    expiresIn: (process.env.JWT_EXPIRE || '7d') as any,
  };
  return jwt.sign({ userId, email, role }, secret, options);
};

export const generateRefreshToken = (userId: string): string => {
  const secret: Secret = (process.env.JWT_REFRESH_SECRET || 'default_refresh_secret') as Secret;
  const options: SignOptions = {
    expiresIn: (process.env.JWT_REFRESH_EXPIRE || '30d') as any,
  };
  const jti = crypto.randomBytes(16).toString('hex');
  return jwt.sign({ userId, jti }, secret, options);
};

export const verifyAccessToken = (token: string): ITokenPayload => {
  const secret: Secret = (process.env.JWT_SECRET || 'default_secret') as Secret;
  return jwt.verify(token, secret) as ITokenPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  const secret: Secret = (process.env.JWT_REFRESH_SECRET || 'default_refresh_secret') as Secret;
  return jwt.verify(token, secret) as JwtPayload;
};
