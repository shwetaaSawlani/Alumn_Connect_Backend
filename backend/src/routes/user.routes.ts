import { Router } from "express";
import { getAllUsers, getUserById, getUserByName, getUsersByIndustry, getUsersByJobtitle, getUsersByDepartment, deleteUserById, getUsersByGraduationyear, getUsersBycurrentcompany, updateUserProfile } from "../controllers/user.controller";
import { verifyUserTokenFromCookie } from "../middlewares/auth.middleware"
import { upload } from "../middlewares/multer.middleware";
let router = Router()

router.route("/users").get(verifyUserTokenFromCookie, getAllUsers);
router.route("/users/:name").get(verifyUserTokenFromCookie, getUserByName);
router.route("/users/id/:userId").get(verifyUserTokenFromCookie,getUserById )
router.route("/users/year/:year").get(verifyUserTokenFromCookie, getUsersByGraduationyear);
router.route("/users/department/:department").get(verifyUserTokenFromCookie, getUsersByDepartment);
router.route("/users/job/:designation").get(verifyUserTokenFromCookie, getUsersByJobtitle);
router.route("/users/industry/:industry").get(verifyUserTokenFromCookie, getUsersByIndustry);
router.route("/users/company/:company").get(verifyUserTokenFromCookie, getUsersBycurrentcompany);
router.route("/users/:userId").put(verifyUserTokenFromCookie, upload.single("avatar"), updateUserProfile);
router.route("/users/:userId").delete(verifyUserTokenFromCookie, deleteUserById);




export default router