import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { Comment, IComment } from "../models/comment.model"; 
import { Post } from "../models/post.model";
import mongoose from "mongoose"; 



export const createComment = asyncHandler(async (req: Request, res: Response) => {
  const { id } = req.params;
  const { content } = req.body;  
  const userId = req.user?.id;   
 

  console.log(`postId`, id)

  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(400, "Invalid Post ID format.");
  }
  if (!content || typeof content !== 'string' || content.trim() === '') {
    throw new ApiError(400, "Comment content is required and must be a non-empty string.");
  }
  if (!userId) {
    throw new ApiError(401, "Unauthorized: User not logged in.");
  }

  const postExists = await Post.findById(id);
  if (!postExists) {
    throw new ApiError(404, "Post not found. Cannot add comment to a non-existent post.");
  }

  const comment: IComment = await Comment.create({
    content: content.trim(),
    post: new mongoose.Types.ObjectId(id), 
    author: new mongoose.Types.ObjectId(userId), 
  });

  if (!comment) {
    throw new ApiError(500, "Something went wrong while creating the comment.");
  }

  
  res.status(201).json(new ApiResponse(201, comment, "Comment created successfully."));
});


export const getCommentsForPost = asyncHandler(async (req: Request, res: Response) => {
  const { postId } = req.params; 

  if (!mongoose.Types.ObjectId.isValid(postId)) {
    throw new ApiError(400, "Invalid Post ID format.");
  }


  const comments = await Comment.find({ post: postId })
    .populate('author', 'username avatar') 
    .sort({ createdAt: 1 }); 
  if (!comments || comments.length === 0) {
    return res.status(200).json(new ApiResponse(200, [], "No comments found for this post yet."));
  }

  res.status(200).json(new ApiResponse(200, comments, "Comments fetched successfully."));
});


export const updateComment = asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const { content } = req.body;    
  const userId = req.user?.id;    


  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid Comment ID format.");
  }
  if (!content || typeof content !== 'string' || content.trim() === '') {
    throw new ApiError(400, "Comment content is required and must be a non-empty string for update.");
  }
  if (!userId) {
    throw new ApiError(401, "Unauthorized: User not logged in.");
  }

  const comment: IComment | null = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found.");
  }

  if (comment.author.toString() !== userId.toString()) {
    throw new ApiError(403, "Forbidden: You are not authorized to update this comment.");
  }

  comment.content = content.trim();
  const updatedComment: IComment = await comment.save();


  res.status(200).json(new ApiResponse(200, updatedComment, "Comment updated successfully."));
});


export const deleteComment = asyncHandler(async (req: Request, res: Response) => {
  const { commentId } = req.params;
  const userId = req.user?.id;    

  if (!mongoose.Types.ObjectId.isValid(commentId)) {
    throw new ApiError(400, "Invalid Comment ID format.");
  }
  if (!userId) {
    throw new ApiError(401, "Unauthorized: User not logged in.");
  }


  const comment: IComment | null = await Comment.findById(commentId);

  if (!comment) {
    throw new ApiError(404, "Comment not found.");
  }


  if (comment.author.toString() !== userId.toString()) {
    throw new ApiError(403, "Forbidden: You are not authorized to delete this comment.");
  }


  await comment.deleteOne(); 

  
  res.status(200).json(new ApiResponse(200, null, "Comment deleted successfully."));
});