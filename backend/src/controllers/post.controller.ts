import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { Post } from '../models/post.model';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';
import mongoose from 'mongoose';

export const applyPaginationAndSorting = async (req: Request, filter: any = {}) => {

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  if (isNaN(page) || page <= 0) {
    throw new ApiError(400, "Page number must be a positive integer.");
  }
  if (isNaN(limit) || limit <= 0) {
    throw new ApiError(400, "Limit must be a positive integer.");
  }

  const skip = (page - 1) * limit;

  try {
    const totalPosts = await Post.countDocuments(filter);
    const posts = await Post.find(filter)
      .skip(skip)
      .limit(limit)
      .collation({ locale: "en" })
      .sort({
        createdAt: -1
      });

    const totalPages = Math.ceil(totalPosts / limit);
    const finalTotalPages = totalPosts === 0 ? 0 : Math.ceil(totalPosts / limit);

    return {
      posts,
      currentPage: page,
      totalPages: finalTotalPages,
      totalCount: totalPosts,
      limit,
    };

  } catch (error: any) {
    console.error("Error applying pagination and sorting:", error);
    if (error.name === 'MongooseError' || error.name === 'MongoError') {
      throw new ApiError(500, "Database error during pagination: " + error.message);
    }
    throw new ApiError(500, "Failed to apply pagination and sorting: " + error.message);
  }
};

export const createPost = asyncHandler(async (req: Request, res: Response) => {

  const { description } = req.body;
  const userId = req.user?.id;

  const uploadedMediaPath = req.file?.path;

  if (!uploadedMediaPath) {
    throw new ApiError(400, "Media file is required for the post.");
  }

  if (!userId) {
    throw new ApiError(401, "Unauthorized: User not logged in.");
  }

  const post = await Post.create({
    description: description || "",
    mediaurl: uploadedMediaPath,
    author: userId
  });

  if (!post) {
    throw new ApiError(500, "Something went wrong while creating the post.");
  }

  res.status(201).json(new ApiResponse(201, post, `Post created successfully by ${userId}`));
});


export const getAllPosts = asyncHandler(async (req: Request, res: Response) => {

  const posts = await Post.find().populate("author", "fullName").sort({ createdAt: -1 });

  if (!posts || posts.length === 0) {
    return res.status(200).json(new ApiResponse(200, [], "No posts found yet."));
  }

  res.status(200).json(new ApiResponse(200, posts, "Posts fetched successfully."));
});

export const getPostById = asyncHandler(async (req: Request, res: Response) => {

  const { postId } = req.params;
  const trimmedPostId = postId?.trim();

  if (!trimmedPostId) {
    throw new ApiError(400, "postId is Required to get the post")
  }

  const post = await Post.findById(trimmedPostId);

  if (!post) {
    throw new ApiError(404, "Post not found.");
  }

  res.status(200).json(new ApiResponse(200, post, "Post fetched successfully."));
});

export const deletePost = asyncHandler(async (req: Request, res: Response) => {

  const { id } = req.params;
  const userId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid Post ID format.");
  }

  if (!userId) {
    throw new ApiError(401, "Unauthorized: User not logged in.");
  }

  const post = await Post.findById(id) as (import('../models/post.model').IPost & { author: mongoose.Types.ObjectId | string });

  if (!post) {
    throw new ApiError(404, "Post not found.");
  }

  if (post.author.toString() !== userId) {
    throw new ApiError(403, "Forbidden: You are not authorized to delete this post.");
  }

  await post.deleteOne();
  res.status(200).json(new ApiResponse(200, null, "Post deleted successfully."));
});


export const updatePost = asyncHandler(async (req: Request, res: Response) => {

  const { id } = req.params;
  const { description } = req.body;
  const userId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid Post ID format.");
  }

  if (!userId) {
    throw new ApiError(401, "Unauthorized: User not logged in.");
  }

  if (typeof description !== 'string' || description.trim() === '') {
    throw new ApiError(400, "Description is required and must be a non-empty string.");
  }

  const post = await Post.findById(id) as (import('../models/post.model').IPost & { author: mongoose.Types.ObjectId });

  if (!post) {
    throw new ApiError(404, "Post not found.");
  }

  if (post.author.toString() !== userId.toString()) {
    throw new ApiError(403, "Forbidden: You are not authorized to update this post.");
  }

  post.description = description.trim();

  const updatedPost = await post.save();
  res.status(200).json(new ApiResponse(200, updatedPost, "Post updated successfully."));
});




