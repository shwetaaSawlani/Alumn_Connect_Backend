import { Router } from "express";
import {
  toggleFollow,
  acceptFollowRequest,
  rejectFollowRequest,
  getFollowers,
  getFollowing,
  getPendingFollowRequests,
  toggleAccountPrivacy,
} from "../controllers/social.controller";
import { verifyUserTokenFromCookie } from "../middlewares/auth.middleware";

const router = Router();

router.use(verifyUserTokenFromCookie);

router.route("/toggle-follow/:targetUserId").post(toggleFollow);
router.route("/accept-request/:requesterId").post(acceptFollowRequest);
router.route("/reject-request/:requesterId").post(rejectFollowRequest);
router.route("/followers/:userId").get(getFollowers);
router.route("/following/:userId").get(getFollowing);
router.route("/follow-requests").get(getPendingFollowRequests);
router.route("/toggle-privacy").patch(toggleAccountPrivacy);

export default router;