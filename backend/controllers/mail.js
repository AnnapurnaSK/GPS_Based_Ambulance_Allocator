const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const {search}=require('./gps');
require('dotenv').config();

const Driver=require('../models/drivers');

const baseURL = "http://127.0.0.1:3000"; // Change to your frontend URL

async function allocateandSendMail(lat, lon, patient) {
    try {
        const res = await search(lat, lon);

        if (!res) {
            return { status: false };
        }

        const token = jwt.sign(
        {
            vehicleNumber: res.vehicleNumber
        },
        process.env.JWT_SECRET, // move to env later
        { expiresIn: "2h" }
        );

    const closeLink = `${baseURL}/user/api/close?token=${token}`;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL, // Your email
                pass: process.env.PASSWORD
            }
        });

        const mapLink = `https://www.google.com/maps?q=${Number(lat).toFixed(6)},${Number(lon).toFixed(6)}`;

        const userMail = {
            from: 'YOUR_EMAIL@gmail.com',
            to: patient.email,
            subject: 'Ambulance Allocated',
            text: `Hello ${patient.name},

An ambulance has been allocated to you.

Driver Details:
Name: ${res.name}
Vehicle: ${res.vehicleNumber}
Contact: ${res.contact}

Distance: ${res.distance} km
ETA: ${res.duration} hours

Click this link after you reach the destination: ${closeLink}

Stay calm, help is on the way.`
        };
        const driverMail = {
            from: 'YOUR_EMAIL@gmail.com',
            to: res.email,
            subject: 'Emergency Assigned',
            text: `New Patient Assigned

Patient Details:
Name: ${patient.name}
Contact: ${patient.contact}
Email: ${patient.email}
 Location:
${mapLink}

Please navigate immediately.`
        };


        // Send both emails
        await Promise.all([
            transporter.sendMail(userMail),
            transporter.sendMail(driverMail)
        ]);

        await Driver.updateOne(
            { vehicleNumber: res.vehicleNumber },
            { status: "busy" }
        );

        return {
            status: true,
            driver: res
        };

    } catch (err) {
        console.error(err);
        return { status: false };
    }
}

module.exports = {
    allocateandSendMail
};