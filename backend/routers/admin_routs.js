const express=require('express');
const path=require('path');
const router=express.Router();
const adminFrontendDir=path.resolve(__dirname,'../../frontend/admin');

//SYstem files
const admin_api=require('../api/admin_api');
const {adminLogin,admin_auth}=require('../middleware/admin_auth');

router.get('/styles.css',(req,res)=>{
    res.sendFile(path.join(adminFrontendDir,'styles.css'));
});

router.get('/app.js',(req,res)=>{
    res.sendFile(path.join(adminFrontendDir,'app.js'));
});

router.get('/',(req,res)=>{
    res.sendFile(path.join(adminFrontendDir,'index.html'));
});

router.get('/dashboard',(req,res)=>{
    res.sendFile(path.join(adminFrontendDir,'dashboard.html'));
});

router.get('/dashboard.html',(req,res)=>{
    res.sendFile(path.join(adminFrontendDir,'dashboard.html'));
});

//Admin login route
router.post('/api/login',adminLogin);

//Protected routes for admin operations
router.use(admin_auth);
//router.get('/api/getAllUsers',admin_api.getAllUsers);   
router.get('/api/getAllDrivers',admin_api.getAllDrivers);
router.get('/api/getDriverByVehicleNumber/:vehicleNumber',admin_api.getDriverByVehicleNumber);
router.post('/api/insertDriver',admin_api.insertDriver);
router.delete('/api/deleteDriver/:vehicleNumber',admin_api.deleteDriver);
router.put('/api/updateDriver/:vehicleNumber',admin_api.updateDriverLocationAndStatus);

module.exports=router;
