import { Router } from "express";
import { loginUser, registerUser } from "../controllers/user.controller.js";
const router = Router()
import { upload } from "../middlewares/multer.middleware.js"

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

export default router