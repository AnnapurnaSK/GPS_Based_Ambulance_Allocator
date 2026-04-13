const jwt=require('jsonwebtoken');
require('dotenv').config();

const jwt = require('jsonwebtoken');

const adminLogin = async (req, res) => {
    try {
        const { username, password } = req.body;

        // Check credentials
        if (
            username !== process.env.ADMIN_USERNAME ||
            password !== process.env.ADMIN_PASSWORD
        ) {
            return res.status(401).json({ msg: "Invalid admin credentials" });
        }

        // Generate token
        const token = jwt.sign(
            { role: "admin", username },
            process.env.JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({
            msg: "Admin login successful",
            token
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const admin_auth=(req,res,next)=>{
    const token=req.headers['authorization'];
    if(!token){
        return res.status(401).json(
            {
                "error":"Unauthorized access! No token provided."
            }
        );
    }
    try{
        const decoded=jwt.verify(token,process.env.JWT_SECRET);
        req.admin=decoded;
        next();
    }catch(err){
        return res.status(401).json(
            {
                "error":"Unauthorized access! Invalid token."
            }
        );
    }
};

module.exports={
    adminLogin,
    admin_auth
};