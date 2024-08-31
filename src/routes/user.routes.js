import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, updateUserAvatar, updateUserCoverImage, updateUserDetailes } from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

router.route("/register").post(
    upload.fields([
        {
            name : "avatar",
            maxCount : 1
        },
        {
            name : "coverImage",
            maxCount : 1
        }]),
        registerUser
    )

    router.route('/login').post(loginUser)
    router.route('/logout').post(verifyJWT, logoutUser)

    router.route('/refresh-token').post(refreshAccessToken);

    router.route('/get-current-user').get(verifyJWT, getCurrentUser)
    router.route('/change-password').patch(verifyJWT, changeCurrentPassword)
    router.route('/update-details').patch(verifyJWT, updateUserDetailes)
    router.route('/change-avatar').patch(verifyJWT, upload.single("avatar"), updateUserAvatar)
    router.route('/change-cover-image').patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

export default router 