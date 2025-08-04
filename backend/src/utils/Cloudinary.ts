import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath: string) => {
    try {
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'image',
        });

        console.log("File Uploaded Successfully on cloudinary:", response.secure_url);
        return response.secure_url;

    } catch (error) {
        console.error("Cloudinary Upload Failed:", error);
        try {
            fs.unlinkSync(localFilePath);
            console.log("Deleted from local successfully")
        } catch (err) {
            console.error("Failed to delete local file:", err);
        }
        return null;
    }
};

export { uploadOnCloudinary }