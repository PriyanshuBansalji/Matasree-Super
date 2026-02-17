
// Setup file for Jest
// This runs before each test

// Mock environment variables if needed
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/matasree-test';
process.env.JWT_SECRET = 'test-secret';
