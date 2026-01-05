import express from "express";
import postController from "../controllers/post.controller";

const router = express.Router();

router.get("/", postController.getAllPosts);
router.get("/:id", postController.getPostById);
router.post("/", postController.addPost);
router.put("/:id", postController.updatePost);
router.get("/", postController.deletePost);

export default router;
