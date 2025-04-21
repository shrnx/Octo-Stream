import { v2 as cloudinary } from "cloudinary"
import { ApiError } from "./apiError.js";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const deleteVideoFromCloudinary = async (Video) => {
    try {
        const video = Video // This is video URL
        const videoURLsplitted = video.split("/")
        const videoIdforCloudinary = videoURLsplitted[videoURLsplitted.length-1]
        const removedExtensionfromVideoId = videoIdforCloudinary.split(".")
        const finalVideoId = removedExtensionfromVideoId[0]
    console.log(finalVideoId)
        await cloudinary.uploader.destroy(
            finalVideoId,
            { resource_type: "video" },         // I added this line because if we don't provide this line, then no matter if we give the correct Id/name of the video, cloudinary will treat that id/name as an image by default. So for video files we need to explicitly tell cloudinary.
            function(err, result) { 
                console.log(result) 
            }
        );
        
    } catch (error) {
        throw new ApiError(500, "Error deleting from cloudinary: " + error)
    }
}

export { deleteVideoFromCloudinary }