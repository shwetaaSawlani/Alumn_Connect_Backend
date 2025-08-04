import { Router } from "express";
import { createPost, getAllPosts, deletePost, updatePost } from "../controllers/post.controller"
import { verifyUserTokenFromCookie } from "../middlewares/auth.middleware"
import { upload } from "../middlewares/multer.middleware";

let router = Router()

router.route("/create").post(verifyUserTokenFromCookie, upload.single("mediaurl"), createPost);
router.route("/all").get(verifyUserTokenFromCookie, getAllPosts)
router.route("/delete/:id").delete(verifyUserTokenFromCookie, deletePost);
router.route("/update/:id").put(verifyUserTokenFromCookie, updatePost);

export default router