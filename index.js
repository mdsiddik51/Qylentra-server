
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const { createRemoteJWKSet, jwtVerify } = require('jose-cjs');
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


const VarifyToken = async (request, response, next) => {
    try {
        const authorization = request.headers.authorization;

        if (!authorization) {
            return response.status(401).json({
                message: "Unauthorized Access"
            });
        }

        const token = authorization.split(" ")[1];

        if (!token) {
            return response.status(401).json({
                message: "Token Missing"
            });
        }

        next();

    } catch (error) {

        response.status(500).json({
            message: "Internal Server Error"
        });
    }
};

async function run() {
    try {

        // await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
        const db = client.db('Qylentra');
        const doctor = db.collection('doctor');
        const DoctorAppointment = db.collection('doctorAppointment');

        app.get('/doctor', async (request, response) => {
            const corsor = doctor.find();
            const result = await corsor.toArray();
            response.send(result);
        });
        app.get('/doctor/:doctorid', async (request, response) => {
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

        app.patch('/booking/:doctorid', VarifyToken, async (request, response) => {
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
        app.get('/appointments/user/:userid', async (request, response) => {
            const { userid } = request.params;

            const appointments = await DoctorAppointment
                .find({ userId: userid })
                .toArray();
            response.send(appointments);
        });
        // app.get('/appointment/:id', async (request, response) => {
        //     const { id } = request.params;

        //     const singleappointment = await DoctorAppointment.findOne({
        //         _id: new ObjectId(id)
        //     });

        //     response.send(singleappointment);
        // });

        app.delete('/appointment/:id', async (request, response) => {
            const { id } = request.params;

            const query = {
                _id: new ObjectId(id)
            };

            const appointmentDelete = await DoctorAppointment.deleteOne(query);

            response.send(appointmentDelete);
        });
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Example app listening on port ${port}`);
});