import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from "../utils/apiError.js"
import { z } from "zod"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js"

export const registerUser = asyncHandler(async (req, res) => {
    // Get user data from frontend
    // Validation - Not empty etc.
    // Check if user already exists: from username and email
    // check for images, check for avatar
    // upload them to cloudinary, also check avatar is uploaded on cloudinary or not
    // Create user object - create entry in DB
    // remove password and refresh token field from response
    // check for user creation -> return response

    const { username, fullName, email, password } = req.body;

    // if(fullName === "") {                                                    We can write multiple if/elses if we want
    //     throw new ApiError(400,  "fullName is required")
    // }   

    // if(                                                                      Here using some(), still need to write multiple if/elses
    //     [username, fullName, email, password].some((field) => {
    //        return field?.trim() === ""
    //     })
    // ) {
    //     throw new ApiError(400, "All fields are required")
    // }


    // So the best way is using ZOD Validations
    const requiredBody = z.object({
        email: z.string().min(5).max(100).email(),
        fullName: z.string().min(5).max(100),
        username: z.string().min(3).max(20),
        password: z.string().min(6).max(100)
    })

    const parsedDataWithSuccess = requiredBody.safeParse(req.body);

    if(!parsedDataWithSuccess.success) {
        throw new ApiError(400, `Error: ${parsedDataWithSuccess.error}`)
    }



    // Checking if the user exists? And also check that if user does not exist by email, is the username same as someone else or vice versa.
    // const userExists = User.findOne({
    //     $or: [{ username }, { email }]      // checks all the values present in the object
    // })
    const usernameExists = await User.findOne({username});
    if (usernameExists) {
        throw new ApiError(409, "User with username exists");
    };

    const emailExists = await User.findOne({email});
    if (emailExists) {
        throw new ApiError(409, "User with email exists");
    };

    // From multer middleware
    const avatarLocalPath = req.files?.avatar[0]?.path;      // Check this through console.log
    const coverImageLocalPath = req.files?.coverImage[0]?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar is needed");
    };

    // Upload them to cloudinary
    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar) {
        throw new ApiError(400, "Avatar is needed");
    }

    // Upload to MongoDB
    const user = await User.create({
        avatar: avatar.url,
        coverImage: coverImage?.url || "",      // This is a corner case, which max people tends to miss
        fullName: parsedDataWithSuccess.fullName,
        email: parsedDataWithSuccess.email,
        password: parsedDataWithSuccess.password,
        username: parsedDataWithSuccess.username
    })

    const createdUser = await User.find(user._id).select(   
        // By default everything is selected, so remove unnecessary as we will sending data back to user
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    );

})

export const loginUser = asyncHandler(async (req, res) => {
    res.status(200).json({
        message: "chai aur code"
    })
})