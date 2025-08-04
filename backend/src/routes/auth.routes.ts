import { Router } from "express";

import { signUp, signIn, logout } from "../controllers/auth.controller";

let router=  Router()

router.route("/signup").post(signUp);
router.route("/signin/").post(signIn);
router.route("/logout").post(logout);


export default router