import { Request, Response, NextFunction } from 'express';
import { ITokenPayload } from '../utils/jwt';
export interface AuthenticatedRequest extends Request {
    user?: ITokenPayload;
}
export declare const verifyToken: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const verifyAdmin: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const verifyCustomer: (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map