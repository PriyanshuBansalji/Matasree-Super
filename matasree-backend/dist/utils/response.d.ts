export declare class ApiResponse<T = any> {
    success: boolean;
    message: string;
    data?: T | undefined;
    statusCode: number;
    constructor(success: boolean, message: string, data?: T | undefined, statusCode?: number);
}
export declare class ApiError extends Error {
    statusCode: number;
    errors: any[];
    constructor(statusCode: number, message: string, errors?: any[]);
}
//# sourceMappingURL=response.d.ts.map