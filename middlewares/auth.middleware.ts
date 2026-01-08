import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/user.model";

interface ITokenPayload {
  userId: string;
}

const isAuthorized = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: "Authorization header not found!" });
    return;
  }

  const [scheme, token] = authHeader.split(" ");
  if (scheme !== "Bearer" || !token) {
    res.status(401).json({ error: "Authorization token missing!" });
    return;
  }

  try {
    const decodedToken = jwt.verify(
      token,
      process.env.JWT_SECRET!
    ) as ITokenPayload;
    const user: IUser | null = await User.findById(decodedToken.userId);

    if (!user) {
      res.status(401).json({ error: "User not found!" });
      return;
    }

    next();
  } catch {
    res.status(401).json({ error: "Not Authorized!" });
  }
};

export default isAuthorized;
