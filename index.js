const express=require('express');
require('dotenv').config();
const app=express();

app.use('/',(req,res)=>{
    res.send('Home page');
});

app.listen(process.env.PORT | 3000,(req,res)=>{
    console.log('Server running on 127.0.0.1:3000');
});
