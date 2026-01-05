import express from "express";
import postRoutes from "./post.routes";
import commentRoutes from "./comment.routes";
import userRoutes from "./user.routes";
import authRoutes from "./auth.routes";
import isAuthorized from "../middlewares/auth.middleware";

const router = express.Router();

router.use("/post", isAuthorized, postRoutes);
router.use("/comment", isAuthorized, commentRoutes);
router.use("/user", isAuthorized, userRoutes);
router.use("/auth", authRoutes);

export default router;
