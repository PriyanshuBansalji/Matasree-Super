import request from 'supertest';
import app from '../server';
import User from '../models/User';
import { disconnectDB } from '../config/database';
import mongoose from 'mongoose';

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
        if (mongoose.connection.readyState === 0) {
            await mongoose.connect(process.env.MONGODB_URI as string);
        }
        await User.deleteMany({});
    });

    afterAll(async () => {
        await User.deleteMany({});
        await disconnectDB();
        await mongoose.connection.close();
    });

    const testUser = {
        name: 'Test User',
        email: 'test@example.com',
        password: 'password123',
        phone: '1234567890'
    };

    it('should register a new user', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send(testUser);

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data).toHaveProperty('accessToken');
        expect(res.body.data.user).toHaveProperty('email', testUser.email);
    });

    it('should login the user', async () => {
        const res = await request(app)
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
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                email: testUser.email,
                password: 'wrongpassword'
            });

        expect(res.status).toBe(401); // Or 401 depending on implementation
        expect(res.body.success).toBe(false);
    });
});
