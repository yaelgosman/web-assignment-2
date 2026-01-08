import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User, { IUser } from '../models/user.model';
import bcrypt from "bcrypt";
import { MongoMemoryServer } from 'mongodb-memory-server';

dotenv.config();

// Ensure basic env checks pass (defaults if missing)
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'test_refresh_secret';
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h';
process.env.JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET || !process.env.JWT_EXPIRES_IN || !process.env.JWT_REFRESH_EXPIRES_IN) {
  throw new Error('JWT environment variables are not properly configured in the .env file');
}

export const userId = new mongoose.Types.ObjectId();
export const token = `Bearer ${jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN } as any)}`;
export const refreshToken = jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN } as any);
export const getRefreshToken = (userid: mongoose.Types.ObjectId) => {
  return jwt.sign({ userId: userid }, process.env.JWT_REFRESH_SECRET!, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN } as any);
};

const testSetup = {
  token,
  refreshToken,
  userId,
};

let mongoServer: MongoMemoryServer;

beforeAll(async () => {
  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
    console.log('Connected to the in-memory test database');
  } catch (error) {
    console.error('Error connecting to the test database:', error);
    throw error;
  }
});

beforeEach(async () => {
  try {
    const password = await bcrypt.hash('securePassword123', 10);

    await User.create<Partial<IUser>>({
      _id: userId,
      username: 'testuser',
      email: 'testuser@example.com',
      firstName: 'Test',
      lastName: 'User',
      age: 25,
      password,
      refreshToken,
    });
  } catch (error) {
    console.error('Error inserting mock user:', error);
    throw error;
  }
});

afterEach(async () => {
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  } catch (error) {
    console.error('Error clearing test database:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
    await mongoose.connection.close();
    if (mongoServer) {
      await mongoServer.stop();
    }
    console.log('Disconnected from the test database');
  } catch (error) {
    console.error('Error cleaning up the test database:', error);
  }
});

export default testSetup;
