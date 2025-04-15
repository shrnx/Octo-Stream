import { Router } from "express";
import { upload } from "../middlewares/multer.middleware.js";
import { uploadVideoOnChannel } from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js"

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

export default router