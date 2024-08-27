import dotenv from 'dotenv'
import express from 'express'
import connectDB from './db/index.js'

dotenv.config({
    path : './env'
})


connectDB()







/*
;(
    async () => {
        try {
            mongoose.connect(`${process.env.MONGODB_URI}/${DBName}`);
            app.on('error',(error)=>{
                console.log("ERR: ", error);
                throw error
            })
            app.listen(process.env.PORT, ()=> {
                console.log("server is running on port : "+process.env.PORT);
                
            })
        } catch (error) {
            console.error("ERROR ", error)
            throw error
        }
    }
)()
    */