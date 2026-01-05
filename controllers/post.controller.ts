import { Request, Response } from "express";
import mongoose from "mongoose";
import Post, { IPost } from "../models/post.model";
import Comment from "../models/comment.model";

const postController = {
  async getAllPosts(req: Request, res: Response): Promise<void> {
    try {
      const sender = req.query.sender as string;

      const posts = sender ? await Post.find({ sender }) : await Post.find();

      res.json(posts);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async getPostById(req: Request, res: Response): Promise<void> {
    try {
      const post = await Post.findById(req.params.id).populate(
        "sender comments"
      );
      if (!post) {
        res.status(404).json({ error: "Post not found" });
        return;
      }
      res.json(post);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  },

  async addPost(req: Request, res: Response): Promise<void> {
    try {
      const newPost = new Post<IPost>(req.body);
      const post = await newPost.save();
      res.status(201).json(post);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async updatePost(req: Request, res: Response): Promise<void> {
    try {
      const post = await Post.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
      });
      if (!post) {
        res.status(404).json({ error: "Post not found" });
        return;
      }
      res.json(post);
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  },

  async deletePost(req: Request, res: Response): Promise<void> {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const { id } = req.params;

      const post = await Post.findByIdAndDelete(id).session(session);
      if (!post) {
        await session.abortTransaction();
        res.status(404).json({ error: "Post not found" });
        return;
      }

      await Comment.deleteMany({ postId: id }).session(session);
      await post.deleteOne({ session });
      await session.commitTransaction();

      res.json({ message: "Post deleted successfully" });
    } catch (error: any) {
      await session.abortTransaction();
      res.status(500).json({ error: error.message });
    } finally {
      session.endSession();
    }
  },
};

export default postController;
