
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
const port = process.env.PROT || 8080;


const uri = process.env.MDBURI;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});


const JWKS = createRemoteJWKSet(new URL(`${process.env.CLIENT_URI}/api/auth/jwks`));

const verifyToken = async (req, res, next) => {
    const authHeader = req?.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const { payload } = await jwtVerify(token, JWKS);
        console.log(payload);
        next();
    } catch (error) {
        return res.status(403).json({ message: "Forbidden" });
    }
};

async function run() {
    try {
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
        const db = client.db('Qylentra');
        const doctor = db.collection('doctor');
        const DoctorAppointment = db.collection('doctorAppointment');

        app.get('/doctor', async (request, response) => {
            const corsor = doctor.find();
            const result = await corsor.toArray();
            response.send(result);
        });
        app.get('/doctor/:doctorid', verifyToken, async (request, response) => {
            try {
                const id = request.params.doctorid;

                if (!ObjectId.isValid(id)) {
                    return response.status(400).json({
                        message: "Invalid doctor id"
                    });
                }
                const query = {
                    _id: new ObjectId(id),
                };

                const data = await doctor.findOne(query);
                response.json(data);
            } catch (error) {
                response.status(500).json({
                    message: "Internal server error"
                });
            }
        });

        app.patch('/booking/:doctorid', verifyToken, async (request, response) => {
            try {
                const { doctorid } = request.params;
                const bookingData = request.body;

                if (!ObjectId.isValid(doctorid)) {
                    return response.status(400).json({
                        message: "Invalid Doctor ID"
                    });
                }
                const booking = await doctor.findOne({
                    _id: new ObjectId(doctorid)
                });
                if (!booking) {
                    return response.status(404).json({
                        message: "No Booking Found"
                    });
                }
                await doctor.updateOne(
                    {
                        _id: new ObjectId(doctorid)
                    },
                    {
                        $set: {
                            BookingDate: new Date()
                        }
                    }
                );
                const appointmentResult = await DoctorAppointment.insertOne({
                    ...bookingData,
                    AppointmentDate: new Date()
                });
                response.status(200).json({
                    success: true,
                    message: "Appointment Booked Successfully",
                    data: appointmentResult
                });

            } catch (error) {
                response.status(500).json({
                    message: "Internal Server Error"
                });
            }
        });
        app.get('/appointments/user/:userid', verifyToken, async (request, response) => {
            const { userid } = request.params;

            const appointments = await DoctorAppointment
                .find({ userId: userid })
                .toArray();
            response.send(appointments);
        });
        app.delete('/appointment/:id', async (request, response) => {
            const { id } = request.params;
            const query = {
                _id: new ObjectId(id)
            };
            const appointmentDelete = await DoctorAppointment.deleteOne(query);
            response.send(appointmentDelete);
        });
        app.patch('/appointment/:id', async (request, response) => {
            const id = request.params.id;
            const filter = {
                _id: new ObjectId(id),
            }
            const modifyuser = request.body;
            const Appointment = {
                $set: {
                    email: modifyuser.email,
                    patientName: modifyuser.patientName,
                    gende: modifyuser.gende,
                    phone: modifyuser.phone,
                    date: modifyuser.date,
                    time: modifyuser.time,
                }
            };
            const UpdatedAppointment = await DoctorAppointment.updateOne(filter, Appointment);
            response.send(UpdatedAppointment);
        })
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('SERVER IS RUNING!');
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});