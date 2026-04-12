const mongoose=require('mongoose');

const ambulance_schema=new mongoose.Schema(
    {
        vehicleNumber: {
            type: String,
            required: [true, "Vehicle number is required"],
            unique: true,
            trim: true
        },
        driverName: {
            type: String,
            required : [true, "Driver name is required"],
            trim: true
        },
        driverContact: {
            type: String,
            required: [true, "Driver contact is required"]
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
        },
        email :{
            type: String,
            required: [true, "email is required"]
        }
    },
    { timestamps: true }
);

module.exports=mongoose.model("Ambulance",ambulance_schema,"ambulance");