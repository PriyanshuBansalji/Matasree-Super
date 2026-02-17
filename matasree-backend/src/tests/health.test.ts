import request from 'supertest';
import app from '../server';
import { disconnectDB } from '../config/database';
import mongoose from 'mongoose';

describe('Health Check', () => {
    afterAll(async () => {
        // Clean up
        await disconnectDB();
        await mongoose.connection.close();
    });

    it('should return 200 OK', async () => {
        const res = await request(app).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Server is running');
    });

    it('should return 404 for unknown route', async () => {
        const res = await request(app).get('/api/invalid-route');
        expect(res.status).toBe(404);
    });
});
