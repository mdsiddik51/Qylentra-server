
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

const validate = (request, response, next) => {
    next();

}

const VarifyToken = async (request, response, next) => {
    const { authorization } = request.headers;
    const token = authorization.split(' ')[1];
    if (!token) {
        return response.status(401).json({
            message: "Unauthorized",
        });
    }
    try {
        const JWKS = createRemoteJWKSet(
            new URL(`${process.env.CLIENT_URI}/api/auth/jwks`)
        );
        const { payload } = await jwtVerify(token, JWKS,);
        request.user = payload;


        next();
    } catch (error) {
        console.error('Token validation failed:', error)
        return response.status(401).json({
            message: "Unauthorized",
        });
    }

}

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
        app.get('/doctor/:doctorid', VarifyToken, async (request, response) => {
            const id = request.params.doctorid;
            console.log(request.user)
            const quary = {
                _id: new ObjectId(id),
            };
            const data = await doctor.findOne(quary);
            response.send(data);
        });

        app.patch('/booking/:doctorid', VarifyToken, async (request, response) => {
            const { doctorid } = request.params;
            const BookingData = request.body;
            const booking = await doctor.findOne({ _id: new ObjectId(doctorid) });
            if (!booking) {
                return response.status(404).json({
                    message: "No Booking Found",
                });
            }

            await doctor.updateOne({ _id: new ObjectId(doctorid) },
                {
                    $set: {
                        BookingDate: new Date(),
                    }
                }

            );
            const AppointmentResult = await DoctorAppointment.insertOne({
                ...BookingData,
                AppointmentDate: new Date()
            });
            response.send(AppointmentResult);
        })
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