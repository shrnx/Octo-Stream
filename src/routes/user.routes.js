import { Router } from "express";
import { loginUser, logoutUser, registerUser } from "../controllers/user.controller.js";
const router = Router()
import { upload } from "../middlewares/multer.middleware.js"
import verifyJWT from "../middlewares/auth.middleware.js"

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

export default router