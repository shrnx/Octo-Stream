import { v2 as cloudinary } from "cloudinary"
import { ApiError } from "./apiError.js";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const deleteOldThumbnailFromCloudinary = async (oldThumbnail) => {
    try {
        const Thumbnail = oldThumbnail // This is Thumbnail URL
        const ThumbnailURLsplitted = Thumbnail.split("/")
        const ThumbnailIdforCloudinary = ThumbnailURLsplitted[ThumbnailURLsplitted.length-1]
        const removedPngfromThumbnailId = ThumbnailIdforCloudinary.split(".")
        const finalThumbnailId = removedPngfromThumbnailId[0]
    
        await cloudinary.uploader.destroy(
            finalThumbnailId,
            function(err, result) { 
                console.log(result) 
            }
        );
        
    } catch (error) {
        throw new ApiError(500, "Error deleting from cloudinary: " + error)
    }
}

export { deleteOldThumbnailFromCloudinary }