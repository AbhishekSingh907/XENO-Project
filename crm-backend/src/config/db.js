const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod = null;

async function connectDB() {
  let dbUrl = process.env.MONGODB_URI;

  if (dbUrl) {
    console.log(`Attempting to connect to custom MongoDB: ${dbUrl}`);
    try {
      // Set a 3-second timeout for connection selection so we fail fast if server is stopped
      await mongoose.connect(dbUrl, {
        serverSelectionTimeoutMS: 3000
      });
      console.log("MongoDB connected successfully using Mongoose.");
      return;
    } catch (err) {
      console.warn(`[DB Warn] Failed to connect to local MongoDB (${err.message}).`);
      console.warn("Falling back to local in-memory MongoDB server instance...");
    }
  }

  // Fallback / Default: Spin up Memory Server
  try {
    console.log("Initializing local in-memory MongoDB server...");
    mongod = await MongoMemoryServer.create();
    const memoryUri = mongod.getUri();
    
    await mongoose.connect(memoryUri);
    console.log(`Local In-Memory MongoDB running & connected at: ${memoryUri}`);
  } catch (err) {
    console.error("Critical: Failed to launch fallback MongoDB Memory Server:", err.message);
    process.exit(1);
  }
}

async function closeDB() {
  try {
    await mongoose.connection.close();
    if (mongod) {
      await mongod.stop();
    }
    console.log("MongoDB connection closed.");
  } catch (err) {
    console.error("Error during DB shutdown:", err.message);
  }
}

module.exports = { connectDB, closeDB };
