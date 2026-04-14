const mongoose=require('mongoose');

const driver_schema=new mongoose.Schema(
    {
         vehicleNumber: {
            type: String,
            required: [true, "Vehicle number is required"],
            unique: true,
            trim: true
        },
        name: {
            type: String,
            required: [true, "Driver name is required"],
            trim: true
        },
        contact: {
            type: String,
            required: [true, "Driver contact is required"]
        },
        email :{
            type: String,
            required: [true, "email is required"]
        },
        password :{
            type: String,
            required: [true, "password is required"]
        },
        status:{
            type: String,
            enum: ["available","dispatched","maintenance"],
            default : "available"
        },
        location: {
            lat: {type: Number},
            lon: {type: Number}
        },
        address: {
            type: String,
            required : [true, "Ambulance physical address required"]
        },
        assigned_to: {
            lat: {type: Number},
            lon: {type:Number}
        }
    },
    { timestamps: true }
);

module.exports=mongoose.model("Driver",driver_schema,"drivers");