// API Response wrapper for consistent responses
export class ApiResponse<T = any> {
  constructor(
    public success: boolean,
    public message: string,
    public data?: T,
    public statusCode: number = 200
  ) {}
}

// API Error response
export class ApiError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public errors: any[] = []
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
