import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
export declare const submitPartnershipApplication: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPartnershipApplications: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const getPartnershipApplicationById: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getAllPartnershipApplications: (req: AuthenticatedRequest, res: Response) => Promise<void>;
export declare const updatePartnershipStatus: (req: AuthenticatedRequest, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=partnershipController.d.ts.map