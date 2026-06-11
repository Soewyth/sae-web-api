process.env.JWT_SECRET = 'test-jwt-secret-for-testing';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
process.env.API_PORT = '3099';

afterEach(() => {
  jest.resetAllMocks();
});
