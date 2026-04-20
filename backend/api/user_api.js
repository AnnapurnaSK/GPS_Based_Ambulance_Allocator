const User=require('../models/users');
const Driver=require('../models/drivers');

const { allocateandSendMail } = require('../controllers/mail');

const jwt = require('jsonwebtoken');

async function closeRide(req, res) {
    try {
        const { token,email } = req.query;

        if (!token || !email) {
            return res.status(400).json({
                status: false,
                message: "Token or email missing"
            });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const driver = await Driver.findOneAndUpdate(
            { vehicleNumber: decoded.vehicleNumber },
            { status: "available" },
            { returnDocument: 'after' }
        );

        const user = await User.findOneAndUpdate(
            { email: email },
            { status: "closed" },
            { returnDocument: 'after' }
        );

        if (!driver) {
            return res.status(404).json({
                status: false,
                message: "Driver not found"
            });
        }

        if (!user) {
            return res.status(404).json({
                status: false,
                message: "User not found"
            });
        }




        return res.status(200).json({
            status: true,
            message: "Ride closed successfully"
        });

    } catch (err) {
        return res.status(401).json({
            status: false,
            message: " Something went wrong"
        });
    }
}

async function requestAmbulance(req, res) {
    try {
        const { lat, lon, name, contact, email } = req.body;

        if (!lat || !lon || !name || !contact || !email) {
            return res.status(400).json({
                status: false,
                message: "All fields are required"
            });
        }

        const patient = { name, contact, email };

        const result = await allocateandSendMail(lat, lon, patient);

        if (!result.status) {
            return res.status(404).json({
                status: false,
                message: "No drivers available"
            });
        }

        await User.create({
            name,
            contact,
            email,
            latitude: lat,
            longitude: lon,
            vehicleNumber: result.driver.vehicleNumber
        });

        return res.status(200).json({
            status: true,
            message: "Ambulance allocated successfully",
            driver: result.driver
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({
            status: false,
            message: "Internal server error"
        });
    }
}

module.exports = { requestAmbulance, closeRide };