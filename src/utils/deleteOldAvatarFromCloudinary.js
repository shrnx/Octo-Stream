import { v2 as cloudinary } from "cloudinary"
import { ApiError } from "./apiError.js";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const deleteOldAvatarFromCloudinary = async (oldAvatar) => {
    try {
        const avatar = oldAvatar // This is avatar URL
        const avatarURLsplitted = avatar.split("/")
        const avatarIdforCloudinary = avatarURLsplitted[avatarURLsplitted.length-1]
        const removedPngfromavatarId = avatarIdforCloudinary.split(".")
        const finalAvatarId = removedPngfromavatarId[0]
    
        await cloudinary.uploader.destroy(
            finalAvatarId,
            function(err, result) { 
                console.log(result) 
            }
        );
        
    } catch (error) {
        throw new ApiError(500, "Error deleting from cloudinary: " + error)
    }
}

export { deleteOldAvatarFromCloudinary }