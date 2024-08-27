import mongoose from "mongoose";
import { DBName } from '../constants.js';

const connectDB =async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DBName}`)
        console.log(`\n MongoDB connnection !! DB HOST : ${connectionInstance.connection.host}`);
        
    } catch (error) {
        console.log("MONGODB connnection error: ",error);
        process.exit(1)
    }
}

export default connectDB