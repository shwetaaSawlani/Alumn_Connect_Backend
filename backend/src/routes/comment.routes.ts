import { Router } from "express";
import { createComment, getCommentsForPost, deleteComment, updateComment } from "../controllers/comment.controller";
import { verifyUserTokenFromCookie } from "../middlewares/auth.middleware"

let router = Router()

router.route("/create/:id").post(verifyUserTokenFromCookie, createComment);
router.route("/get/:postId").get(verifyUserTokenFromCookie, getCommentsForPost);
router.route("/update/:commentId").put(verifyUserTokenFromCookie, updateComment);
router.route("/delete/:commentId").delete(verifyUserTokenFromCookie, deleteComment);

export default router