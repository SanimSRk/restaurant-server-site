const express = require('express');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const port = process.env.PORT || 5000;
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mqe77mp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();
    const menus = client.db('resturantDB');
    const menuCollcation = menus.collection('allFoods');
    const userOrderCollaction = menus.collection('userOrders');
    const userAccessData = menus.collection('user');

    //middlewrs verify token
    const verifyToken = (req, res, next) => {
      if (!req.headers.authorization) {
        return res.status(401).send({ message: 'forbidden acces' });
      }
      const token = req.headers.authorization.split(' ')[1];
      jwt.verify(token, process.env.ACCESS_TOKEN_SECURE, (err, decode) => {
        if (err) {
          return res.status(401).send({ message: 'forbidden access' });
        }
        req.decode = decode;
        next();
      });
    };

    //jwt token secure data
    app.post('/jwt', async (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECURE, {
        expiresIn: '1d',
      });
      res.send({ token });
    });

    //access all user data and product data
    app.get('/menu', async (req, res) => {
      const result = await menuCollcation.find().toArray();
      res.send(result);
    });

    app.post('/userOrder', async (req, res) => {
      const user = req.body;
      const result = await userOrderCollaction.insertOne(user);
      res.send(result);
    });

    app.get('/carts', async (req, res) => {
      const email = req.query.email;
      const qurey = { email: email };
      const result = await userOrderCollaction.find(qurey).toArray();
      res.send(result);
    });

    app.delete('/carts/:id', async (req, res) => {
      const id = req.params.id;
      const qurey = { _id: new ObjectId(id) };
      const result = await userOrderCollaction.deleteOne(qurey);
      res.send(result);
    });

    app.post('/users', async (req, res) => {
      const user = req.body;
      const qurey = { email: user?.email };
      const existingUser = await userAccessData.findOne(qurey);
      if (!existingUser) {
        const result = await userAccessData.insertOne(user);
        res.send(result);
      } else {
        return res.send({ message: 'user alredy esist' });
      }
    });

    app.get('/users', verifyToken, async (req, res) => {
      const result = await userAccessData.find().toArray();
      res.send(result);
    });
    app.delete('/users/:id', async (req, res) => {
      const id = req.params.id;
      const qurey = { _id: new ObjectId(id) };
      const result = await userAccessData.deleteOne(qurey);
      res.send(result);
    });

    app.patch('/users/admin/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };

      const updateDac = {
        $set: {
          role: 'admin',
        },
      };
      const result = await userAccessData.updateOne(filter, updateDac);
      res.send(result);
    });

    app.get('/user/admin/:email', verifyToken, async (req, res) => {
      const email = req?.params?.email;
      if (email !== req?.decode?.email) {
        return res?.status(401).send({ message: 'unauthorized' });
      }
      const qurey = { email: email };
      const user = await userAccessData.findOne(qurey);
      let admin = false;
      if (user) {
        admin = user?.role === 'admin';
      }
      res.send({ admin });
    });

    // Send a ping to confirm a successful connection
    // await client.db('admin').command({ ping: 1 });
    console.log(
      'Pinged your deployment. You successfully connected to MongoDB!'
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get('/', (req, res) => {
  res.send('restaurant server site is runing ');
});

app.listen(port, () => {
  console.log(`restaurant server port is :${port}`);
});
