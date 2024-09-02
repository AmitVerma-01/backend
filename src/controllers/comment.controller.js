import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query

    const video = await Video.findById(videoId)
    if(!video){
        throw new ApiError(401, "Invalid Video Id, Cannot find video")
    }

    const comments = await Comment.aggregate([
        {
            $match : { video : video._id  }
        },{
            $lookup : {
                from : "users",
                localField : "owner",
                foreignField : "_id",
                as : "owner",
                pipeline : [
                    {
                        $project : {
                            fullName : 1,
                            avatar : 1,
                            username : 1
                        }
                    }
                ]
            }
        },{
            $addFields : {
                owner : {
                    $arrayElemAt : ["$owner",0]
                }
            }
        },{
            $skip : Number((page-1) * limit)
        },{
            $limit : Number(limit)
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200,comments,"Comments retrieved successfully")
    )


})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video 
    const {videoId} = req.params
    const {comment } = req.body

    if(!comment){
        throw new ApiError(401, "Comment is required to add comment");
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(401, "Invalid Video Id, Cannot find video")
    }

    const addedComment = await Comment.create({
        content : comment,
        video : video._id,
        owner : req.user._id
    })

    if(!addedComment){
        throw new ApiError(500, 'Failed to add comment, Internal server error')
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200,addedComment,"Comment is added Successfully")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment
    const {commentId} = req.params
    const { comment } = req.body;

    if(!commentId){
        throw new ApiError(401, "Comment Id is required")
    }

    const prevComment = await Comment.findById(commentId);
    if(!prevComment){
        throw new ApiError(400, "Invalid Comment Id")
    }

    if(!prevComment.owner.equals(req.user._id)){
        throw new ApiError(400, "Not Authorized to change comment")
    }

    prevComment.content = comment;
    const updateComment = await prevComment.save({validateBeforeSave : false})

    console.log(updateComment);
    
    if(!updateComment){
        throw new ApiError(500, "Failed to update comment, Internal server error")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updateComment, "Comment updated successfully")
    )

})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    const {commentId} = req.params

    if(!commentId){
        throw new ApiError(401, "Comment Id is required")
    }

    const prevComment = await Comment.findById(commentId);
    if(!prevComment){
        throw new ApiError(400, "Invalid Comment Id")
    }

    if(!prevComment.owner.equals(req.user._id)){
        throw new ApiError(400, "Not Authorized to delete comment")
    }   

    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if(!deletedComment){    
        throw new ApiError(500, "Failed to delete comment, Internal server error")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, deletedComment, "Comment deleted successfully")
    )

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }