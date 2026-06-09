import { Response } from 'express';
export declare const submitPartnershipApplication: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getPartnershipApplications: (req: any, res: Response) => Promise<void>;
export declare const getPartnershipApplicationById: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const getAllPartnershipApplications: (req: any, res: Response) => Promise<void>;
export declare const updatePartnershipStatus: (req: any, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=partnershipController.d.ts.map