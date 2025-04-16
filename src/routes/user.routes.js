import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
const router = Router()
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { refreshAccessToken } from "../controllers/user.controller.js"
import { updateUserAvatar } from "../controllers/user.controller.js"
import { updateUserCoverImage } from "../controllers/user.controller.js"
import { getUserChannelProfile } from "../controllers/user.controller.js"
import { getWatchHistory } from "../controllers/user.controller.js"
import { changeCurrentPassword } from "../controllers/user.controller.js"
import { getCurrentUser } from "../controllers/user.controller.js"
import { updateAccountDetails } from "../controllers/user.controller.js"

router.route("/register").post(
    upload.fields([         // Multer Middleware, so that we can send images
        {
            name: "avatar",      // when we will create frontend field, then also we should name it same
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
);

router.route("/login").post(loginUser);

// secured routes
router.route("/logout").post(verifyJWT, logoutUser)
// this makes sure logout is correctly used.

router.route("/refresh-token").post(refreshAccessToken)
// We have not used verifyJWT as all that is done in controller only.

router.route("/update-avatar").patch(
    verifyJWT,
    // upload.fields([{
    //     name: "avatar",
    //     maxCount: 1
    // }]), 
    upload.single("avatar"),
    updateUserAvatar
)

router.route("/update-coverimage").patch(
    verifyJWT,
    // upload.fields([{
    //     name: "coverImage",
    //     maxCount: 1
    // }]),         // No need to use as will only upload single file
    upload.single("coverImage"),
    updateUserCoverImage
)

router.route("/change-password").patch(
    verifyJWT,
    changeCurrentPassword
)

router.route("/current-user").get(
    verifyJWT,
    getCurrentUser
)

router.route("/update-account-details").patch(
    verifyJWT,
    updateAccountDetails
)

router.route("/channel/:username").get(      // Whenever we want to get data from req.params use routes like this ************
    verifyJWT,
    getUserChannelProfile
)

router.route("/history").get(
    verifyJWT,
    getWatchHistory
)

export default router