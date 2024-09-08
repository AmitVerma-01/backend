import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Video } from "../models/video.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    if(!name && !description){
        throw new ApiError(409, "Name and Description is required")
    }
    
    const playlist = await Playlist.create({
        name,
        description,
        owner : req.user._id
    })

    if(!playlist){
        throw new ApiError(409, "Playlist creation failed")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Playlist created successfully")
    )

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists

    if(!userId){
        throw new ApiError(409, "User Id is required")
    }

    if(!isValidObjectId(userId)){
        throw new ApiError(409, "User Id is invalid")
    }

    const playlists = await Playlist.find({owner : userId})

    if(!playlists){
        throw new ApiError(409, "Playlists not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlists, "Playlists fetched successfully")
    )

})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id

    if(!playlistId){
        throw new ApiError(409, "Playlist Id is required")
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(409, "Playlist Id is invalid")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){ 
        throw new ApiError(409, "Playlist not found")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "Playlist fetched successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    console.log("params",req.params);
    if(!(playlistId && videoId)){
        throw new ApiError(409 , "Playlist Id and Video Id is required")
    }

    

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(409 , "Playlist Id and Video Id is invalid")
    }
    
    const playlist = await Playlist.findById(playlistId)
    const video = await Video.findById(videoId)
    if(!playlist){
        throw new ApiError(409, "Playlist not found with given Id")   
    }

    if(!video){
        throw new ApiError(409, "Video not found with given Id")
    }

    if(playlist.videos.includes(videoId)){
        throw new ApiError(409, "Video already added to playlist")
    }

    playlist.videos = [...playlist.videos, videoId]
    const updatedPlaylist = await playlist.save({validateBeforeSave : false})

    if(!updatedPlaylist){
        throw new ApiError(409, "Video not added to playlist")
    }

    return res
    .status(200)   
    .json(new ApiResponse(200, updatedPlaylist, "Video added to playlist successfully"))
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if(!playlistId && !videoId){   
        throw new ApiError(409, "Playlist Id and Video Id is required")
    }

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(409, "Playlist Id and Video Id is invalid")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(409, "Playlist not found with given Id")
    }

    const videoIndex = playlist.videos.indexOf(videoId)
    
    playlist.videos.splice(videoIndex, 1)
    const updatedPlaylist = await playlist.save({validateBeforeSave : false})

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedPlaylist, "Video removed from playlist successfully")
    )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    if(!playlistId){
        throw new ApiError(409, "Playlist Id is required")
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(409, "Playlist Id is invalid")
    }

    const playlist = await Playlist.findById(playlistId)
    
    if(!playlist){
        throw new ApiError(409, "Playlist not found with given Id")
    }

    if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(400, "You are not authorized to delete this playlist")
    }

    const deletedPlaylist = await Playlist.findByIdAndDelete(playlistId)

    if(!deletedPlaylist){
        throw new ApiError(409, "Playlist not deleted")
    }

    return res 
    .status(200)
    .json(
        new ApiResponse(200, deletedPlaylist, "Playlist deleted successfully")
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist

    if(!playlistId && !name && !description){
        throw new ApiError(409, "Playlist Id , name and description is required")
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(409, "Playlist Id is invalid")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist){
        throw new ApiError(409, "Playlist not found with given Id")
    }

    if(!playlist.owner.equals(req.user._id)){
        throw new ApiError(400, "You are not authorized to update this playlist")
    }

    playlist.name = name
    playlist.description = description
    const updatedPlaylist = await playlist.save({validateBeforeSave : false})

    if(!updatedPlaylist){
        throw new ApiError(409, "Playlist not updated")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatePlaylist, "Playlist updated successfully")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}