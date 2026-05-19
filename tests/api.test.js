const request = require('supertest');

const BASE_URL = 'http://localhost:3000';

describe('LinkEduHub API tests', () => {
    test('GET /api/status should return server status', async () => {
        const response = await request(BASE_URL).get('/api/status');

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('uptime');
        expect(response.body).toHaveProperty('memoryUsage');
    });

    test('GET /api/resources should return resources list', async () => {
        const response = await request(BASE_URL).get('/api/resources');

        console.log(response.statusCode);
        console.log(response.body);

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('resources');
    });

    test('GET /api/meta/resource-types should return resource types', async () => {
        const response = await request(BASE_URL).get('/api/meta/resource-types');

        expect(response.statusCode).toBe(200);
        expect(response.body).toHaveProperty('resourceTypes');
    });
});