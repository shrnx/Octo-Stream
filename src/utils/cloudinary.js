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
            resource_type: "auto"   // auto detect file
        })
        console.log("File has been uploaded successfully on cloudinary", response.url);

        return response     // response gives every information about the uploaded file.
    } catch(error) {
        fs.unlinkSync(localFilePath)  // removes the locally saved temporary file as the upload operation got failed
        console.error("Error: " + error);
        return null
    }
}

export { uploadOnCloudinary }