const express=require('express');
const router=express.Router();

router.get('/',(req,res)=>{
    res.send('Admin default route');
});

module.exports=router;
