import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from "../utils/apiError.js"
import { z } from "zod"
import { User } from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/apiResponse.js"
import jwt from 'jsonwebtoken'
import { deleteOldAvatarFromCloudinary } from "../utils/deleteOldAvatarFromCloudinary.js"

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false})     // From mongo, so whenever we use mongo methods all the fields are kicked in, like then we also have to put password etc.
        // So we use {validateBeforeSave: false}, it's like we dont want any validations, we know what we are doing.
        // And since we are not doing anything related to password we can simply put validateBeforeSave as false.

        return {accessToken, refreshToken}


    } catch(error) {
        throw new ApiError(500, "Something went wrong while generating access and refresh tokens")
    }
} 

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
        email: z.string().min(5).max(100).email().trim().toLowerCase(),
        fullName: z.string().min(5).max(100),
        username: z.string().min(3).max(20).toLowerCase(),
        password: z.string().min(6).max(100)
    })

    const parsedDataWithSuccess = requiredBody.safeParse(req.body);

    if(!parsedDataWithSuccess.success) {
        throw new ApiError(400, `Error: ${parsedDataWithSuccess.error}`)
    }

    const parsedEmail = parsedDataWithSuccess.data.email;
    const parsedFullName = parsedDataWithSuccess.data.fullName;
    const parsedUsername = parsedDataWithSuccess.data.username;
    const parsedPassword = parsedDataWithSuccess.data.password;


    // Checking if the user exists? And also check that if user does not exist by email, is the username same as someone else or vice versa.
    // const userExists = User.findOne({
    //     $or: [{ username }, { email }]      // checks all the values present in the object
    // })
    const usernameExists = await User.findOne({username: parsedUsername});
    if (usernameExists) {
        throw new ApiError(409, "User with username exists");
    };

    const emailExists = await User.findOne({email: parsedEmail});
    if (emailExists) {
        throw new ApiError(409, "User with email exists");
    };

    // Everything here checked, no issues, working fine till now.

    
    // From multer middleware                                // Got Error here: Cannot read properties of undefined when files not uploaded
    
    // const avatarLocalPath = req.files?.avatar[0]?.path;      // Check this through console.log
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;

    let avatarLocalPath;
    if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0) {
        avatarLocalPath = req.files.avatar[0].path
    }

    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
        coverImageLocalPath = req.files.coverImage[0].path;
    }


    if (!avatarLocalPath) {     // This makes sure avatar is needed
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
        fullName: parsedFullName,
        email: parsedEmail,
        password: parsedPassword,
        username: parsedUsername
    })

    const createdUser = await User.find(user._id).select(   
        // By default everything is selected, so remove unnecessary as we will sending data back to user
        "-password -refreshToken"
    )

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(201, createdUser, "User registered successfully")
    );

})

export const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // validate for correct data
    // check from mongo user exists
    // if user exists, check password
    // generate an access & refresh token and store in browser
    // login the user(send the cookie)

    const{username, password, email} = req.body;

    const requiredBody = z.object({
        email: z.string().min(5).max(100).email().trim().toLowerCase(),
        username: z.string().min(3).max(20).toLowerCase(),
        password: z.string().min(6).max(100)
    })

    const parsedDataWithSuccess = requiredBody.safeParse(req.body);

    if(!parsedDataWithSuccess.success) {
        throw new ApiError(400, `Error: ${parsedDataWithSuccess.error}`)
    }

    const parsedEmail = parsedDataWithSuccess.data.email;
    const parsedUsername = parsedDataWithSuccess.data.username;
    const parsedPassword = parsedDataWithSuccess.data.password;

    const user = await User.findOne({
        $or: [{username: parsedUsername}, {email: parsedEmail}]  // Mongo Operators
    })

    if(!user) {
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(parsedPassword);

    if(!isPasswordValid) {
        throw new ApiError(401, "Incorrect user credentials")
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshTokens(user._id);

    // Now here we have to decide do we want this high cost db call as we could have directly modified the object also.
    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    const options = {   // Doing this makes cookies modified by server only not frontend.
        httpOnly: true,
        secure: true
    }

    // const avatar = user.avatar  // This is avatar URL
    // const avatarURLsplitted = avatar.split("/")
    // const avatarIdforCloudinary = avatarURLsplitted[avatarURLsplitted.length-1]
    // const removedPngfromavatarId = avatarIdforCloudinary.split(".")
    // const finalAvatarId = removedPngfromavatarId[0]

    // Did some heavy console.log here to make delete function for cloudinary image

    return res.status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200, 
            {
            user: loggedInUser, accessToken, refreshToken
            },
            "User Logged In Successfully"
        ), 
    )
    // If we have already set tokens in cookies, why we are doing it again, maybe if the user needs this for localStorage, or if user is a mobile developer as there cookies will not be set automatically.
})

    
// Logout User
export const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,   // We directly got req.user because of the secured auth middleware.
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {   // Doing this makes cookies modified by server only not frontend.
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "User Logged Out")
    )                   // I will not give any data
})

// Refresh Access Token
export const refreshAccessToken = asyncHandler(async(req, res) => {
    try {
        const incomingRefreshToken = req.cookoes.refreshToken || req.body.refreshToken      // If there is mobile dev who will give by body
    
        if(!incomingRefreshToken) {
            throw new ApiError(401, "Unauthorized Request")
        }
    
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken._id);
    
        if(!user) {
            throw new ApiError(401, "Invalid Refresh Token")
        }
    
        // If we are here, that means we have valid token\
    
        if(incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh Token is expired or used")
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken)
        .cookie("refreshToken", newRefreshToken)
        .json(
            new ApiResponse(
                200,
                {
                    accessToken, 
                    refreshToken: newRefreshToken
                },
                "Access Tokens Renewed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token")
    }

})


export const changeCurrentPassword = asyncHandler(async(req, res) => {
    const {oldPassword, newPassword, confirmPassword} = req.body;

    if(newPassword !== confirmPassword) {
        throw new ApiError(400, "newPassword and confirmPassword are not same")
    }

    // Since there will be a auth middleware in this route to confirm user is authenticated before changing password, we can directly get user info by user._id

    const user = await User.findById(req.user?._id)

    // Now we have found user and need to check is oldPassword correct(same as stored in DB), we can use isPasswordCorrect method made in user Model.

    const isPasswordCorrect =  await user.isPasswordCorrect(oldPassword)

    if(!isPasswordCorrect) {
        throw new ApiError(400, "Invalid oldPassword")
    }

    // Now we can store newPassword in DB as all checks are verified.
    user.password = newPassword         // We have set newPassword in object
    // Now we have to save it
    await user.save({
        validateBeforeSave: false   // We don't want to run any other validations
    })

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {},         // We don't want to send any data here
            "Password changed successfully"
        )
    )
})

export const getCurrentUser = asyncHandler(async(req, res) => {
    // We can use auth middleware to directly return user info

    // We don't need user validation here as if user is authenticated then that means user is present in DB

    return res
    .status(200)
    .json(200, req.user, "Current User fetched successfully")
})


export const updateAccountDetails = asyncHandler(async(req, res) => {
    const { fullName, email} = req.body       // If we want to update files make another controller and routes for it, it's better practise

    if(!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {       // Mongo Operators
            $set: {
                fullName,
                email: email    // We can do both if both names are same
            }
        },
        {new: true}     // if we true new, updated information gets returned
    ).select("-password")   // Here we saved one DB call

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Account Details updated successfully")
    )
})

export const updateUserAvatar = asyncHandler(async(req, res) => {
    // In this route we will use auth as well as multer middleware
    
    // Here we are using file not files as earlier we were taking both avatar and coverImag, but here we are taking avatar only(single file)
    const avatarLocalPath = req.file?.path

    // Also we have to delete old Avatar so let's save it's name somewhere
    const oldAvatar = req.user?.avatar

    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url) {
        throw new ApiError(500, "Error while uploading an avatar")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url      // Cautious here, we don't want to store whole avatar object here.
            }
        // When we are dealing with cloudinary, it returns avatar as an object that's why we use .url to get the url directly
        // Whereas in oldAvatar, mongo is directly returning avatar url, so no need for extra .url
        },
        {new: true}        
    ).select("-password")

    // Now everything's updated, so we can delete old avatar Image from cloudinary
    deleteOldAvatarFromCloudinary(oldAvatar);

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Avatar Updated successfully")
    )
})

export const updateUserCoverImage = asyncHandler(async(req, res) => {
    const coverImageLocalPath = req.file?.path

    if(!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url) {
        throw new ApiError(500, "Error while uploading Cover Image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user, "Cover Image Updated successfully")
    )
})