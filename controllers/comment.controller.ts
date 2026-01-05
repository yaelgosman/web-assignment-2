import { Request, Response } from "express";
import Post, { IPost } from "../models/post.model";
import Comment, { IComment } from "../models/comment.model";
import { Types } from "mongoose";

const commentController = {
  async getAllComments(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const post = await Post.findById(postId).populate("comments");
      if (!post) {
        res.status(404).json({ error: "Post not found" });
        return;
      }
      res.status(200).json(post.comments);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getCommentById(req: Request, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const comment = await Comment.findById(commentId).populate("author");
      if (!comment) {
        res.status(404).json({ error: "Comment not found" });
        return;
      }
      res.status(200).json(comment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async createComment(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;
      const { content, author } = req.body;

      const post: IPost | null = await Post.findById(postId);
      if (!post) {
        res.status(404).json({ error: "Post not found" });
        return;
      }

      const newComment = new Comment<Partial<IComment>>({
        content,
        author,
        postId: new Types.ObjectId(postId),
      });
      await newComment.save();

      post.comments.push(<Types.ObjectId>newComment._id);
      await post.save();

      res.status(201).json(newComment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async updateComment(req: Request, res: Response): Promise<void> {
    try {
      const { commentId } = req.params;
      const { content } = req.body;

      const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        { content },
        { new: true }
      );
      if (!updatedComment) {
        res.status(404).json({ error: "Comment not found" });
        return;
      }
      res.status(200).json(updatedComment);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async deleteComment(req: Request, res: Response): Promise<void> {
    try {
      const { postId, commentId } = req.params;

      const post = await Post.findById(postId);
      if (!post) {
        res.status(404).json({ error: "Post not found" });
        return;
      }

      const commentIndex = post.comments.indexOf(new Types.ObjectId(commentId));
      if (commentIndex > -1) {
        post.comments.splice(commentIndex, 1);
      }
      await post.save();

      const deletedComment = await Comment.findByIdAndDelete(commentId);
      if (!deletedComment) {
        res.status(404).json({ error: "Comment not found" });
        return;
      }

      res.status(200).json({ message: "Comment deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async deleteAllCommentsByPostId(req: Request, res: Response): Promise<void> {
    try {
      const { postId } = req.params;

      const post = await Post.findById(postId);
      if (!post) {
        res.status(404).json({ error: "Post not found" });
        return;
      }

      await Comment.deleteMany({ postId });

      post.comments = [];
      await post.save();

      res.status(200).json({ message: "All comments deleted successfully" });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },
};

export default commentController;
