import mongoose from 'mongoose';
import request from 'supertest';
import * as MainModule from '../index';
import app, { startServer } from '../index';
import { token } from './setup';
import {Express} from "express";

const mockMongooseConnect = mongoose.connect as jest.Mock;

jest.mock('mongoose', () => {
    const actualMongoose = jest.requireActual('mongoose');
    return {
        ...actualMongoose,
        connect: jest.fn(() => Promise.resolve()),
    };
});

jest.spyOn(app, 'listen').mockImplementation((port, callback) => {
    if (callback) callback();
    return {
        address: () => ({
            port,
        }),
    } as unknown as ReturnType<Express['listen']>;
});

describe('Main Server Tests', () => {
    it('should start the server and connect to the database', async () => {
        const mockLog = jest.spyOn(console, 'log').mockImplementation(() => {});
        const mockError = jest.spyOn(console, 'error').mockImplementation(() => {});

        await startServer();

        expect(mockMongooseConnect).toHaveBeenCalledWith(process.env.DB_CONNECT!);
        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('MongoDB connected successfully'));
        expect(mockLog).toHaveBeenCalledWith(expect.stringContaining('Server is listening on port'));
        expect(mockError).not.toHaveBeenCalled();

        mockLog.mockRestore();
        mockError.mockRestore();
    });

    it('should handle MongoDB connection errors', async () => {
        const mockError = jest.spyOn(console, 'error').mockImplementation(() => {});

        const mongooseConnect = require('mongoose').connect as jest.Mock;
        const error = new Error('Connection failed');
        mongooseConnect.mockRejectedValueOnce(error); // Simulate connection failure

        await expect(startServer()).rejects.toThrow('Connection failed');

        expect(mockError).toHaveBeenCalledWith(
            "Error", 
            "Connection failed", 
            "Stack",
            error.stack);
    });

    it('should respond with 404 for unknown routes', async () => {
        const res = await request(app).get('/nonexistent-route');
        expect(res.status).toBe(404);
        expect(res.body).toEqual({});
    });

    it('should serve Swagger documentation on /api-docs', async () => {
        const res = await request(app).get('/api-docs').redirects(1);
        expect(res.status).toBe(200);
        expect(res.text).toContain('Swagger UI');
    });

    it('should handle a valid database operation', async () => {
        const user = {
            username: 'testuser2',
            email: 'testuser2@example.com',
            firstName: 'Test',
            lastName: 'User2',
            age: 30,
            password: 'hashedpassword',
        };

        const res = await request(app)
            .post('/auth/register')
            .send(user)
            .set('Authorization', token);

        expect(res.status).toBe(201);
        expect(res.body).toHaveProperty('newUser');
        expect(res.body.newUser.email).toBe(user.email);
    });

    it('should call startServer if DB_CONNECT_TEST is set', () => {
        process.env.NODE_ENV = 'development';
        const mockStartServer = jest.spyOn(MainModule, 'startServer').mockImplementation(() => Promise.resolve(null));
        MainModule.startServerInProd();
        expect(mockStartServer).toHaveBeenCalled();
        mockStartServer.mockRestore();
    });

    it('should not call startServer if DB_CONNECT_TEST is not set', () => {
        process.env.NODE_ENV = 'test';
        const mockStartServer = jest.spyOn(MainModule, 'startServer').mockImplementation(() => Promise.resolve(null));
        MainModule.startServerInProd();
        expect(mockStartServer).not.toHaveBeenCalled();
        mockStartServer.mockRestore();
    });
});
