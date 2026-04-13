const express=require('express');
const router=express.Router();

//SYstem files
const admin_api=require('../api/admin_api');
const {adminLogin,admin_auth}=require('../middleware/admin_auth');

//Admin login route
router.post('/api/login',adminLogin);

//Protected routes for admin operations
router.use(admin_auth);

router.get('/api/getAllDrivers',admin_api.getAllDrivers);
router.get('/api/getDriverByVehicleNumber/:vehicleNumber',admin_api.getDriverByVehicleNumber);
router.post('/api/insertDriver',admin_api.insertDriver);
router.delete('/api/deleteDriver/:vehicleNumber',admin_api.deleteDriver);
router.put('/api/updateDriver/:vehicleNumber',admin_api.updateDriverLocationAndStatus);

module.exports=router;
