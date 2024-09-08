import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscriptions.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    let allStats = {}

    const totalSubscriptions = await Subscription.countDocuments({channel : req.user._id})
    const totalLikes = await Video.aggregate([
        {
            $match : {
                owner : new mongoose.Types.ObjectId(req.user._id)
            }
        }
        ,{
            $lookup :{
                from : "likes",
                localField : "_id",
                foreignField : "video",
                as : "likes"
            }
        },{
            $group : {
                _id : null,
                totalLikes : {$sum : {$size : "$likes"}},
                totalViews : { $sum : "$views"},
            }
        }
    ])
    const allVideos = await Video.find({owner : req.user._id})
    
    allStats = {
        totalSubscriptions,
        totalLikes : totalLikes.length > 0 ? totalLikes[0].totalLikes : 0,
        totalViews : totalLikes.length > 0 ? totalLikes[0].totalViews : 0,
        allVideos : allVideos
    }
    return res.json(allStats)
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const allVideos = await Video.find({owner : req.user._id})

    return res
    .status(200)
    .json(
        new ApiResponse(200,allVideos,"All videos are fetched successfully")
    )
})

export {
    getChannelStats, 
    getChannelVideos
    }