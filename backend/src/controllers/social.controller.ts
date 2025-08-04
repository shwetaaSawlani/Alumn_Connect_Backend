import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import { Request, Response } from "express";
import { ApiResponse } from "../utils/ApiResponse";
import { User, IUser } from "../models/user.model"; 
import mongoose from "mongoose";


export const toggleFollow = asyncHandler(async (req: Request, res: Response) => {
  const { targetUserId } = req.params;
  const currentUserId = req.user?.id;

  if (!mongoose.Types.ObjectId.isValid(targetUserId)) {
    throw new ApiError(400, "Invalid target user ID format.");
  }
  if (!currentUserId) {
    throw new ApiError(401, "Unauthorized: User not logged in.");
  }
  if (currentUserId.toString() === targetUserId.toString()) {
    throw new ApiError(400, "You cannot follow yourself.");
  }

  const currentUser = await User.findById(currentUserId);
  const targetUser = await User.findById(targetUserId);

  if (!currentUser) {
    throw new ApiError(404, "Authenticated user not found.");
  }
  if (!targetUser) {
    throw new ApiError(404, "Target user not found.");
  }

  let message: string;
  let status: 'followed' | 'unfollowed' | 'requested' | 'request_cancelled';

  if (targetUser.isPrivate) {

    const isFollowing = currentUser.following.some(id => id.toString() === targetUser.id.toString());
    const hasSentRequest = targetUser.followRequests.some(id => id.toString() === currentUser.id.toString());

    if (isFollowing) {

      currentUser.following = currentUser.following.filter(id => id.toString() !== targetUser.id.toString());
      targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUser.id.toString());
      message = "Unfollowed private account.";
      status = 'unfollowed';
    } else if (hasSentRequest) {
      targetUser.followRequests = targetUser.followRequests.filter(id => id.toString() !== currentUser.id.toString());
      message = "Follow request cancelled.";
      status = 'request_cancelled';
    } else {

      targetUser.followRequests.push(currentUser.id);
      message = "Follow request sent.";
      status = 'requested';
    }
  } else {
   
    const isFollowing = currentUser.following.some(id => id.toString() === targetUser.id.toString());

    if (isFollowing) {
 
      currentUser.following = currentUser.following.filter(id => id.toString() !== targetUser.id.toString());
      targetUser.followers = targetUser.followers.filter(id => id.toString() !== currentUser.id.toString());
      message = "Unfollowed public account.";
      status = 'unfollowed';
    } else {
   
      currentUser.following.push(targetUser.id);
      targetUser.followers.push(currentUser.id);
      message = "Followed public account.";
      status = 'followed';
    }
  }


  await currentUser.save();
  await targetUser.save();

  res.status(200).json(new ApiResponse(200, { status }, message));
});

export const acceptFollowRequest = asyncHandler(async (req: Request, res: Response) => {
  const { requesterId } = req.params;
  const currentUserId = req.user?.id;


  if (!mongoose.Types.ObjectId.isValid(requesterId)) {
    throw new ApiError(400, "Invalid requester ID format.");
  }
  if (!currentUserId) {
    throw new ApiError(401, "Unauthorized: User not logged in.");
  }
  if (currentUserId.toString() === requesterId.toString()) {
    throw new ApiError(400, "You cannot accept your own follow request.");
  }

 
  const currentUser = await User.findById(currentUserId);
  const requester = await User.findById(requesterId);

  if (!currentUser) {
    throw new ApiError(404, "Authenticated user not found.");
  }
  if (!requester) {
    throw new ApiError(404, "Requester user not found.");
  }

 
  if (!currentUser.isPrivate) {
    throw new ApiError(400, "Your account is public. No follow requests to accept.");
  }

  const requestIndex = currentUser.followRequests.findIndex(id => id.toString() === requester.id.toString());

  if (requestIndex === -1) {
    throw new ApiError(404, "No pending follow request from this user.");
  }

  currentUser.followRequests.splice(requestIndex, 1); 
  currentUser.followers.push(requester.id);      
  requester.following.push(currentUser.id);        

  await currentUser.save();
  await requester.save();

  res.status(200).json(new ApiResponse(200, null, `Follow request from ${requester.fullName} accepted.`));
});


export const rejectFollowRequest = asyncHandler(async (req: Request, res: Response) => {
  const { requesterId } = req.params;
  const currentUserId = req.user?.id;


  if (!mongoose.Types.ObjectId.isValid(requesterId)) {
    throw new ApiError(400, "Invalid requester ID format.");
  }
  if (!currentUserId) {
    throw new ApiError(401, "Unauthorized: User not logged in.");
  }


  const currentUser = await User.findById(currentUserId);

  if (!currentUser) {
    throw new ApiError(404, "Authenticated user not found.");
  }

  if (!currentUser.isPrivate) {
    throw new ApiError(400, "Your account is public. No follow requests to reject.");
  }


  const initialRequestCount = currentUser.followRequests.length;
  currentUser.followRequests = currentUser.followRequests.filter(id => id.toString() !== requesterId.toString());

  if (currentUser.followRequests.length === initialRequestCount) {
    
    throw new ApiError(404, "No pending follow request from this user to reject.");
  }

  await currentUser.save();

  res.status(200).json(new ApiResponse(200, null, `Follow request from ${requesterId} rejected.`));
});


export const getFollowers = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const currentUserId = req.user?.id; 

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID format.");
  }

  const targetUser = await User.findById(userId);

  if (!targetUser) {
    throw new ApiError(404, "User not found.");
  }


  if (targetUser.isPrivate) {
    if (!currentUserId) {
      throw new ApiError(401, "Unauthorized: Log in to view private account details.");
    }

    const isFollowing = targetUser.followers.some(followerId => followerId.toString() === currentUserId.toString());
    if (!isFollowing && currentUserId.toString() !== targetUser.id.toString()) {
      throw new ApiError(403, "Forbidden: This is a private account. You must be following to view followers.");
    }
  }


  const followers = await User.find({ _id: { $in: targetUser.followers } })
    .select('_id username avatar fullName'); 

    const noOfFollowers= followers.length;

  res.status(200).json(new ApiResponse(200, {followers, noOfFollowers}, "Followers fetched successfully."));
});


export const getFollowing = asyncHandler(async (req: Request, res: Response) => {
  const { userId } = req.params;
  const currentUserId = req.user?.id; 

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    throw new ApiError(400, "Invalid user ID format.");
  }


  const targetUser = await User.findById(userId);

  if (!targetUser) {
    throw new ApiError(404, "User not found.");
  }


  if (targetUser.isPrivate) {
    if (!currentUserId) {
      throw new ApiError(401, "Unauthorized: Log in to view private account details.");
    }

    const isFollowing = targetUser.followers.some(followerId => followerId.toString() === currentUserId.toString());
    if (!isFollowing && currentUserId.toString() !== targetUser.id.toString()) {
      throw new ApiError(403, "Forbidden: This is a private account. You must be following to view who they follow.");
    }
  }

  const following = await User.find({ _id: { $in: targetUser.following } })
    .select('_id username avatar fullName'); 

   const noOfFollowing= following.length;  

  res.status(200).json(new ApiResponse(200, {following,noOfFollowing},  "Following fetched successfully."));
});


export const getPendingFollowRequests = asyncHandler(async (req: Request, res: Response) => {
  const currentUserId = req.user?.id;


  if (!currentUserId) {
    throw new ApiError(401, "Unauthorized: User not logged in.");
  }


  const currentUser = await User.findById(currentUserId);

  if (!currentUser) {
    throw new ApiError(404, "Authenticated user not found.");
  }


  if (!currentUser.isPrivate) {
    throw new ApiError(400, "Your account is public. No pending follow requests.");
  }


  const pendingRequests = await User.find({ _id: { $in: currentUser.followRequests } })
    .select('_id username avatar fullName'); 
  const noOfPendingRequests = pendingRequests.length;
  res.status(200).json(new ApiResponse(200, {pendingRequests,noOfPendingRequests}, "Pending follow requests fetched successfully."));
});



export const toggleAccountPrivacy = asyncHandler(async (req: Request, res: Response) => {
  const currentUserId = req.user?.id;

  if (!currentUserId) {
    throw new ApiError(401, "Unauthorized: User not logged in.");
  }


  const currentUser = await User.findById(currentUserId);

  if (!currentUser) {
    throw new ApiError(404, "Authenticated user not found.");
  }


  currentUser.isPrivate = !currentUser.isPrivate;

  if (!currentUser.isPrivate) {

    for (const requesterId of currentUser.followRequests) {
      const requester = await User.findById(requesterId);
      if (requester) {

        if (!currentUser.followers.includes(requester.id)) {
          currentUser.followers.push(requester.id);
        }

        if (!requester.following.includes(currentUser.id)) {
          requester.following.push(currentUser.id);
          await requester.save();
        }
      }
    }
    currentUser.followRequests = [];
  }

  await currentUser.save();

  res.status(200).json(new ApiResponse(200, { isPrivate: currentUser.isPrivate }, `Account privacy set to ${currentUser.isPrivate ? 'private' : 'public'}.`));
});