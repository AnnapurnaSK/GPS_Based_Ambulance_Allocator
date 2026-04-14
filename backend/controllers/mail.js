const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const {search}=require('./gps');

const Driver=require('../models/drivers');

const baseURL = "http://127.0.0.1:3000"; // Change to your frontend URL

// Generic function to send emails to both patient and driver
async function sendNotification(patient, driver, distance, duration) {
    try {
        const token = jwt.sign(
            { vehicleNumber: driver.vehicleNumber },
            process.env.JWT_SECRET || "SECRET_KEY",
            { expiresIn: "2h" }
        );

        const closeLink = `${baseURL}/user/api/close?token=${token}`;
        const mapLink = `https://www.google.com/maps?q=${Number(patient.lat).toFixed(6)},${Number(patient.lon).toFixed(6)}`;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL,
                pass: process.env.PASSWORD
            }
        });

        const userMail = {
            from: process.env.EMAIL,
            to: patient.email,
            subject: '🚑 Ambulance Allocated',
            text: `Hello ${patient.name},

An ambulance has been allocated to you from ${driver.hospital || "nearest facility"}.

Driver Details:
Name: ${driver.name}
Vehicle: ${driver.vehicleNumber}
Contact: ${driver.contact}

Distance: ${distance} km
ETA: ${duration} minutes

Click this link after you reach the destination to release the unit: ${closeLink}

Stay calm, help is on the way.`
        };

        const driverMail = {
            from: process.env.EMAIL,
            to: driver.email,
            subject: '🚨 Emergency Assigned',
            text: `New Patient Assigned

Patient Details:
Name: ${patient.name}
Contact: ${patient.contact}
Email: ${patient.email}

Location:
${mapLink}

Please navigate immediately using the link above.`
        };

        await Promise.all([
            transporter.sendMail(userMail),
            transporter.sendMail(driverMail)
        ]);

        return { status: true };
    } catch (err) {
        console.error("Email Sending Error:", err);
        return { status: false, error: err.message };
    }
}

async function allocateandSendMail(lat, lon, patient) {
    try {
        const res = await search(lat, lon);
        if (!res) return { status: false };

        const mailRes = await sendNotification(
            { ...patient, lat, lon },
            res,
            res.distance.toFixed(2),
            (res.duration * 60).toFixed(1)
        );

        if (mailRes.status) {
            await Driver.updateOne(
                { vehicleNumber: res.vehicleNumber },
                { status: "busy" }
            );
        }

        return { status: mailRes.status, driver: res };
    } catch (err) {
        console.error(err);
        return { status: false };
    }
}

module.exports = {
    allocateandSendMail
};