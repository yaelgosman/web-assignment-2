import request from 'supertest';
import { Types } from 'mongoose';
import app from '../../index';
import Post, { IPost } from '../../models/post.model';
import { token, userId } from '../setup';

describe('Post API', () => {
  it('should create a new post', async () => {
    const res = await request(app)
      .post('/post')
      .set('Authorization', token)
      .send({
        title: 'My new comment Post',
        content: 'This is the content of my first post!',
        sender: userId.toString(),
      });

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty('_id');
    expect(res.body.title).toBe('My new comment Post');
  });

  it('should return 400 for invalid post data', async () => {
    const res = await request(app)
      .post('/post')
      .set('Authorization', token)
      .send({ title: '' });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('should get all posts', async () => {
    const post = new Post<Partial<IPost>>({
      title: 'Test Post',
      content: 'Test Content',
      sender: userId,
    });
    await post.save();

    const res = await request(app)
      .get('/post')
      .set('Authorization', token);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe(post.title);
  });

  it('should get all posts by sender', async () => {
    const post = new Post<Partial<IPost>>({
      title: 'Sender Test Post',
      content: 'Test Content',
      sender: userId,
    });
    await post.save();

    const res = await request(app)
      .get(`/post?sender=${userId.toString()}`)
      .set('Authorization', token);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(1);
    expect(res.body[0].sender).toBe(userId.toString());
  });

  it('should get a post by ID', async () => {
    const post = new Post<Partial<IPost>>({
      title: 'Test Post',
      content: 'Test Content',
      sender: userId,
    });
    await post.save();

    const res = await request(app)
      .get(`/post/${post._id}`)
      .set('Authorization', token);

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id', post._id!.toString());
    expect(res.body.title).toBe(post.title);
  });

  it('should return 404 for a non-existent post', async () => {
    const fakeId = new Types.ObjectId();

    const res = await request(app)
      .get(`/post/${fakeId}`)
      .set('Authorization', token);

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Post not found');
  });

  it('should update a post', async () => {
    const post = new Post<Partial<IPost>>({
      title: 'Original Title',
      content: 'Original Content',
      sender: userId,
    });
    await post.save();

    const res = await request(app)
      .put(`/post/${post._id}`)
      .set('Authorization', token)
      .send({ title: 'Updated Title', content: 'Updated Content' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('_id', post._id!.toString());
    expect(res.body.title).toBe('Updated Title');
  });

  it('should return 404 for updating a non-existent post', async () => {
    const fakeId = new Types.ObjectId();

    const res = await request(app)
      .put(`/post/${fakeId}`)
      .set('Authorization', token)
      .send({ title: 'Updated Title' });

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Post not found');
  });

  it('should delete a post', async () => {
    const post = new Post<Partial<IPost>>({
      title: 'Post to Delete',
      content: 'Content to Delete',
      sender: userId,
    });
    await post.save();

    const res = await request(app)
      .delete(`/post/${post._id}`)
      .set('Authorization', token);

    expect(res.statusCode).toBe(200);
    expect(res.body.message).toBe('Post deleted successfully');

    const deletedPost = await Post.findById(post._id);
    expect(deletedPost).toBeNull();
  });

  it('should return 404 for deleting a non-existent post', async () => {
    const fakeId = new Types.ObjectId();

    const res = await request(app)
      .delete(`/post/${fakeId}`)
      .set('Authorization', token);

    expect(res.statusCode).toBe(404);
    expect(res.body.error).toBe('Post not found');
  });
});