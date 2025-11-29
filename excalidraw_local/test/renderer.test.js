const request = require('supertest');
const path = require('path');
const fs = require('fs');
const app = require('../src/server');

describe('Excalidraw API Tests', () => {
  let server;

  beforeAll(async () => {
    // 启动测试服务器
    const PORT = 3001; // 使用不同端口避免冲突
    server = app.listen(PORT);

    // 等待服务器启动
    await new Promise(resolve => {
      server.on('listening', resolve);
    });
  });

  afterAll(async () => {
    if (server) {
      await new Promise(resolve => {
        server.close(resolve);
      });
    }
  });

  describe('Health Check', () => {
    test('GET /health should return healthy status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body.status).toBe('healthy');
      expect(response.body.pool).toBeDefined();
      expect(response.body.stats).toBeDefined();
    });
  });

  describe('API Documentation', () => {
    test('GET /api should return API documentation', async () => {
      const response = await request(app)
        .get('/api')
        .expect(200);

      expect(response.body.name).toBe('Excalidraw API');
      expect(response.body.endpoints).toBeDefined();
      expect(response.body.endpoints['POST /api/render']).toBeDefined();
    });
  });

  describe('JSON Rendering', () => {
    test('POST /api/render should render simple rectangle', async () => {
      const simpleData = {
        type: "excalidraw",
        version: 2,
        elements: [
          {
            id: "rect-1",
            type: "rectangle",
            x: 100,
            y: 100,
            width: 200,
            height: 100,
            strokeColor: "#e67700",
            backgroundColor: "#fff3bf",
            fillStyle: "solid",
            strokeWidth: 2,
            strokeStyle: "solid",
            roughness: 0,
            opacity: 100
          }
        ],
        appState: {
          viewBackgroundColor: "#ffffff"
        }
      };

      const response = await request(app)
        .post('/api/render')
        .send(simpleData)
        .expect(200);

      expect(response.headers['content-type']).toMatch(/image\/png/);
      expect(response.body).toBeInstanceOf(Buffer);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('POST /api/render should render text element', async () => {
      const textData = {
        type: "excalidraw",
        version: 2,
        elements: [
          {
            id: "text-1",
            type: "text",
            x: 100,
            y: 100,
            width: 200,
            height: 40,
            text: "Hello World",
            fontSize: 20,
            fontFamily: 1,
            textAlign: "center",
            verticalAlign: "middle",
            strokeColor: "#000000",
            opacity: 100
          }
        ],
        appState: {
          viewBackgroundColor: "#ffffff"
        }
      };

      const response = await request(app)
        .post('/api/render')
        .send(textData)
        .expect(200);

      expect(response.headers['content-type']).toMatch(/image\/png/);
      expect(response.body).toBeInstanceOf(Buffer);
    });

    test('POST /api/render should handle multiple elements', async () => {
      const multiData = {
        type: "excalidraw",
        version: 2,
        elements: [
          {
            id: "rect-1",
            type: "rectangle",
            x: 50,
            y: 50,
            width: 150,
            height: 80,
            strokeColor: "#1971c2",
            backgroundColor: "#e7f5ff",
            fillStyle: "solid",
            strokeWidth: 2,
            strokeStyle: "solid",
            roughness: 0,
            opacity: 100
          },
          {
            id: "rect-2",
            type: "rectangle",
            x: 250,
            y: 50,
            width: 150,
            height: 80,
            strokeColor: "#2f9e44",
            backgroundColor: "#ebfbee",
            fillStyle: "solid",
            strokeWidth: 2,
            strokeStyle: "solid",
            roughness: 0,
            opacity: 100
          },
          {
            id: "arrow-1",
            type: "arrow",
            x: 200,
            y: 90,
            width: 50,
            height: 0,
            strokeColor: "#495057",
            strokeWidth: 2,
            strokeStyle: "solid",
            roughness: 0,
            opacity: 100,
            points: [[0, 0], [50, 0]],
            endArrowhead: "arrow"
          }
        ],
        appState: {
          viewBackgroundColor: "#ffffff"
        }
      };

      const response = await request(app)
        .post('/api/render')
        .send(multiData)
        .expect(200);

      expect(response.headers['content-type']).toMatch(/image\/png/);
      expect(response.body).toBeInstanceOf(Buffer);
    });

    test('POST /api/render should handle different formats', async () => {
      const simpleData = {
        type: "excalidraw",
        version: 2,
        elements: [
          {
            id: "rect-1",
            type: "rectangle",
            x: 100,
            y: 100,
            width: 200,
            height: 100,
            strokeColor: "#e67700",
            backgroundColor: "#fff3bf",
            fillStyle: "solid",
            strokeWidth: 2,
            strokeStyle: "solid",
            roughness: 0,
            opacity: 100
          }
        ],
        appState: {
          viewBackgroundColor: "#ffffff"
        }
      };

      // Test JPEG format
      const jpegResponse = await request(app)
        .post('/api/render?format=jpeg&quality=80')
        .send(simpleData)
        .expect(200);

      expect(jpegResponse.headers['content-type']).toMatch(/image\/jpeg/);

      // Test WebP format (if supported)
      const webpResponse = await request(app)
        .post('/api/render?format=webp&quality=80')
        .send(simpleData)
        .expect(200);

      expect(webpResponse.headers['content-type']).toMatch(/image\/webp/);
    });
  });

  describe('File Upload Rendering', () => {
    test('POST /api/render/file should render uploaded JSON file', async () => {
      const fixturePath = path.join(__dirname, '../examples/simple-rectangle.json');
      const fileBuffer = fs.readFileSync(fixturePath);

      const response = await request(app)
        .post('/api/render/file')
        .attach('file', fileBuffer, 'test-diagram.json')
        .expect(200);

      expect(response.headers['content-type']).toMatch(/image\/png/);
      expect(response.body).toBeInstanceOf(Buffer);
      expect(response.body.length).toBeGreaterThan(0);
    });

    test('POST /api/render/file should reject non-JSON files', async () => {
      const response = await request(app)
        .post('/api/render/file')
        .attach('file', Buffer.from('not json'), 'test.txt')
        .expect(400);

      expect(response.body.error).toBe('Invalid data');
    });

    test('POST /api/render/file should handle missing file', async () => {
      const response = await request(app)
        .post('/api/render/file')
        .expect(400);

      expect(response.body.error).toBe('No file uploaded');
    });
  });

  describe('Error Handling', () => {
    test('POST /api/render should reject invalid JSON structure', async () => {
      const invalidData = {
        // Missing required fields
        elements: []
      };

      const response = await request(app)
        .post('/api/render')
        .send(invalidData)
        .expect(400);

      expect(response.body.error).toBe('Invalid data');
      expect(response.body.details).toBeDefined();
    });

    test('POST /api/render should reject empty elements array', async () => {
      const emptyData = {
        type: "excalidraw",
        version: 2,
        elements: [],
        appState: {
          viewBackgroundColor: "#ffffff"
        }
      };

      const response = await request(app)
        .post('/api/render')
        .send(emptyData)
        .expect(400);

      expect(response.body.error).toBe('Invalid data');
    });

    test('POST /api/render should handle malformed JSON', async () => {
      const malformedData = {
        type: "excalidraw",
        version: 2,
        elements: [
          {
            id: "rect-1",
            type: "rectangle",
            // Missing required properties
            x: "invalid", // Should be number
            width: -100   // Should be non-negative
          }
        ]
      };

      const response = await request(app)
        .post('/api/render')
        .send(malformedData)
        .expect(400);

      expect(response.body.error).toBe('Invalid data');
    });

    test('should handle 404 for unknown endpoints', async () => {
      const response = await request(app)
        .get('/unknown-endpoint')
        .expect(404);

      expect(response.body.error).toBe('Not found');
    });
  });

  describe('Query Parameters', () => {
    test('should handle custom dimensions', async () => {
      const simpleData = {
        type: "excalidraw",
        version: 2,
        elements: [
          {
            id: "rect-1",
            type: "rectangle",
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            strokeColor: "#000000",
            backgroundColor: "#ffffff",
            fillStyle: "solid",
            strokeWidth: 1,
            opacity: 100
          }
        ],
        appState: {
          viewBackgroundColor: "#ffffff"
        }
      };

      const response = await request(app)
        .post('/api/render?width=400&height=300')
        .send(simpleData)
        .expect(200);

      expect(response.headers['content-type']).toMatch(/image\/png/);
      expect(response.body).toBeInstanceOf(Buffer);
    });

    test('should handle invalid query parameters', async () => {
      const simpleData = {
        type: "excalidraw",
        version: 2,
        elements: [
          {
            id: "rect-1",
            type: "rectangle",
            x: 0,
            y: 0,
            width: 100,
            height: 50,
            strokeColor: "#000000",
            backgroundColor: "#ffffff",
            fillStyle: "solid",
            strokeWidth: 1,
            opacity: 100
          }
        ],
        appState: {
          viewBackgroundColor: "#ffffff"
        }
      };

      const response = await request(app)
        .post('/api/render?format=invalid&quality=150')
        .send(simpleData)
        .expect(400);

      expect(response.body.error).toBe('Invalid options');
    });
  });

  describe('Performance', () => {
    test('should include performance headers', async () => {
      const simpleData = {
        type: "excalidraw",
        version: 2,
        elements: [
          {
            id: "rect-1",
            type: "rectangle",
            x: 100,
            y: 100,
            width: 200,
            height: 100,
            strokeColor: "#e67700",
            backgroundColor: "#fff3bf",
            fillStyle: "solid",
            strokeWidth: 2,
            strokeStyle: "solid",
            roughness: 0,
            opacity: 100
          }
        ],
        appState: {
          viewBackgroundColor: "#ffffff"
        }
      };

      const response = await request(app)
        .post('/api/render')
        .send(simpleData)
        .expect(200);

      expect(response.headers['x-render-time']).toBeDefined();
      expect(response.headers['x-elements-count']).toBe('1');
    });
  });
});