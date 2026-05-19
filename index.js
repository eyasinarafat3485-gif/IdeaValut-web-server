import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from 'express'
import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb'
import dotenv from 'dotenv'
import cors from 'cors'

dotenv.config();
const uri = process.env.MONGODB_URI;

const app = express()
const PORT = process.env.PORT

// middleware
app.use(cors());
app.use(express.json())

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
})

async function run() {
  try {
    await client.connect();
    const db= client.db("assignmenta9")
    
    const ideaCollection = db.collection("ideavalut")

    app.post('/idea', async (req, res)=>{
        const ideaData = req.body
        console.log(ideaData);
        const result = await ideaCollection.insertOne(ideaData)

        res.json(result)
    })

    app.get('/idea', async (req, res) => {
      const result = await ideaCollection.find().toArray()
      res.json(result)
    })



    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);



app.get('/', (req, res) => {
  res.send('Hello World! Server run on fine')
})

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}`)
})