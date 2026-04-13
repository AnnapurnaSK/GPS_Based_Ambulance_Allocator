const express=require('express');
const router=express.Router();

const user_api=require('../api/user_api');


router.post('/api/request-ambulance', user_api.requestAmbulance);
router.get('/api/close', user_api.closeRide);
router.get('/',(req,res)=>{
    res.send('User default route');
});

module.exports=router;
