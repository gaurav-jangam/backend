const express = require("express");
const { MongoClient } = require("mongodb");
const jwt = require("jsonwebtoken");
const app = express();
const secretKey = "secretKey";
const mongoose = require("mongoose");
const { ObjectId } = require("mongodb");
const helmet = require('helmet');


// Replace <connection-string> with the connection string for your MongoDB instance
const uri =
  "mongodb://mongo:4iefZnUeZR5lbHq4NL49@containers-us-west-145.railway.app:7754";

// Middleware to parse JSON and urlencoded data from the request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet({
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function listDocuments() {
  try {
    await client.connect();

    // Replace <database-name> and <collection-name> with the name of the database and collection you want to show documents for
    const database = client.db("test");
    const collection = database.collection("users");

    const documents = await collection.find().toArray();
    //   console.log('Documents in collection:');
    console.log(documents.map((x) => x.name));
    return documents;
  } catch (err) {
    console.log(err);
  }
}

app.get("/", async (req, res) => {
  const documents = await listDocuments();
  res.json(documents.map((x) => x?.name));
});

// Route to handle user registration
app.post("/register", async (req, res) => {
  try {
    // Parse the request body
    const { firstName, lastName, mobileNumber, email } = req.body;

    // Connect to the database
    await client.connect();
    const database = client.db("test");
    const collection = database.collection("users");

    // Check if user with the given email already exists
    const existingUser = await collection.findOne({ email });
    if (existingUser) {
      // User already exists, return an error response
      return res
        .status(400)
        .json({ message: "User with this email already exists" });
    }

    // Create a new user document in the database
    const newUser = { firstName, lastName, mobileNumber, email };
    await collection.insertOne(newUser);

    res.json({ message: "User created successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

app.post("/login", async (req, res) => {
  const { firstName, email } = req.body;

  try {
    const client = await MongoClient.connect(uri, { useUnifiedTopology: true });
    const database = client.db("test");
    const collection = database.collection("users");

    // Find the user by first name
    const user = await collection.findOne({ firstName });

    if (!user) {
      return res.status(401).json({ error: "Invalid login credentials" });
    }

    jwt.sign({ user }, secretKey, { expiresIn: "24h" }, (err, token) => {
      if (err) {
        return res.status(500).json({ error: "Unable to generate JWT token" });
      }

      res.json({ user, token });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post("/profile", verifyToken, (req, res) => {
  jwt.verify(req.token, secretKey, (err, authData) => {
    if (err) {
      res.send({ result: "Invalid Token" });
    } else {
      res.json({
        message: "profile Access",
        userData: authData.user,
        token: req.token,
      });
    }
  });
});

// Route to get all tickets with token verification
app.get("/tickets", verifyToken, async (req, res) => {
  const { firstName } = req.body;
  try {
    const client = await MongoClient.connect(uri, { useUnifiedTopology: true });
    const database = client.db("test");
    const collection = database.collection("tickets");

    // Find the user by first name
    const tickets = await collection.find({ firstName: firstName }).toArray();
    // Return the user information
    if (tickets.length > 0) {
      res.json(tickets);
    } else {
      res.status(404).json({ error: 'No users found with the given first name' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal server error" });
  }
});

app.post('/tickets', verifyToken, async (req, res) => {
  try {
    const client = await MongoClient.connect(uri, { useUnifiedTopology: true });
    const database = client.db('test');
    const collection = database.collection('tickets');

    const { ticketId, time } = req.body;
    const result = await collection.insertOne({ ticketId, time });
    await collection.findOne({ _id: new ObjectId(result.insertedId) });

    res.json({ message: "Ticket Added successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

app.get("/users/:firstname", verifyToken, async (req, res) => {
  try {
    const { firstname } = req.params;

    // Verify token
    jwt.verify(req.token, secretKey, async (err, authData) => {
      if (err) {
        res.status(401).json({ message: "Invalid token" });
      } else {
        // Connect to the database
        const client = await MongoClient.connect(uri, {
          useUnifiedTopology: true,
        });
        const database = client.db("test");
        const collection = database.collection("users");

        // Find the user by first name
        const user = await collection.findOne({ firstName: firstname });

        // Close the database connection
        await client.close();

        // Return the user information
        if (user) {
          res.json(user);
        } else {
          res.status(404).json({ message: "User not found" });
        }
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Internal server error" });
  }
});

function verifyToken(req, res, next) {
  const bearerHeader = req.headers["authorization"];
  if (typeof bearerHeader !== "undefined") {
    const bearer = bearerHeader.split(" ");
    const token = bearer[1];
    req.token = token;
    next();
  } else {
    res.send({
      result: "token is not valid",
    });
  }
}

app.listen(5000, () => {
  console.log("hello");
});
