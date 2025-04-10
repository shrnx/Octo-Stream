import { v2 as cloudinary } from "cloudinary"
import { ApiError } from "./apiError.js";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const deleteOldCoverImageFromCloudinary = async (oldCoverImage) => {
    try {
        const coverImage = oldCoverImage // This is avatar URL
        const coverImageURLsplitted = coverImage.split("/")
        const coverImageIdforCloudinary = coverImageURLsplitted[coverImageURLsplitted.length-1]
        const removedPngfromCoverImageId = coverImageIdforCloudinary.split(".")
        const finalCoverImageId = removedPngfromCoverImageId[0]
    
        await cloudinary.uploader.destroy(
            finalCoverImageId,
            function(err, result) { 
                console.log(result) 
            }
        );
        
    } catch (error) {
        throw new ApiError(500, "Error deleting from cloudinary: " + error)
    }
}

export { deleteOldCoverImageFromCloudinary }