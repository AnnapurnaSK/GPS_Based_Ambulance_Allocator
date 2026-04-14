const express=require('express');
const router=express.Router();

router.get('/',(req,res)=>{
    res.send('Driver default route');
});

module.exports=router;
