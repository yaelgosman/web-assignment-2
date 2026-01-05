import express from "express";
import postRoutes from "./post.routes";
import commentRoutes from "./comment.routes";

const router = express.Router();

router.use("/post", postRoutes);
router.use("/comment", commentRoutes);

export default router;
