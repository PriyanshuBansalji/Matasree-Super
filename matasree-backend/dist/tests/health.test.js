"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const server_1 = __importDefault(require("../server"));
const database_1 = require("../config/database");
const mongoose_1 = __importDefault(require("mongoose"));
describe('Health Check', () => {
    afterAll(async () => {
        // Clean up
        await (0, database_1.disconnectDB)();
        await mongoose_1.default.connection.close();
    });
    it('should return 200 OK', async () => {
        const res = await (0, supertest_1.default)(server_1.default).get('/api/health');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.message).toBe('Matasree API is running');
    });
    it('should return 404 for unknown route', async () => {
        const res = await (0, supertest_1.default)(server_1.default).get('/api/invalid-route');
        expect(res.status).toBe(404);
    });
});
//# sourceMappingURL=health.test.js.map