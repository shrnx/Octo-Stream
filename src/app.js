import express from 'express'
const app = express();

import cors from 'cors'
import cookieParser from 'cookie-parser';

// all middlewares are used from app.use
app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}));

app.use(express.json({
    limit: "16kb"       // we used rate limiting for incoming json
}));

app.use(express.urlencoded({    // This is for data from url
    extended: true,
    limit: "16kb"
}))

app.use(express.static("public"))   // This will store temp files like photos etc in our physical machine's folder

app.use(cookieParser())  // This is used to access and remove cookies


// Routes import
import userRouter from "./routes/user.routes.js"
import videoRouter from "./routes/video.routes.js"


// Routes declaration
app.use("/api/v1/users", userRouter)
app.use("/api/v1/videos", videoRouter)

export { app }