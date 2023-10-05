const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const nodemailer = require("nodemailer");
const MongoClient = require('mongodb').MongoClient;

const url = "mongodb+srv://christianjarrouj24:YK578_23@cluster0.mk5r7qf.mongodb.net/";
const dbName = "needles";
const client = new MongoClient(url);

const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587, // This is the default SMTP port for Outlook
  secure: false, // Use TLS for secure connection
  auth: {
    user: 'chrisjarrouj@outlook.com', // Your Outlook email address
    pass: 'YK578_23' // Your Outlook email password
  }
});

const port = 3000;

app.use(bodyParser.json());

async function dbConnect() {
  try {
    await client.connect();
    const info = await transporter.sendMail({
      from: 'chrisjarrouj@outlook.com', // sender address
      to: "christianjarrouj24@gmail.com", // list of receivers
      subject: "Hello ✔", // Subject line
      text: "Hello world?", // plain text body
      html: "<b>Hello world?</b>", // html body
    });
  
    console.log("Message sent: %s", info.messageId);
  } catch (error) {       
    return error;
  }

  return null;
}

app.get("/needlesConfig", (req, res) => {
  dbConnect().then((err) => {
    if (err) {
      console.error("Error connecting to MongoDB:", err);
      res.status(500).json({ error: "Database connection error" });
      return;
    }

    console.log("Connected to MongoDB successfully");

    const db = client.db(dbName);
    const collection = db.collection("needlesConfig");

    collection.findOne({}).then((data, err) => {
      if (err) {
        console.error("Error querying data:", err);
        res.status(500).json({ error: "Database query error" });
        return;
      }
      res.status(200).json({ needlesConfig: data });

      client.close();
    });
  });
});

app.get("/needles", (req, res) => {
  dbConnect().then((err) => {
    if (err) {
      console.error("Error connecting to MongoDB:", err);
      res.status(500).json({ error: "Database connection error" });
      return;
    }

    console.log("Connected to MongoDB successfully");

    const db = client.db(dbName);
    const collection = db.collection("needles");

    collection
      .find({})
      .toArray()
      .then((data, err) => {
        if (err) {
          console.error("Error querying data:", err);
          res.status(500).json({ error: "Database query error" });
          return;
        }
        res.status(200).json({ needles: data });

        client.close();
      });
  });
});

app.get("/needles/:name", (req, res) => {
  const needleName = req.params.name;

  dbConnect().then((err) => {
    if (err) {
      console.error("Error connecting to MongoDB:", err);
      res.status(500).json({ error: "Database connection error" });
      return;
    }

    console.log("Connected to MongoDB successfully");

    const db = client.db(dbName);
    const collection = db.collection("needles");

    collection.findOne({ name: needleName }).then((data, err) => {
      if (err) {
        console.error("Error querying data:", err);
        res.status(500).json({ error: "Database query error" });
        return;
      }
      res.status(200).json({ needle: data });

      client.close();
    });
  });
});

app.get("/needlesStatus/:name", (req, res) => {
  const needleName = req.params.name;

  dbConnect().then((err) => {
    if (err) {
      console.error("Error connecting to MongoDB:", err);
      res.status(500).json({ error: "Database connection error" });
      return;
    }

    const db = client.db(dbName);
    const collection = db.collection("needlesStatus");

    collection
      .find({ name: needleName })
      .toArray()
      .then((data, err) => {
        if (err) {
          console.error("Error querying data:", err);
          res.status(500).json({ error: "Database query error" });
          return;
        }
        res.status(200).json({ needle: data });

        client.close();
      });
  });
});

app.post("/needles", (req, res) => {
  const { name, longitude, latitude } = req.body;

  dbConnect().then((err) => {
    if (err) {
      console.error("Error connecting to MongoDB:", err);
      res.status(500).json({ error: "Database connection error" });
      return;
    }

    console.log("Connected to MongoDB successfully");

    const db = client.db(dbName);
    const collection = db.collection("needles");

    collection
      .insertOne({ name, longitude, latitude, dateTime: new Date() })
      .then((data, err) => {
        if (err) {
          console.error("Error querying data:", err);
          res.status(500).json({ error: "Database query error" });
          return;
        }
        res.status(200).json({ message: "Added Successfully", ...data });

        client.close();
      });
  });
});

app.post("/needlesStatus", (req, res) => {
  const { name, longitude, latitude, temperature, moisture } = req.body;

  const responseBuilder = { name, temperature, moisture };

  dbConnect().then((err) => {
    if (err) {
      console.error("Error connecting to MongoDB:", err);
      res.status(500).json({ error: "Database connection error" });
      return;
    }

    console.log("Connected to MongoDB successfully");

    const db = client.db(dbName);
    const collection = db.collection("needlesStatus");

    collection
      .insertOne({
        name,
        longitude,
        latitude,
        temperature,
        moisture,
        dateTime: new Date(),
      })
      .then((data, err) => {
        if (err) {
          console.error("Error querying data:", err);
          res.status(500).json({ error: "Database query error" });
          return;
        }
        res.status(200).json({
          ...responseBuilder,
          ...data,
        });

        client.close();
      });
  });
});

app.listen(port, () => {
  console.log(`Listen on port ${port}`);
});
