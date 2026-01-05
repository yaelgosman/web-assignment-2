import express from "express";
import commentsController from "../controllers/comment.controller";

const router = express.Router();

router.get("/:postId/comment", commentsController.getAllComments);
router.get("/:postId/comment/:commentId", commentsController.getCommentById);
router.post("/:postId/comment", commentsController.createComment);
router.put("/:postId/comment/:commentId", commentsController.updateComment);
router.delete("/:postId/comment/:commentId", commentsController.deleteComment);
router.delete("/:postId/comment", commentsController.deleteAllCommentsByPostId);

export default router;
