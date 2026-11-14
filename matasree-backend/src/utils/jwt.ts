import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';
import crypto from 'crypto';

export interface ITokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role: 'admin' | 'customer';
}

export const generateAccessToken = (userId: string, email: string, role: string): string => {
  const secret: Secret = process.env.JWT_SECRET || 'default_secret';
  const expire = process.env.JWT_EXPIRE || '7d';
  // Cast to bypass strict StringValue type — runtime value is valid
  return jwt.sign({ userId, email, role }, secret, { expiresIn: expire } as SignOptions);
};

export const generateRefreshToken = (userId: string): string => {
  const secret: Secret = process.env.JWT_REFRESH_SECRET || 'default_refresh_secret';
  const expire = process.env.JWT_REFRESH_EXPIRE || '30d';
  const jti = crypto.randomBytes(16).toString('hex');
  return jwt.sign({ userId, jti }, secret, { expiresIn: expire } as SignOptions);
};

export const verifyAccessToken = (token: string): ITokenPayload => {
  const secret: Secret = process.env.JWT_SECRET || 'default_secret';
  return jwt.verify(token, secret) as ITokenPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  const secret: Secret = process.env.JWT_REFRESH_SECRET || 'default_refresh_secret';
  return jwt.verify(token, secret) as JwtPayload;
};
