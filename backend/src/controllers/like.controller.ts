import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { Like, ILike } from "../models/like.model";
import { Post } from "../models/post.model";
import { Comment } from "../models/comment.model";
import mongoose from "mongoose";

export const togglePostLike = asyncHandler(async (req: Request, res: Response) => {

  const { postId } = req.params;
  const userId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    throw new ApiError(400, "Invalid Post ID format.");
  }
  if (!userId) {
    throw new ApiError(401, "Unauthorized: User not logged in.");
  }

  const postExists = await Post.findById(postId);

  if (!postExists) {
    throw new ApiError(404, "Post not found.");
  }

  const existingLike: ILike | null = await Like.findOne({
    post: new mongoose.Types.ObjectId(postId),
    user: new mongoose.Types.ObjectId(userId),
  });

  let message: string;
  let likeStatus: boolean;

  if (existingLike) {
    await existingLike.deleteOne();
    message = "Post unliked successfully.";
    likeStatus = false;
  } else {
    const newLike: ILike = await Like.create({
      post: new mongoose.Types.ObjectId(postId),
      user: new mongoose.Types.ObjectId(userId),
    });

    if (!newLike) {
      throw new ApiError(500, "Something went wrong while liking the post.");
    }

    message = "Post liked successfully.";
    likeStatus = true;
  }

  res.status(200).json(new ApiResponse(200, { liked: likeStatus }, message));
});


export const toggleCommentLike = asyncHandler(async (req: Request, res: Response) => {

  const { commentId } = req.params;
  const userId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid Comment ID format.");
  }
  if (!userId) {
    throw new ApiError(401, "Unauthorized: User not logged in.");
  }

  const commentExists = await Comment.findById(commentId);

  if (!commentExists) {
    throw new ApiError(404, "Comment not found.");
  }

  const existingLike: ILike | null = await Like.findOne({
    comment: new mongoose.Types.ObjectId(commentId),
    user: new mongoose.Types.ObjectId(userId),
  });

  let message: string;
  let likeStatus: boolean;

  if (existingLike) {
    await existingLike.deleteOne();
    message = "Comment unliked successfully.";
    likeStatus = false;
  } else {
    const newLike: ILike = await Like.create({
      comment: new mongoose.Types.ObjectId(commentId),
      user: new mongoose.Types.ObjectId(userId),
    });

    if (!newLike) {
      throw new ApiError(500, "Something went wrong while liking the comment.");
    }

    message = "Comment liked successfully.";
    likeStatus = true;
  }

  res.status(200).json(new ApiResponse(200, { liked: likeStatus }, message));
});


export const getPostLikeCount = asyncHandler(async (req: Request, res: Response) => {

  const { postId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    throw new ApiError(400, "Invalid Post ID format.");
  }

  const postExists = await Post.findById(postId);
  if (!postExists) {
    throw new ApiError(404, "Post not found.");
  }

  const likeCount = await Like.countDocuments({ post: new mongoose.Types.ObjectId(postId) });

  res.status(200).json(new ApiResponse(200, { count: likeCount }, "Post like count fetched successfully."));
});


export const getCommentLikeCount = asyncHandler(async (req: Request, res: Response) => {

  const { commentId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid Comment ID format.");
  }

  const commentExists = await Comment.findById(commentId);
  if (!commentExists) {
    throw new ApiError(404, "Comment not found.");
  }

  const likeCount = await Like.countDocuments({ comment: new mongoose.Types.ObjectId(commentId) });

  res.status(200).json(new ApiResponse(200, { count: likeCount }, "Comment like count fetched successfully."));
});