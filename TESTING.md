# Testing Guide

## Test Setup

The project uses **Jest** with **ts-jest** for TypeScript support.

### Running Tests

```powershell
# Run all tests once
npm run test

# Run tests in watch mode (re-run on file changes)
npm run test:watch

# Generate coverage report
npm run test:coverage
```

### Coverage Goals

- **Statements:** 70%+
- **Branches:** 60%+
- **Functions:** 70%+
- **Lines:** 70%+

## Test Files Structure

```
backend/src/
├── tests/
│   ├── auth.test.ts         # Auth middleware & RBAC tests
│   ├── hash.test.ts         # Password hashing tests
│   ├── services/
│   │   └── auditService.test.ts
│   └── routes/
│       ├── auth.test.ts
│       └── manage.test.ts
```

## Unit Tests

### Auth Middleware (`auth.test.ts`)

Tests for RBAC permission checking:

```typescript
- ROLE_PERMISSIONS
  ✓ should have admin with all permissions
  ✓ should have editor with read and write permissions
  ✓ should have viewer with read-only permissions

- decodeToken()
  ✓ should decode valid JWT
  ✓ should throw on invalid JWT
  ✓ should throw on expired JWT

- requirePermission() middleware
  ✓ should allow admin to perform flag:write
  ✓ should allow editor to perform flag:write
  ✓ should deny viewer from performing flag:write
  ✓ should allow viewer to perform flag:read
  ✓ should deny requests without token
  ✓ should deny requests with invalid token
  ✓ should attach user claims to request
```

### Password Hashing (`hash.test.ts`)

Tests for secure password handling:

```typescript
- generateSalt()
  ✓ should generate a valid salt
  ✓ should generate different salts each time

- hashPassword()
  ✓ should hash password with salt
  ✓ should produce different hashes for different salts
  ✓ should produce same hash for same password and salt

- verifyPassword()
  ✓ should verify correct password
  ✓ should reject incorrect password
  ✓ should reject modified hash
```

## Integration Tests (Recommended)

Add tests for complete user flows:

```typescript
// tests/integration/auth.flow.test.ts
describe('Authentication Flow', () => {
  it('should complete signup → pending → approval → login flow', async () => {
    // 1. Sign up with email/password
    const signupRes = await request(app)
      .post('/api/auth/signup')
      .send({
        email: 'newuser@test.com',
        password: 'Test123!',
        requestedRole: 'editor',
      });
    expect(signupRes.status).toBe(201);
    expect(signupRes.body.user.status).toBe('pending');

    // 2. Admin approves user
    const userId = signupRes.body.user._id;
    const approveRes = await request(app)
      .post(`/api/auth/users/${userId}/approve`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ approve: true, role: 'editor' });
    expect(approveRes.status).toBe(200);

    // 3. User can now login
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'newuser@test.com',
        password: 'Test123!',
      });
    expect(loginRes.status).toBe(200);
    expect(loginRes.body.token).toBeDefined();
  });
});
```

## End-to-End Tests (E2E)

Recommended: Use Playwright or Cypress:

```bash
npm install --save-dev playwright
npx playwright install
```

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('User Authentication', () => {
  test('should login and view flags', async ({ page }) => {
    await page.goto('http://localhost:3000');
    
    // Fill login form
    await page.fill('input[name="email"]', 'admin@featureflags.local');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button:has-text("Sign In")');
    
    // Should redirect to flags page
    await page.waitForURL('http://localhost:3000/flags');
    
    // Should see flags list
    const flagsList = page.locator('[data-testid="flags-list"]');
    await expect(flagsList).toBeVisible();
  });
});
```

Run E2E tests:
```bash
npm run test:e2e
```

## Performance Tests

Use Apache JMeter or Artillery for load testing:

```yaml
# load-test.yml
config:
  target: 'http://localhost:4000'
  phases:
    - duration: 30
      arrivalRate: 10
      name: 'Warm up'
    - duration: 60
      arrivalRate: 50
      name: 'Sustained load'

scenarios:
  - name: 'Flag Evaluation'
    flow:
      - post:
          url: '/api/eval/eval'
          headers:
            Authorization: 'Bearer {{ serviceToken }}'
          json:
            key: 'test-flag'
            user: { id: '{{ $randomNumber(1, 1000) }}' }
```

Run with Artillery:
```bash
npm install --save-dev artillery
npx artillery quick --count 100 --num 1000 load-test.yml
```

## Coverage Report

After running tests with coverage:

```powershell
npm run test:coverage
```

Open the HTML report:
```powershell
Start-Process coverage/lcov-report/index.html
```

## Mocking External Services

### Mock MongoDB

```typescript
import { jest } from '@jest/globals';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  process.env.MONGO_URI = mongoServer.getUri();
});

afterAll(async () => {
  await mongoServer.stop();
});
```

### Mock Redis

```typescript
import Redis from 'ioredis-mock';

const mockRedis = new Redis();

beforeEach(async () => {
  await mockRedis.flushall();
});
```

### Mock Email Service

```typescript
jest.mock('../services/emailService.ts', () => ({
  sendEmail: jest.fn().mockResolvedValue(true),
  emailTemplates: {
    userApproved: jest.fn(),
    userRejected: jest.fn(),
  },
}));
```

## Test Best Practices

1. **Arrange-Act-Assert (AAA) Pattern:**
   ```typescript
   it('should verify password correctly', () => {
     // Arrange
     const password = 'test123';
     const salt = generateSalt();
     const hash = hashPassword(password, salt);

     // Act
     const result = verifyPassword(password, salt, hash);

     // Assert
     expect(result).toBe(true);
   });
   ```

2. **Descriptive Test Names:**
   ```typescript
   ✓ Good: "should return 403 when viewer tries to write flag"
   ✗ Bad: "permission test"
   ```

3. **Isolated Tests:**
   - Each test should be independent
   - Use `beforeEach` for setup, `afterEach` for cleanup
   - Mock external dependencies

4. **Error Cases:**
   ```typescript
   it('should handle invalid tokens gracefully', () => {
     expect(() => decodeToken('invalid')).toThrow('jwt malformed');
   });
   ```

## Continuous Integration

GitHub Actions example (`.github/workflows/test.yml`):

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      mongo:
        image: mongo:7.0
      redis:
        image: redis:7.0-alpine

    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Run tests
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
```

## Debugging Tests

Run single test file:
```powershell
npx jest src/tests/auth.test.ts
```

Run tests matching pattern:
```powershell
npx jest --testNamePattern="should verify password"
```

Debug in VS Code: Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/backend/node_modules/.bin/jest",
  "args": ["--runInBand", "--no-cache"],
  "console": "integratedTerminal"
}
```

Then press F5 to start debugging.

## Test Maintenance

- ✓ Update tests when changing functionality
- ✓ Keep test data realistic
- ✓ Avoid brittle tests (don't test implementation details)
- ✓ Review coverage reports quarterly
- ✓ Add regression tests for bugs discovered
