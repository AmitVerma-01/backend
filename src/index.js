import dotenv from 'dotenv'
import connectDB from './db/index.js'
import app from './app.js'

dotenv.config({
    path : './.env'
})


connectDB()
.then(() => {
    app.on('error',(error)=>{
        console.log("ERR: ", error);
        throw error
    })
    app.listen(process.env.PORT || 8000 , ()=> {
        console.log(`Server is running on PORT ${process.env.PORT}`);
        
    })
})
.catch((err) => {
    console.log("MONGODB connection FAILED ", err)
})







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