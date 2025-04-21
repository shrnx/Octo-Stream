import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiError } from "../utils/apiError.js"
import { z } from "zod"
import { Video } from "../models/video.model.js"
import { uploadVideoOnCloudinary } from '../utils/cloudinary.js';
import { ApiResponse } from "../utils/apiResponse.js"
import { uploadOnCloudinary } from '../utils/cloudinary.js';
import { deleteOldThumbnailFromCloudinary } from '../utils/deleteOldThumbnailFromCloudinary.js'

export const uploadVideoOnChannel = asyncHandler(async (req, res) => {
    try {
        // const { title, description } = req.body;   If req.body is undefined, this will crash before validation

        const requiredBody = z.object({
            title: z.string().min(1, "There should be a title").max(50, "Title length can't be more than 50 characters"),
            description: z.string().max(200, "Description length can't be more than 200 characters")
        })  // Now we have created a blueprint what validated data should look.

        const parsedDataWithSuccess = requiredBody.safeParse(req.body)     // Now here we are finally validating data.

        if (!parsedDataWithSuccess.success) {
            throw new ApiError(400, `Error: ${parsedDataWithSuccess.error}`)
        }

        const parsedTitle = parsedDataWithSuccess.data.title;
        const parsedDescription = parsedDataWithSuccess.data.description;

        let videoLocalPath;
        if (req.files && Array.isArray(req.files.video) && req.files.video.length > 0) {
            videoLocalPath = req.files.video[0].path;
        }

        if (!videoLocalPath) {
            throw new ApiError(400, "Video is needed");
        }

        const video = await uploadVideoOnCloudinary(videoLocalPath)

        if (!video) {
            throw new ApiError(500, "Failed to upload video to cloudinary")
        }

        const totalSeconds = Math.round(video.duration) // This rounds off as floor can give wierd results sometimes. Rounding > Flooring

        const duration = {
            minutes: Math.floor(totalSeconds / 60),
            seconds: totalSeconds % 60  // Here we should notdo Math.floor as it will cut off some extra seconds in point while in minutes it is necessary to cutoff those seconds as they are already considered here
        }

        // console.log("Video duration is " + duration.minutes + " minutes and " + duration.seconds + " seconds." )         Just for checking

        let thumbnailLocalPath;
        if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
            thumbnailLocalPath = req.files.thumbnail[0].path
        }

        if (!thumbnailLocalPath) {
            throw new ApiError(400, "Thumbnail is needed")
        }

        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)


        const createdVideo = await Video.create({
            title: parsedTitle,
            description: parsedDescription,
            video: video.secure_url,
            duration,
            thumbnail: thumbnail.secure_url
        })

        // console.log(createdVideo)

        // Commenting Response Structure(Making Code Dev-Friendly)
        // Response:
        // {
        //   success: true,
        //   data: {
        //     _id: "videoId",
        //     title: "My awesome video",
        //     description: "Short description...",
        //     video: "https://cloudinary.com/vid.mp4",
        //     thumbnail: "https://cloudinary.com/thumb.jpg",
        //     duration: { minutes: 1, seconds: 39 },
        //     timestamps: {...}
        //   },
        //   message: "Video uploaded successfully"
        // }

        return res
            .status(200)
            .json(
                new ApiResponse(200, createdVideo, "Video uploaded successfully on cloudinary")
            )
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError(500, "Something went wrong: " + error.message);
    }
})

export const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params      // videoId is mongoose Id
    if (!videoId) {
        throw new ApiError(400, "Video Id is required");
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(400, "Video does not exist")
    }

    const returnVideo = video.video
    console.log(returnVideo)

    return res
        .status(200)
        .json(
            new ApiResponse(200, returnVideo, "Video retrieved successfully")
        )

})

export const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    if (!videoId) {
        throw new ApiError(400, "Video Id is required");
    }

    // const { title, description, thumbnail } = req.body           No need
    const requiredBody = z.object({
        title: z.string().min(1, "There should be a title").max(50, "Title length can't be more than 50 characters"),
        description: z.string().max(200, "Description length can't be more than 200 characters")
    })  // Now we have created a blueprint what validated data should look.

    const parsedDataWithSuccess = requiredBody.safeParse(req.body)     // Now here we are finally validating data.

    if (!parsedDataWithSuccess.success) {
        // throw new ApiError(400, `Error: ${parsedDataWithSuccess.error}`)
        const formatted = parsedDataWithSuccess.error.flatten();
        throw new ApiError(400, `Validation Error`, formatted);         // This will give better ZOD messages
    }

    const parsedTitle = parsedDataWithSuccess.data.title;
    const parsedDescription = parsedDataWithSuccess.data.description;

    let thumbnailLocalPath;
    if (req.files && Array.isArray(req.files.thumbnail) && req.files.thumbnail.length > 0) {
        thumbnailLocalPath = req.files.thumbnail[0].path
    }

    if (!thumbnailLocalPath) {
        throw new ApiError(400, "Thumbnail is needed")
    }

    const video = await Video.findById(videoId)

    if (!video) {
        throw new ApiError(404, "Video does not exist")
    }

    const oldThumbnailURL = video.thumbnail

    const newThumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    const updatedVideoInfo = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                title: parsedTitle,
                description: parsedDescription,
                thumbnail: newThumbnail.secure_url
            }
        },
        { new: true }
    )

    // If we are here, it means we can delete the old Thumbnail as new Thumbnail has been updated.
    try {
        await deleteOldThumbnailFromCloudinary(oldThumbnailURL);
        console.log("Deleted Old Thumbnail Successfully")
    } catch (error) {
        console.error("Error Deleting Old Thumbnail: ", error)
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedVideoInfo, "Details of video updated successfully")
        )
})