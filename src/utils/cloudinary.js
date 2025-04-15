import { v2 as cloudinary } from "cloudinary"   // just giving v2 a name hehe
import fs from 'fs'

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) {
            console.error("LocalFile Not Found!");
            return null
        }
        // Upload file in cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "image"   // Earlier used auto detect file
        })
        // console.log("File has been uploaded successfully on cloudinary", response.url);  No need to show this now as we have checked, all fine

        // Now I have check everything in cloudinary is working fine, and files are being uploaded correctly
        // So we can just unlink(delete from the system) the files now
        fs.unlinkSync(localFilePath)

        return response     // response gives every information about the uploaded file.
    } catch(error) {
        fs.unlinkSync(localFilePath)  // removes the locally saved temporary file as the upload operation got failed
        console.error("Error: " + error);
        return null
    }
    // Sync makes sure file is removed now, unlike async in which file gets removed in background
}

const uploadVideoOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) {
            console.error("LocalFile Not Found!");
            return null
        }
        // Upload video in cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "video"
        })
        console.log("Video has been uploaded successfully on cloudinary", response.url);

        fs.unlinkSync(localFilePath)

        return response
    } catch(error) {
        fs.unlinkSync(localFilePath)
        console.error("Error: " + error);
        return null
    }
}

export { uploadOnCloudinary, uploadVideoOnCloudinary }

// Currently this code deletes files on failed upload to cloudinary operation, but does not deletes when successfull -> we will later come to why.