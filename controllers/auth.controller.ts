import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/user.model";

interface ITokenPayload {
  userId: string;
}

type JwtExpiresIn = number | `${number}${"s" | "m" | "h" | "d"}`;

const JWT_SECRET = process.env.JWT_SECRET as string;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET as string;

const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN as JwtExpiresIn;
const JWT_REFRESH_EXPIRES_IN = process.env
  .JWT_REFRESH_EXPIRES_IN as JwtExpiresIn;

const signAccessToken = (userId: string) =>
  jwt.sign({ userId }, JWT_SECRET!, {
    expiresIn: JWT_EXPIRES_IN ?? "234",
  });

const signRefreshToken = (userId: string) =>
  jwt.sign({ userId }, JWT_REFRESH_SECRET!, {
    expiresIn: JWT_REFRESH_EXPIRES_IN,
  });

const authController = {
  async register(req: Request, res: Response): Promise<void> {
    const { username, email, password, firstName, lastName, age } = req.body;

    try {
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        res.status(409).json({ error: "Email already exists" });
        return;
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        age,
      });

      res.status(201).json({
        message: "User registered successfully",
        user: {
          id: user._id,
          username: user.username,
          email: user.email,
        },
      });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : "Registration failed",
      });
    }
  },

  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email }).select(
        "+password +refreshToken"
      );
      if (!user) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const accessToken = signAccessToken(user._id.toString());
      const refreshToken = signRefreshToken(user._id.toString());

      user.refreshToken = refreshToken;
      await user.save();

      res.status(200).json({ accessToken, refreshToken });
    } catch (err) {
      res.status(500).json({
        error: err instanceof Error ? err.message : "Login failed",
      });
    }
  },

  async logout(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token required" });
      return;
    }

    try {
      const payload = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!
      ) as ITokenPayload;

      const user = await User.findById(payload.userId).select("+refreshToken");
      if (!user || user.refreshToken !== refreshToken) {
        res.status(401).json({ error: "Invalid refresh token" });
        return;
      }

      user.refreshToken = null;
      await user.save();

      res.status(200).json({ message: "Logged out successfully" });
    } catch {
      res.status(401).json({ error: "Invalid refresh token" });
    }
  },

  async refreshToken(req: Request, res: Response): Promise<void> {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token required" });
      return;
    }

    try {
      const payload = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!
      ) as ITokenPayload;

      const user = await User.findById(payload.userId).select("+refreshToken");
      if (!user || user.refreshToken !== refreshToken) {
        res.status(401).json({ error: "Invalid refresh token" });
        return;
      }

      const newAccessToken = signAccessToken(user._id.toString());
      res.status(200).json({ accessToken: newAccessToken });
    } catch {
      res.status(401).json({ error: "Invalid or expired refresh token" });
    }
  },
};

export default authController;
