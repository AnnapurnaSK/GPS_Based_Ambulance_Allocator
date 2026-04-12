const express=require('express');
const mongoose=require('mongoose');
require('dotenv').config();
const app=express();

app.use('/',(req,res)=>{
    res.send('Home page');
});

mongoose.connect(process.env.MONGO_URL)
.then(()=>{
    console.log('Successfully connected to database');
    app.listen(process.env.PORT | 3000,(req,res)=>{
    console.log('Server running on 127.0.0.1:3000');
    }); 
})
.catch((err)=>{
    console.log(err);
    console.log('Unable to connect to the database');
});

