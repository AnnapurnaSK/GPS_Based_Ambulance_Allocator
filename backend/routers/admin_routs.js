const express=require('express');
const router=express.Router();

//SYstem files
const admin_api=require('../api/admin_api');

router.get('/api/getAllDrivers',admin_api.getAllDrivers);
router.get('/api/getDriverByVehicleNumber/:vehicleNumber',admin_api.getDriverByVehicleNumber);
router.post('/api/insertDriver',admin_api.insertDriver);
router.delete('/api/deleteDriver/:vehicleNumber',admin_api.deleteDriver);
router.put('/api/updateDriver/:vehicleNumber',admin_api.updateDriverLocationAndStatus);
router.get('/',(req,res)=>{
    res.send('Admin default route');
});

module.exports=router;
