const express=require('express');
const mongoose=require('mongoose');
require('dotenv').config();

//System files
const user_routs=require('./backend/routers/user_routs');
const admin_routes=require('./backend/routers/admin_routs');
const driver_routes=require('./backend/routers/driver_routs');

const app=express();

app.use(express.json());

app.use('/user',user_routs);
app.use('/admin',admin_routes);
app.use('/driver',driver_routes);

app.use('/',(req,res)=>{
    res.json(
        {
            "res":"All set"
        }
    )
});

mongoose.connect(process.env.MONGO_URL)
.then(()=>{
    console.log('Connected to mongo db');
    app.listen(process.env.PORT,(req,res)=>{
        console.log('Server running at 127.0.0.1:3000');
    });
})
.catch((err)=>{
    console.log('Unable to connect to database!');
    console.log(err);
});