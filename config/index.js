import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

const config = {
  port: process.env.PORT || 3000,
  env: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGODB_URI,
  dbName: process.env.DB_NAME,
};

export default config;
