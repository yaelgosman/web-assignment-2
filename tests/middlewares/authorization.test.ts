import isAuthorized from '../../middlewares/auth.middleware';
import { token, userId } from '../setup';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import User from '../../models/user.model';

describe('isAuthorized Middleware', () => {
  const createMockResponse = () => {
    let statusCode: any = null;
    let body = {};
    return {
      status: jest.fn().mockImplementation((code: number) => {
        statusCode = code;
        return {
          json: jest.fn().mockImplementation((data: any) => {
            body = data;
          }),
        };
      }),
      get statusCode() {
        return statusCode;
      },
      get body() {
        return body;
      },
    };
  };

  it('should return 403 if no authorization header is provided', async () => {
    const req = { headers: {} } as Partial<Request>;
    const res = createMockResponse() as any;
    const next = jest.fn() as NextFunction;

    await isAuthorized(req as Request, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'Authorization header not found!' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if the token is missing', async () => {
    const req = { headers: { authorization: 'Bearer ' } } as Partial<Request>;
    const res = createMockResponse() as any;
    const next = jest.fn() as NextFunction;

    await isAuthorized(req as Request, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'Authorization token missing!' });
    expect(next).not.toHaveBeenCalled();
  });

  it('should return 403 if the token is invalid', async () => {
    const req = { headers: { authorization: 'Bearer invalid_token' } } as Partial<Request>;
    const res = createMockResponse() as any;
    const next = jest.fn() as NextFunction;

    jest.spyOn(jwt, 'verify').mockImplementation(() => {
      throw new Error('Invalid token');
    });

    await isAuthorized(req as Request, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'Not Authorized!' });
    expect(next).not.toHaveBeenCalled();

    (jwt.verify as jest.Mock).mockRestore();
  });

  it('should return 403 if the user not exist', async () => {
    const req = { headers: { authorization: token } } as Partial<Request>;
    const res = createMockResponse() as any;
    const next = jest.fn() as NextFunction;

    // @ts-ignore
    jest.spyOn(jwt, 'verify').mockReturnValue({ userId: 'non_existent_user_id' });
    jest.spyOn(User, 'findById').mockResolvedValueOnce(null);

    await isAuthorized(req as Request, res, next);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: 'Not Authorized!' });
    expect(next).not.toHaveBeenCalled();

    (jwt.verify as jest.Mock).mockRestore();
    jest.restoreAllMocks();
  });

  it('should call next() for a valid token and existing user', async () => {
    const req = { headers: { authorization: token } } as Partial<Request>;
    const res = createMockResponse() as any;
    const next = jest.fn() as NextFunction;

    // @ts-ignore
    jest.spyOn(jwt, 'verify').mockReturnValue({ userId: userId.toString() });
    jest.spyOn(User, 'findById').mockResolvedValueOnce({ _id: userId });

    await isAuthorized(req as Request, res, next);

    expect(next).toHaveBeenCalled();
    expect(res.statusCode).toBeNull();

    (jwt.verify as jest.Mock).mockRestore();
    jest.restoreAllMocks();
  });
});
