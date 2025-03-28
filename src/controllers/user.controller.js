import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from "../utils/apiError.js"
import { z } from "zod"
import { User } from "../models/user.models.js"

export const registerUser = asyncHandler( async(req, res) => {
    // Get user data from frontend
    // Validation - Not empty etc.
    // Check if user already exists: from username and email
    // check for images, check for avatar
    // upload them to cloudinary, also check avatar is uploaded on cloudinary or not
    // Create user object - create entry in DB
    // remove password and refresh token field from response
    // check for user creation -> return response

    const { username, fullName, email, password } =  req.body;

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




    // Checking if the user exists? And also check that if user does not exist by email, is the username same as someone else or vice versa.
    const userExists = User.findOne({
        $or: [{ username }, { email }]      // checks all the values present in the object
    })

    if(userExists) {
        throw new ApiError(409, "User with email or username exists");
    };

    

})

export const loginUser = asyncHandler( async(req, res) => {
    res.status(200).json({
        message: "chai aur code"
    })
})