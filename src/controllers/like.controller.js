import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    if(!videoId ){
        throw new ApiError(401, "Video Id is required")
    }

    const video = await Video.findById(videoId);
    if(!video){
        throw new ApiError(401, "Invalid Video Id")
    }
    let updatedLikeStatus;
    let videoLike = await Like.findOne({video : video._id, likedBy : req.user._id});

    if(!videoLike){
        updatedLikeStatus = await Like.create({video : video._id, likedBy : req.user._id})
    }else{
        updatedLikeStatus = await Like.findByIdAndDelete(videoLike._id)
    }
    
    if(!updatedLikeStatus){
        throw new ApiError(500, "Failed to change like, internal server error");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {isLiked : videoLike ? false : true}, "Like status changed successfully")
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment

    if(!commentId ){
        throw new ApiError(401, "comment Id is required")
    }

    const comment = await Comment.findById(commentId);
    if(!comment){
        throw new ApiError(401, "Invalid comment Id")
    }
    let updatedLikeStatus;
    let commentLike = await Like.findOne({comment : comment._id, likedBy : req.user._id});

    if(!commentLike){
        updatedLikeStatus = await Like.create({comment : comment._id, likedBy : req.user._id})
    }else{
        updatedLikeStatus = await Like.findByIdAndDelete(commentLike._id)
    }
    
    if(!updatedLikeStatus){
        throw new ApiError(500, "Failed to change like, internal server error");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {isLiked : commentLike ? false : true}, "Like status changed successfully")
    )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
    if(!tweetId ){
        throw new ApiError(401, "Tweet Id is required")
    }

    const tweet = await Video.findById(tweetId);
    if(!tweet){
        throw new ApiError(401, "Invalid Twwet Id")
    }
    let updatedLikeStatus;
    let tweetLike = await Like.findOne({tweet : tweet._id, likedBy : req.user._id});

    if(!tweetLike){
        updatedLikeStatus = await Like.create({tweet : tweet._id, likedBy : req.user._id})
    }else{
        updatedLikeStatus = await Like.findByIdAndDelete(tweetLike._id)
    }
    
    if(!updatedLikeStatus){
        throw new ApiError(500, "Failed to change like, internal server error");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {isLiked : tweetLike ? false : true}, "Like status changed successfully")
    )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos

    const allLikedVideos = await Like.aggregate([
        {
            $match : {
                likedBy : req.user._id,
                video : {
                    $exists : true
                }
            }
        },{
            $lookup :{
                from : "videos",
                localField : "video",
                foreignField : "_id",
                as : "video",
                pipeline : [
                    {
                        $lookup :{
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "owner",
                            pipeline : [
                                {
                                    $project:{
                                        fullName : 1,
                                        username : 1,
                                        avatar : 1
                                    }
                                }
                            ]
                        }
                    }
                    ,{
                        $unwind : "$owner"
                    }
                ]
            }
        },{
            $unwind : "$video"
        }
    ])

    if(!allLikedVideos){
        throw new ApiError(200, {
            likedVideos : "No Video Liked yet"
        },"All liked videos retrieved successfully")
    }

    return  res.status(200).json(new ApiResponse(200 , {likedVideos : allLikedVideos} ,"All liked videos retrieved successfully"))

})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}