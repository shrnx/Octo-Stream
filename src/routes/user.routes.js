import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
const router = Router()
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { refreshAccessToken } from "../controllers/user.controller.js"
import { updateUserAvatar } from "../controllers/user.controller.js"
import { updateUserCoverImage } from "../controllers/user.controller.js"

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

router.route("/updateAvatar").patch(
    verifyJWT,
    upload.fields([{
        name: "avatar",
        maxCount: 1
    }]), 
    updateUserAvatar
)

router.route("/updateCoverImage").patch(
    verifyJWT,
    upload.fields([{
        name: "coverImage",
        maxCount: 1
    }]),
    updateUserCoverImage
)

export default router