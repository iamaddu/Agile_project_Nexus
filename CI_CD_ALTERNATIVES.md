# GitHub Actions CI/CD - Alternative MongoDB Approach

If the `libssl3`/`libssl1.1` approach doesn't work, here's an alternative workflow using a MongoDB service container instead of mongodb-memory-server.

## Option 1: Current Approach (mongodb-memory-server with system libraries)

**File:** `.github/workflows/build-test.yml`

**Pros:**
- ✅ Tests are isolated (fresh DB each run)
- ✅ No container startup overhead
- ✅ Faster for small test suites

**Cons:**
- ❌ Requires system OpenSSL libraries
- ❌ Downloads MongoDB binary at runtime
- ❌ Dependent on external dependencies

## Option 2: MongoDB Service Container (More Reliable in CI)

Replace the `backend-tests` job with:

```yaml
backend-tests:
  runs-on: ubuntu-latest
  
  services:
    mongodb:
      image: mongo:7.0
      options: >-
        --health-cmd "mongosh --eval 'db.adminCommand(\"ping\")'"
        --health-interval 10s
        --health-timeout 5s
        --health-retries 5
      ports:
        - 27017:27017
      env:
        MONGO_INITDB_ROOT_USERNAME: admin
        MONGO_INITDB_ROOT_PASSWORD: admin123

  steps:
  - uses: actions/checkout@v4
  
  - name: Setup Node.js
    uses: actions/setup-node@v4
    with:
      node-version: '18'
      cache: 'npm'
      cache-dependency-path: backend/package-lock.json
  
  - name: Install Backend Dependencies
    run: cd backend && npm ci
  
  - name: Run Backend Tests (with MongoDB container)
    run: cd backend && npm test -- --coverage --watchAll=false --testTimeout=30000
    env:
      MONGO_URI: mongodb://admin:admin123@localhost:27017/nexus_cognitive?authSource=admin
```

### Update `backend/tests/setup.js` for Service Container

Replace the current setup with:

```javascript
const mongoose = require('mongoose');

beforeAll(async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://admin:admin123@localhost:27017/nexus_cognitive?authSource=admin';
    await mongoose.connect(mongoUri);
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error);
    throw error;
  }
}, 60000);

afterAll(async () => {
  try {
    if (mongoose.connection.readyState) {
      await mongoose.disconnect();
    }
  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}, 60000);

afterEach(async () => {
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  } catch (error) {
    console.error('Error clearing collections:', error);
  }
}, 30000);
```

### Update `backend/package.json` Test Script

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

Remove the environment variable from CI step, use `MONGO_URI` instead.

## Comparison

| Aspect | mongodb-memory-server | MongoDB Container |
|--------|----------------------|-------------------|
| Setup complexity | Medium | Simple |
| System dependencies | Required | None |
| Test isolation | Perfect | Manual cleanup |
| CI reliability | Fragile | Robust |
| Speed | Slower (bootstrap) | Faster (reusable) |
| Resource usage | Lower | Higher |
| Recommended for CI | ❌ Hard | ✅ Better |

## What to Do Now

1. **Try current fix first**: Wait for the `libssl3`/`libssl1.1` workflow to complete
   - If it passes: Keep current approach ✅
   - If it fails: Switch to Option 2

2. **To switch to Option 2** (MongoDB Container):
   - Update `.github/workflows/build-test.yml` (replace backend-tests job)
   - Update `backend/tests/setup.js` (use MONGO_URI env var, remove mongodb-memory-server)
   - Update actions to v4: `actions/checkout@v4`, `actions/setup-node@v4`
   - Commit and push
   - Workflow will use MongoDB service container ✅

## Status

- Current fix pushed: `f397ee5`
- Alternative approach documented above
- Choose based on which works in GitHub Actions
