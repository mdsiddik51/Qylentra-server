
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
dotenv.config();
const app = express();
app.use(cors());
const port = process.env.PROT || 8080;



// user = Qylentra-A9
// pass = agR1yrhXN1VK4o2j


const uri = process.env.MDBURI;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();
        // Send a ping to confirm a successful connection
        // await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
        const db = client.db('Qylentra');
        const doctor = db.collection('doctor');

        app.get('/doctor', async (request, response) => {
            const corsor = doctor.find();
            const result = await corsor.toArray();
            response.send(result);
        });
        app.get('/doctor/:doctorid', async (request, response) => {
            
            const id = request.params.doctorid;
            const quary = {
                _id: new ObjectId(id),
            };
            const data = await doctor.findOne(quary);
            response.send(data);
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