import request from 'supertest';
import mongoose, { Types } from 'mongoose';
import app from '../../index';
import Post, { IPost } from '../../models/post.model';
import Comment, { IComment } from '../../models/comment.model';
import { token, userId } from '../setup';

let postId: Types.ObjectId, commentId: Types.ObjectId;

beforeEach(async () => {
  const post = new Post<Partial<IPost>>({
    title: 'Test Post',
    content: 'Test Content',
    sender: userId,
  });
  await post.save();
  postId = post._id as Types.ObjectId;
});

describe('Comment Routes', () => {
  it('should get all comments for a post', async () => {
    const comment = new Comment<Partial<IComment>>({
      content: 'Test Comment',
      author: userId,
      postId,
    });
    await comment.save();
    await Post.findByIdAndUpdate(postId, { $push: { comments: comment._id } });

    const res = await request(app)
      .get(`/comment/${postId}/comment`)
      .set('Authorization', token);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0]._id).toBe(comment._id!.toString());
  });

  it('should return 404 when getting comments for a non-existent post', async () => {
    const fakePostId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .get(`/comment/${fakePostId}/comment`)
      .set('Authorization', token);

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Post not found');
  });

  it('should return 500 if an error occurs during getting all comments', async () => {
    jest.spyOn(Post, 'findById').mockImplementationOnce(() => {
      throw new Error('Database error');
    });

    const res = await request(app)
      .get(`/comment/${postId}/comment`)
      .set('Authorization', token);

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Database error');

    jest.restoreAllMocks();
  });

  it('should get a specific comment by ID', async () => {
    const comment = new Comment<Partial<IComment>>({
      content: 'Specific Comment',
      author: userId,
      postId,
    });
    await comment.save();

    const res = await request(app)
      .get(`/comment/${postId}/comment/${comment._id}`)
      .set('Authorization', token);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id', comment._id!.toString());
    expect(res.body.content).toBe('Specific Comment');
  });

  it('should return 404 when getting a non-existent comment', async () => {
    const fakeCommentId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .get(`/comment/${postId}/comment/${fakeCommentId}`)
      .set('Authorization', token);

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Comment not found');
  });

  it('should return 500 if an error occurs during getting a specific comments', async () => {
    jest.spyOn(Comment, 'findById').mockImplementationOnce(() => {
      throw new Error('Database error');
    });

    const comment = new Comment<Partial<IComment>>({
      content: 'Specific Comment',
      author: userId,
      postId,
    });
    await comment.save();

    const res = await request(app)
      .get(`/comment/${postId}/comment/${comment._id}`)
      .set('Authorization', token);

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Database error');

    jest.restoreAllMocks();
  });

  it('should create a new comment for a post', async () => {
    const res = await request(app)
      .post(`/comment/${postId}/comment`)
      .set('Authorization', token)
      .send({
        content: 'New Comment',
        author: userId.toString(),
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.content).toBe('New Comment');

    const post = await Post.findById(postId).populate('comments');
    expect(post?.comments.length).toBe(1);
    expect(post?.comments[0]._id.toString()).toBe(res.body._id);
  });

  it('should return 404 when creating a comment for a non-existent post', async () => {
    const fakePostId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .post(`/comment/${fakePostId}/comment`)
      .set('Authorization', token)
      .send({
        content: 'Comment for non-existent post',
        author: userId.toString(),
      });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Post not found');
  });

  it('should return 500 if an error occurs during creating a new  comments', async () => {
    jest.spyOn(Post, 'findById').mockImplementationOnce(() => {
      throw new Error('Database error');
    });

    const res = await request(app)
      .post(`/comment/${postId}/comment`)
      .set('Authorization', token)
      .send({
        content: 'New Comment',
        author: userId.toString(),
      });

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Database error');

    jest.restoreAllMocks();
  });

  it('should update an existing comment', async () => {
    const comment = new Comment<Partial<IComment>>({
      content: 'Old Comment',
      author: userId,
      postId,
    });
    await comment.save();

    const res = await request(app)
      .put(`/comment/${postId}/comment/${comment._id}`)
      .set('Authorization', token)
      .send({ content: 'Updated Comment' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id', comment._id!.toString());
    expect(res.body.content).toBe('Updated Comment');
  });

  it('should return 404 when updating a non-existent comment', async () => {
    const fakeCommentId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .put(`/comment/${postId}/comment/${fakeCommentId}`)
      .set('Authorization', token)
      .send({ content: 'Updated content for non-existent comment' });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Comment not found');
  });

  it('should return 500 if an error occurs during updating a comments', async () => {
    jest.spyOn(Comment, 'findByIdAndUpdate').mockImplementationOnce(() => {
      throw new Error('Database error');
    });

    const comment = new Comment<Partial<IComment>>({
      content: 'Old Comment',
      author: userId,
      postId,
    });
    await comment.save();

    const res = await request(app)
      .put(`/comment/${postId}/comment/${comment._id}`)
      .set('Authorization', token)
      .send({ content: 'Updated Comment' });

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Database error');

    jest.restoreAllMocks();
  });

  it('should delete a comment', async () => {
    const comment = new Comment<Partial<IComment>>({
      content: 'Comment to Delete',
      author: userId,
      postId,
    });
    await comment.save();
    await Post.findByIdAndUpdate(postId, { $push: { comments: comment._id } });

    const res = await request(app)
      .delete(`/comment/${postId}/comment/${comment._id}`)
      .set('Authorization', token);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Comment deleted successfully');

    const deletedComment = await Comment.findById(comment._id);
    expect(deletedComment).toBeNull();

    const post = await Post.findById(postId).populate('comments');
    expect(post?.comments.length).toBe(0);
  });

  it('should return 404 when deleting a comment with post not found', async () => {
    const fakePostId = new mongoose.Types.ObjectId();
    const fakeCommentId = new mongoose.Types.ObjectId();
    const res = await request(app)
      .delete(`/comment/${fakePostId}/comment/${fakeCommentId}`)
      .set('Authorization', token)
      .send({ content: 'Updated content for non-existent comment' });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Post not found');
  });

  it('should return 404 when deleting a non existing comment', async () => {
    const fakeCommentId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete(`/comment/${postId}/comment/${fakeCommentId}`)
      .set('Authorization', token)
      .send({ content: 'Updated content for non-existent comment' });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Comment not found');
  });

  it('should return 500 if an error occurs during deleting a comments', async () => {
    jest.spyOn(Comment, 'findByIdAndDelete').mockImplementationOnce(() => {
      throw new Error('Database error');
    });

    const comment = new Comment<Partial<IComment>>({
      content: 'Old Comment',
      author: userId,
      postId,
    });
    await comment.save();

    const res = await request(app)
      .delete(`/comment/${postId}/comment/${comment._id}`)
      .set('Authorization', token)
      .send({ content: 'Updated Comment' });

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Database error');

    jest.restoreAllMocks();
  });

  it('should delete all comments for a post', async () => {
    const comment1 = new Comment<Partial<IComment>>({
      content: 'Comment 1',
      author: userId,
      postId,
    });
    const comment2 = new Comment<Partial<IComment>>({
      content: 'Comment 2',
      author: userId,
      postId,
    });
    await comment1.save();
    await comment2.save();
    await Post.findByIdAndUpdate(postId, { $push: { comments: [comment1._id, comment2._id] } });

    const res = await request(app)
      .delete(`/comment/${postId}/comment`)
      .set('Authorization', token);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('All comments deleted successfully');

    const comments = await Comment.find({ postId });
    expect(comments.length).toBe(0);

    const post = await Post.findById(postId).populate('comments');
    expect(post?.comments.length).toBe(0);
  });

  it('should return 404 when deleting all comments of a post', async () => {
    const fakePostId = new mongoose.Types.ObjectId();

    const res = await request(app)
      .delete(`/comment/${fakePostId}/comment`)
      .set('Authorization', token);

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Post not found');
  });

  it('should return 500 if an error occurs during deleting a comments', async () => {
    jest.spyOn(Post, 'findById').mockImplementationOnce(() => {
      throw new Error('Database error');
    });

    const res = await request(app)
      .delete(`/comment/${postId}/comment`)
      .set('Authorization', token);

    expect(res.statusCode).toBe(500);
    expect(res.body.error).toBe('Database error');

    jest.restoreAllMocks();
  });

});