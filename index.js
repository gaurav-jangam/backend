const express = require("express");
const { MongoClient } = require("mongodb");
const jwt = require("jsonwebtoken");
const app = express();
const secretKey = "secretKey";
const mongoose = require("mongoose");

// Replace <connection-string> with the connection string for your MongoDB instance
const uri =
  "mongodb://mongo:4iefZnUeZR5lbHq4NL49@containers-us-west-145.railway.app:7754";

const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function listDocuments() {
  try {
    await client.connect();
    console.log("test");

    // Replace <database-name> and <collection-name> with the name of the database and collection you want to show documents for
    const database = client.db("test");
    const collection = database.collection("Users");

    const documents = await collection.find().toArray();
    console.log("Documents in collection:");
    console.log(documents);
    return documents;
  } catch (err) {
    console.log(err);
  } finally {
    await client.close();
    console.log("Disconnected from MongoDB");
  }
}

app.get("/", (req, res) => {
  res.json(listDocuments());
});

app.post("/login", (req, res) => {
  const user = {
    id: 1,
    username: "anil",
    email: "abc@test.com",
  };
  jwt.sign({ user }, secretKey, { expiresIn: "24h" }, (err, token) => {
    res.json({
      token,
    });
  });
});

app.post("/profile", verifyToken, (req, res) => {
  jwt.verify(req.token, secretKey, (err, authData) => {
    if (err) {
      res.send({ result: "Invalid Token" });
    } else {
      res.json({
        message: "profile Access",
        authData,
      });
    }
  });
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
