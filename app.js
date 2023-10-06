const express = require("express");
const bodyParser = require("body-parser");
const app = express();
const nodemailer = require("nodemailer");
const MongoClient = require('mongodb').MongoClient;
const dotenv = require('dotenv');

dotenv.config();

const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASSWORD;
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;

const jsonData = require('./config.json');

const url = `mongodb+srv://${dbUser}:${dbPass}@cluster0.uclnjxz.mongodb.net/`;
const dbName = "needles";
const client = new MongoClient(url);

const transporter = nodemailer.createTransport({
  host: 'smtp.office365.com',
  port: 587, // This is the default SMTP port for Outlook
  secure: false, // Use TLS for secure connection
  auth: {
    user: smtpUser, // Your Outlook email address
    pass: smtpPass // Your Outlook email password
  }
});

const port = 3000;

app.use(bodyParser.json());

async function dbConnect() {
  try {
    await client.connect();
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

app.post("/needlesStatus", async (req, res) => {
  const { name, longitude, latitude, temperature, moisture } = req.body;

  const responseBuilder = { name, temperature, moisture, longitude, latitude };

  if (temperature > jsonData.maxTemperature || moisture < jsonData.minMoisture) {
    await sendEmail(transporter, {name, temperature, moisture});
  }

  dbConnect().then((err) => {
    if (err) {
      console.error("Error connecting to MongoDB:", err);
      res.status(500).json({ error: "Database connection error" });
      return;
    }

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

const sendEmail = async (transporter, data) => {
  const mail =  {
      from: 'needles1993@outlook.com', 
      to: "christianjarrouj24@gmail.com",
      subject: "Neddle status warning",
      text: `Needle ${data?.name} temperature is ${data?.temperature} and the moisture is ${data?.moisture} found under this link https://www.google.com/maps?q=${data?.latitude},${data?.longitude}`,
      html: `<b>Needle ${data?.name} temperature is ${data?.temperature} and the moisture is ${data?.moisture} found under this link https://www.google.com/maps?q=${data?.latitude},${data?.longitude}</b>`
    }
    await transporter.sendMail(mail);
}

app.listen(port, () => {
  console.log(`Listen on port ${port}`);
});
