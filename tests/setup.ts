import mongoose from 'mongoose';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User, { IUser } from '../models/user.model';
import bcrypt from "bcrypt";

dotenv.config();

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

beforeAll(async () => {
  const testUri = process.env.DB_CONNECT_TEST;
  if (!testUri) {
    throw new Error('DB_CONNECT_TEST is not defined in the .env file');
  }

  try {
    await mongoose.connect(testUri);
    console.log('Connected to the test database');
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
    console.log('Disconnected from the test database');
  } catch (error) {
    console.error('Error cleaning up the test database:', error);
  }
});

export default testSetup;
