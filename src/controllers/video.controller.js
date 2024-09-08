import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteFileFromCloudinary, deleteImageFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    //TODO: get all videos based on query, sort, pagination
    let newQuery=query;
    if(query){
        newQuery=query.replaceAll('%',' ')
    }
console.log(newQuery,query);

    let queryArr = []
    if(userId){
        queryArr.push({owner : new mongoose.Types.ObjectId(userId)})
    }

    if(query){
        queryArr.push({
            $or : [
                {title : {$regex : new RegExp(`${newQuery}+`,'i')}},
                {description : {$regex : new RegExp(`${newQuery}+`,'i')}}
            ]
        })
    }
    const matchCondition  = queryArr.length ? {$match : {$and : queryArr}} : {}

    const sortOptions = {
        "_id" : -1, // newest first
        "duration" : 1 // shortest first
    }    

    if(sortBy && sortType){
        sortOptions[sortBy] = Number(sortType)
    }

    const allVideo = await Video.aggregate([
        matchCondition,
        {
            $skip : (page - 1) * limit
        },{
            $limit : limit
        },{
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "owner",
                pipeline : [{
                    $project : {username : 1 , avatar : 1}
                }]
            }
        },{
            $addFields : {
                "owner" : {
                    $arrayElemAt : ['$owner' , 0]
                }
            }
        },
        {
            $sort : sortOptions
        }
    ])


    res.json(allVideo)

})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description ,isPublished} = req.body
    // TODO: get video, upload to cloudinary, create video

    if(!(title && description)){
        throw new ApiError(409, "Title and Description is required")
    }

    const videoFilePath = req.files?.videoFile?.[0]?.path;
    const thumbnailFilePath = req.files?.thumbnail?.[0].path;

    if(!(videoFilePath && thumbnailFilePath)){
        throw new ApiError(409, "Both Video and Thumbnail are required")
    }

    const video = await uploadOnCloudinary(videoFilePath)
    const thumbnail = await uploadOnCloudinary(thumbnailFilePath)

    const uploadedVideo = await Video.create({
        videoFile : video.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration : Math.floor(video.duration),
        isPublished : isPublished == "true" ? true : false,
        owner : req.user._id
    })

    if(!uploadedVideo){
        throw new ApiError(501, "Video upload failed, Try again");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, uploadedVideo ,"Video Uploaded successfully")
    )
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: get video by id
    if(!videoId){
        throw new ApiError(401, "VideoId is required.")
    }
    const updateVideo = await Video.findByIdAndUpdate(videoId , { $inc : {views : +1}}, {new : true})
    console.log(updateVideo);
    
    const video = await Video.aggregate(
        [ 
            {
              $match: {
                "_id" : new mongoose.Types.ObjectId('66d59008c43b238584c7e2d7')
              }
            },
            {
              $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
              }
            },{
                $lookup : {
                    from : "users",
                    localField : "owner",
                    foreignField : "_id",
                    as : "owner", 
                    pipeline : [
                        {
                            $project : {
                                username :1,
                                avatar : 1,
                            }
                        }
                    ]
                }
            },{
              $addFields: {
                "owner": {
                  $arrayElemAt : ["$owner", 0]
                },
                "likeCount" : {
                  $size : "$likes"
                }
              }
            }
          ])

        if (!video || video.length === 0) {
            throw new ApiError(400, "Invalid VideoId, Please Enter correct videoId");
        }
        
        video[0].isLiked = video[0].likes.some(like => like.likedBy.equals(req.user._id));
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, video[0], "Video retrieved successdully")
    )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: update video details like title, description, thumbnail

    const {title, description} = req.body;
    const thumbnailLocalPath = req.file?.path; 
    console.log(req.file?.path);
    
    console.log("thumbnail localpath ",thumbnailLocalPath);
    
    if(!title && !description && !thumbnailLocalPath){
        throw new ApiError(401, "Atleast one thing required to update video details(title, description, thumbnail).")
    }

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(401,"Invalid VideoId for updation")
    }
    const prevThumbnailUrl = video.thumbnail;
    
    let updateDetails = {}
    if(title){
        updateDetails.title = title;
    }
    if(description){
        updateDetails.description = description
    }
    if(thumbnailLocalPath){
        const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
        if(!thumbnail){
            throw new ApiError(500, "Failed to update thumbnail")
        }
        
        updateDetails.thumbnail = thumbnail.url
        await deleteImageFromCloudinary(prevThumbnailUrl)
    }
    

    const updatedVideo =  await Video.findByIdAndUpdate(videoId , updateDetails, {new : true})

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedVideo, "Video details are updated successfully")
    )
    
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    //TODO: delete video
    const video = await Video.findById(videoId);

    if(!video){
        throw new ApiError(400, "Invalid VideoId, Please Enter correct videoId") 
    }

    if(!(req.user._id.equals(video.owner))){
        throw new ApiError(400,"You are not authorized to delete this video.")
    }

    const deletionCheck = await deleteFileFromCloudinary(video.videoFile.trim(), video.thumbnail.trim())

    if(!deletionCheck){
        throw new ApiError(500,"Failed to delete video, Please Try Again")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Ok", "Video deleted successfully")
    )
    
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    if(!videoId){
        throw new ApiError(409, "Video Id is required")
    }

    const video = await Video.findById(videoId.trim())

    if(!video){
        throw new ApiError(401, "Invalid VideoId")
    }

    if(!video.owner.equals(req.user._id)){
        throw new ApiError(400, "You are not authorized to change the publish status.")
    }

    video.isPublished = !video.isPublished

    const resVideo = await video.save({validateBeforeSave : false})

    return res
    .status(200)
    .json(
        new ApiResponse(200, {publish : video.isPublished }, `Video's publish status is set to "${video.isPublished}"`)
    )

})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}