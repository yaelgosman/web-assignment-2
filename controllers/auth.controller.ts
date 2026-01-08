import { Request, Response, NextFunction } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/user.model";

interface ITokenPayload {
  userId: string;
}

const authController = {
  async register(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { username, email, password, firstName, lastName, age } = req.body;
    try {
      const existUser = await User.exists({ email });
      if (existUser) {
        res.status(409).json({ error: "Email already exists!" });
        return;
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      const newUser = new User<Partial<IUser>>({
        username,
        email,
        password: hashedPassword,
        firstName,
        lastName,
        age,
      });
      await newUser.save();

      res
        .status(201)
        .json({ message: "User registered successfully", newUser });
    } catch (ex) {
      res
        .status(500)
        .json({
          error: `Registration failed: ${ex instanceof Error ? ex.message : "Unknown error"
            }`,
        });
    }
  },

  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { email, password } = req.body;

    try {
      const user = await User.findOne({ email }).select("+password");
      if (!user) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        res.status(401).json({ error: "Invalid credentials" });
        return;
      }

      const accessToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN } as any
      );
      const refreshToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_REFRESH_SECRET!,
        { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN } as any
      );

      user.refreshToken = refreshToken;
      await user.save();

      res
        .status(200)
        .json({ message: "Login successful", accessToken, refreshToken });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },

  async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token required" });
      return;
    }

    try {
      const decodedToken = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!
      ) as ITokenPayload;
      const user = await User.findById(decodedToken.userId).select(
        "+refreshToken"
      );

      if (!user || user.refreshToken !== refreshToken) {
        res.status(401).json({ error: "Invalid refresh token" });
        return;
      }

      user.refreshToken = null;
      await user.save();

      res.status(200).json({ message: "Logged out successfully" });
    } catch (err) {
      res.status(401).json({ error: "Invalid refresh token" });
    }
  },

  async refreshToken(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(400).json({ error: "Refresh token required" });
      return;
    }

    try {
      const decodedToken = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!
      ) as ITokenPayload;
      const user = await User.findById(decodedToken.userId).select(
        "+refreshToken"
      );

      if (!user || user.refreshToken !== refreshToken) {
        res.status(401).json({ error: "Invalid refresh token" });
        return;
      }

      const newAccessToken = jwt.sign(
        { userId: user._id },
        process.env.JWT_SECRET!,
        { expiresIn: process.env.JWT_EXPIRES_IN } as any
      );
      res.status(200).json({ accessToken: newAccessToken });
    } catch (err) {
      res.status(401).json({ error: "Invalid or expired refresh token" });
    }
  },
};

export default authController;