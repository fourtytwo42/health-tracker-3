import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createServer } from 'http';
import { NextRequest } from 'next/server';
import { GET } from '../../app/api/healthz/route';

// Create a simple test server
const app = createServer(async (req, res) => {
  if (req.url === '/api/healthz' && req.method === 'GET') {
    const response = await GET();
    const data = await response.json();
    
    res.writeHead(response.status, {
      'Content-Type': 'application/json'
    });
    res.end(JSON.stringify(data));
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

describe('Health API Integration', () => {
  let server: any;

  beforeAll(() => {
    server = app.listen(0); // Use random port
  });

  afterAll((done) => {
    server.close(done);
  });

  it('should return health status (may be unhealthy in test env)', async () => {
    const response = await request(server)
      .get('/api/healthz');

    expect([200, 503]).toContain(response.status);
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('database');
  });

  it('should have correct content type', async () => {
    const response = await request(server)
      .get('/api/healthz')
      .expect('Content-Type', /json/);
  });
}); 