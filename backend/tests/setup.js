const mongoose = require('mongoose');

beforeAll(async () => {
  try {
    // Use MONGO_URI if provided (GitHub Actions with MongoDB service)
    // Otherwise use mongodb-memory-server (local development)
    const mongoUri = process.env.MONGO_URI;
    
    if (mongoUri) {
      // CI environment: connect to MongoDB service container
      await mongoose.connect(mongoUri);
    } else {
      // Local environment: use mongodb-memory-server
      const { MongoMemoryServer } = require('mongodb-memory-server');
      global.mongoServer = await MongoMemoryServer.create();
      const uri = global.mongoServer.getUri();
      await mongoose.connect(uri);
    }
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
    // Only stop memory server if it was created (local environment)
    if (global.mongoServer) {
      await global.mongoServer.stop();
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