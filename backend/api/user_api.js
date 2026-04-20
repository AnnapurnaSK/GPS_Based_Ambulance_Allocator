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
            { new: true }
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


                // ✅ SUCCESS PAGE
        return res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Close Ride</title>
          <style>
            body {
              min-height:100vh;
              display:flex;
              align-items:center;
              justify-content:center;
              background:#f5f5f5;
              font-family:sans-serif;
            }
            .box {
              text-align:center;
              max-width:340px;
              width:100%;
              background:#fff;
              border:1px solid #e0e0e0;
              border-radius:16px;
              padding:2.5rem 2rem;
            }
            .icon {
              font-size:40px;
              color:#3b6d11;
              margin-bottom:1rem;
            }
          </style>
        </head>
        <body>
          <div class="box">
            <div class="icon">✔</div>
            <h2>Ride closed successfully</h2>
            <p>Driver is now available</p>
          </div>
        </body>
        </html>
        `);

    } catch (err) {
        return sendErrorPage(res, "Something went wrong");
    }


    //     return res.status(200).json({
    //         status: true,
    //         message: "Ride closed successfully"
    //     });

    // } catch (err) {
    //     return res.status(401).json({
    //         status: false,
    //         message: " Something went wrong"
    //     });
    // }
}


function sendErrorPage(res, message) {
    return res.status(500).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Error</title>
      <style>
        body {
          display:flex;
          justify-content:center;
          align-items:center;
          height:100vh;
          background:#f5f5f5;
          font-family:sans-serif;
        }
        .box {
          text-align:center;
          background:#fff;
          padding:2rem;
          border-radius:12px;
        }
        .icon {
          font-size:40px;
          color:#a32d2d;
          margin-bottom:1rem;
        }
      </style>
    </head>
    <body>
      <div class="box">
        <div class="icon">✖</div>
        <h2>${message}</h2>
        <p>Please try again</p>
      </div>
    </body>
    </html>
    `);
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