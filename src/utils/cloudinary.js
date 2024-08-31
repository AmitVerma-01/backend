import { v2 as cloudinary} from 'cloudinary';
import fs from 'fs'

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_API_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath)=>{
    try {
        if(!localFilePath) return null

        const response = await cloudinary.uploader.upload(localFilePath,{
            resource_type : "auto"
        })
        console.log(response);
        fs.unlinkSync(localFilePath)
        return response
        
    } catch (error) {
        fs.unlinkSync(localFilePath)
        return null
    }
}

const deleteImageFromCloudinary = async (imageUrl)=>{
    try {
        if(!imageUrl) return false;

        const response = await cloudinary.uploader.destroy(imageUrl,
            {resource_type : "auto"}
        )

        return true;

    } catch (error) {
        console.log("Failed image deletion from cloudinary " ,error?.message);
        return false;
    }
}

export {uploadOnCloudinary , deleteImageFromCloudinary}