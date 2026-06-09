"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const server_1 = __importDefault(require("../server"));
const User_1 = __importDefault(require("../models/User"));
const database_1 = require("../config/database");
const mongoose_1 = __importDefault(require("mongoose"));
describe('Auth Routes', () => {
    beforeAll(async () => {
        // Wait for DB connection if needed
        // But app starts server which connects DB.
        // We might need to wait a bit or hook into connection.
        // Since we import app, and app.listen is called (or not depending on NODE_ENV),
        // we need to ensure DB is connected before clearing.
        // Actually, in test environment, we should connect manually if app doesn't.
        // But app calls connectDB() inside startServer() which is conditional.
        // We need to connect manually in tests if we disabled auto-start.
        if (mongoose_1.default.connection.readyState === 0) {
            await mongoose_1.default.connect(process.env.MONGODB_URI);
        }
        await User_1.default.deleteMany({});
    });
    afterAll(async () => {
        await User_1.default.deleteMany({});
        await (0, database_1.disconnectDB)();
        await mongoose_1.default.connection.close();
    });
    const testUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '1234567890'
    };
    it('should register a new user', async () => {
        const res = await (0, supertest_1.default)(server_1.default)
            .post('/api/auth/register')
            .send(testUser);
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('accessToken');
        expect(res.body.data.user).toHaveProperty('email', testUser.email);
    });
    it('should login the user', async () => {
        const res = await (0, supertest_1.default)(server_1.default)
            .post('/api/auth/login')
            .send({
            email: testUser.email,
            password: testUser.password
        });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('accessToken');
    });
    it('should not login with wrong password', async () => {
        const res = await (0, supertest_1.default)(server_1.default)
            .post('/api/auth/login')
            .send({
            email: testUser.email,
            password: 'wrongpassword'
        });
        expect(res.status).toBe(401); // Or 401 depending on implementation
        expect(res.body.success).toBe(false);
    });
});
//# sourceMappingURL=auth.test.js.map