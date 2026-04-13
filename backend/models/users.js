const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    contact: { type: String, required: true },
    email: { type: String, required: true },
    latitude: { type: Number, default: 0 },
    longitude: { type: Number, default: 0 },
    vehicleNumber: { type: String, default: "" }
}, { timestamps: true });

const User = mongoose.model('User', userSchema, 'users');

module.exports = User;