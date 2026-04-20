

//System files
const Driver=require('../models/drivers');
const User=require('../models/users');

//To get all users
async function getAllUsers(req,res)
{
    try{
        const result=await User.find({});
        res.json(result);
    }
    catch(err){
        res.status(500).json({error: "Unable to fetch users"});
    }
}

//To get user by email
//To update driver location and status
async function updateDriverLocationAndStatus(req,res)
{
    const vehicleNumber=req.params.vehicleNumber;
    const {lat,lon,status}=req.body;
    try{
        const driver=await Driver.findOne({vehicleNumber: vehicleNumber});
        if(!driver){
            return res.status(404).json({error: "Driver not found"});
        }
        driver.location={lat,lon};
        driver.status=status;
        const result=await driver.save();
        res.json(result);
    }
    catch(err){
        res.status(500).json({error: "Unable to update driver"});
    }
}

//To delete a driver by vehicle number
async function deleteDriver(req,res)
{
    const vehicleNumber=req.params.vehicleNumber;
    try{
        const result=await Driver.findOneAndDelete({vehicleNumber: vehicleNumber});
        if(!result){
            return res.status(404).json({error: "Driver not found"});
        }
        res.json({message: "Driver deleted successfully"});
    }
    catch(err){
        res.status(500).json({error: "Unable to delete driver"});
    }
}

async function insertDriver(req,res)
{
    const {vehicleNumber,name,contact,email,password,address}=req.body;
    try{
        const newDriver=new Driver({
            vehicleNumber,
            name,
            contact,
            email,
            password,
            address
        });
        const result=await newDriver.save();
        res.json(result);
    }
    catch(err){
        res.status(500).json({error: "Unable to insert driver"});
    }
}   

//To get all user requests
async function getAllUserRequests(req,res)
{
    try{
        const result=await User.find({});
        res.json(result);
    }
    catch(err){
        res.status(500).json({error: "Unable to fetch user requests"});
    }
}

//To get all drivers
async function getAllDrivers(req,res)
{
    try{
        const result=await Driver.find({});
        res.json(result);
    }
    catch(err){
        res.status(500).json({error: "Unable to fetch drivers"});
    }
}

//To get driver by vehicle number
async function getDriverByVehicleNumber(req,res)
{
    const vehicleNumber=req.params.vehicleNumber;
    try{
        const driver=await Driver.findOne({vehicleNumber: vehicleNumber});
        if(!driver){
            return res.status(404).json({error: "Driver not found"});
        }
        res.json(driver);
    }
    catch(err){
        res.status(500).json({error: "Unable to fetch driver"});
    }
}


module.exports={
    getAllDrivers,
    getDriverByVehicleNumber,
    insertDriver,
    deleteDriver,
    updateDriverLocationAndStatus,
    getAllUserRequests
}