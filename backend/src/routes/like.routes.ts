import { Router } from "express";
import {togglePostLike, toggleCommentLike, getPostLikeCount, getCommentLikeCount} from "../controllers/like.controller"
import { verifyUserTokenFromCookie } from "../middlewares/auth.middleware"

let router = Router()

router.route("/toggle/:postId").put(verifyUserTokenFromCookie, togglePostLike);
router.route("/t/:commentId").put(verifyUserTokenFromCookie, toggleCommentLike);
router.route("/likeCount/:postId").get(verifyUserTokenFromCookie, getPostLikeCount);
router.route("/likeecount/:commentId").get(verifyUserTokenFromCookie,getCommentLikeCount )


export default router