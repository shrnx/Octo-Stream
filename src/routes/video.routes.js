import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { uploadVideoOnChannel } from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { getVideoById } from "../controllers/video.controller.js"

const router = Router()

router.route("/upload").post(
    verifyJWT,
    upload.fields([
        {
            name: "video",
            maxCount:1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    uploadVideoOnChannel
)

router.route("/:videoId").get(
    verifyJWT,
    getVideoById
)

export default router