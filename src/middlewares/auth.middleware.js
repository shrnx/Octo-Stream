import { ApiError } from "../utils/apiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken';
import { User } from "../models/user.model.js"

// This req have cookie access from cookie-parser
export const verifyJWT = asyncHandler(async (req, _, next) => {
    // _ because res was not used here.(Production Standards)
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")

        if (!token) {
            throw new ApiError(401, "Unauthorized Request")
        }
        // console.log(token)

        const decodedTokenInformation = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)

        const user = await User.findById(decodedTokenInformation?._id).select("-password -refreshToken")

        if (!user) {
            // Discuss about frontend
            throw new ApiError(401, "Invalid Access Token")
        }

        // console.log("verifyJWt hit")

        req.user = user;
        next();
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token")
    }
})

// We created this middleware because we wanted to logout the user, and also we need User's information and check authentication multiple times.