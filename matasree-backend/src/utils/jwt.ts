import jwt, { JwtPayload, Secret, SignOptions } from 'jsonwebtoken';

export interface ITokenPayload extends JwtPayload {
  userId: string;
  email: string;
  role: 'admin' | 'customer';
}

export const generateAccessToken = (userId: string, email: string, role: string): string => {
  const secret: Secret = (process.env.JWT_SECRET || 'default_secret') as Secret;
  return jwt.sign({ userId, email, role }, secret, {
    expiresIn: (process.env.JWT_EXPIRE || '7d') as SignOptions['expiresIn'],
  } as SignOptions);
};

export const generateRefreshToken = (userId: string): string => {
  const secret: Secret = (process.env.JWT_REFRESH_SECRET || 'default_refresh_secret') as Secret;
  return jwt.sign({ userId }, secret, {
    expiresIn: (process.env.JWT_REFRESH_EXPIRE || '30d') as SignOptions['expiresIn'],
  } as SignOptions);
};

export const verifyAccessToken = (token: string): ITokenPayload => {
  const secret: Secret = (process.env.JWT_SECRET || 'default_secret') as Secret;
  return jwt.verify(token, secret) as ITokenPayload;
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  const secret: Secret = (process.env.JWT_REFRESH_SECRET || 'default_refresh_secret') as Secret;
  return jwt.verify(token, secret) as JwtPayload;
};
