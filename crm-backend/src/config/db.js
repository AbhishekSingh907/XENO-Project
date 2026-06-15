const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongod = null;

async function connectDB() {
  try {
    let dbUrl = process.env.MONGODB_URI;

    if (!dbUrl) {
      console.log("No MONGODB_URI environment variable detected.");
      console.log("Launching local in-memory MongoDB server instance...");
      mongod = await MongoMemoryServer.create();
      dbUrl = mongod.getUri();
      console.log(`Local MongoDB server running at: ${dbUrl}`);
    }

    await mongoose.connect(dbUrl);
    console.log("MongoDB connected successfully using Mongoose.");
  } catch (err) {
    console.error("MongoDB connection failed:", err.message);
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
