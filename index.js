import dns from "node:dns";
dns.setServers(["8.8.8.8", "8.8.4.4"]);

import express from 'express'
import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb'
import dotenv from 'dotenv'
import cors from 'cors'
import { createRemoteJWKSet, jwtVerify } from "jose-cjs";

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

const JWKS = createRemoteJWKSet(
  new URL(`${process.env.CLIENT_URL}/api/auth/jwks`)
)

const verifyToken = async (req, res, next) => {
  const authHeader = req?.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ message: "Unauthorized" })
  }
  const token = authHeader.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized" })
  }

  const { payload } = await jwtVerify(token, JWKS);
  req.user = payload;
  console.log(req.user);

  next();
}

async function run() {
  try {
    // await client.connect();
    const db = client.db("assignmenta9")

    const ideaCollection = db.collection("ideavalut")
    const commentsCollection = db.collection("comments")

    app.get('/idea', async (req, res) => {
      const result = await ideaCollection.find().toArray()
      res.json(result)
    })

    app.get('/trendingIdeas', async (req, res) => {
      const result = await ideaCollection.find().limit(6).toArray()
      res.json(result)
    })

    app.post('/idea', verifyToken, async (req, res) => {
      const ideaData = req.body
      // console.log(ideaData);
      const result = await ideaCollection.insertOne(ideaData)

      res.json(result)
    })

    app.get('/idea/:id', verifyToken, async (req, res) => {
      const { id } = req.params;
      const result = await ideaCollection.findOne({ _id: new ObjectId(id) })
      res.json(result)
    })

    app.get('/my-ideas/:userId', verifyToken, async (req, res) => {
      const { userId } = req.params;
      const result = await ideaCollection
        .find({ userId: userId })
        .toArray();
      console.log(result);

      res.json(result);
    })

    app.patch('/my-idea/:id', verifyToken, async (req, res) => {
      const { id } = await req.params;
      const updatedIdea = req.body
      console.log(updatedIdea);

      const result = await ideaCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedIdea }
      )
      res.json(result)
    })


    app.delete('/my-idea/:id', verifyToken, async (req, res) => {
      const { id } = req.params;
      console.log(id);

      const result = await ideaCollection.deleteOne({
        _id: new ObjectId(id)
      });
      console.log(result);

      res.json(result);
    })


    app.post('/api/comments', verifyToken, async (req, res) => {
      const commentData = req.body;

      const finalCommentData = {
        ...commentData,
        createdAt: new Date()
      };

      const result = await commentsCollection.insertOne(finalCommentData);
      const insertedComment = {
        _id: result.insertedId,
        ...finalCommentData
      };

      res.status(201).json(insertedComment);
    });

    app.get('/api/comments', verifyToken, async (req, res) => {
      const { ideaId } = req.query;

      let query = {};
      if (ideaId) {
        query = { ideaId: ideaId };
      }

      const result = await commentsCollection.find(query).sort({ _id: -1 }).toArray();
      res.json(result);
    });

    app.get('/comments/:ideaId', verifyToken, async (req, res) => {
      const { ideaId } = req.params;
      const result = await commentsCollection.find({ ideaId }).toArray();

      res.json(result);
    })

    app.patch('/comments/:id', verifyToken, async (req, res) => {
      const { id } = req.params;
      const updatedData = req.body;
      const result = await commentsCollection.updateOne(
        { _id: new ObjectId(id) },
        { $set: updatedData }
      )
      res.json(result)
    })

    app.delete('/comments/:id', verifyToken, async (req, res) => {
      const { id } = req.params;
      const result = await commentsCollection.deleteOne({ _id: new ObjectId(id) });

      res.json(result);
    })

    app.get('/api/comments/:userId', verifyToken, async (req, res) => {
      const { userId } = req.params;

      const result = await commentsCollection.find({ userId: userId }).toArray();
      res.json(result)
    })


    // Send a ping to confirm a successful connection
    // await client.db("admin").command({ ping: 1 });
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
