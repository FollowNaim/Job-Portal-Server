require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("server is running");
});

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.sdg7y.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

const run = async () => {
  try {
    console.log("pinnged your deployment successfully!");
    const db = client.db("job-portal");
    const jobsCollection = db.collection("jobs");
    const usersCollection = db.collection("users");
    const appliedJobsCollection = db.collection("jobs-application");

    // find the user
    app.get("/user", async (req, res) => {
      const result = await usersCollection.findOne({ email: req.query.email });
      res.send(result);
    });

    // get all jobs and limit and query

    app.get("/jobs", async (req, res) => {
      const limit = parseInt(req.query.limit) || 0;
      const email = req.query.email;
      if (email) {
        const result = await appliedJobsCollection
          .find({ email: email })
          .toArray();
        for (job of result) {
          const singleJob = await jobsCollection.findOne({ jobId: job.jobId });
          if (singleJob) {
            job.title = singleJob.title;
            job.company = singleJob.company;
            job.jobType = singleJob.jobType;
            job.salaryRange = singleJob.salaryRange;
          }
        }
        res.send(result);
      } else {
        const result = await jobsCollection.find().limit(limit).toArray();
        res.send(result);
      }
    });

    // get single job

    app.get("/jobs/:id", async (req, res) => {
      const result = await jobsCollection.findOne({ jobId: req.params.id });
      res.send(result);
    });

    // add user to db
    app.post("/users", async (req, res) => {
      const user = req.body;
      console.log(user);
      const result = await usersCollection.insertOne(user);
      res.send(result);
    });

    // Add job from requruiters

    app.post("/jobs", async (req, res) => {
      const result = await jobsCollection.insertOne(req.body);
      res.send(result);
    });

    // get requireters posted job

    app.get("/posted-jobs", async (req, res) => {
      const email = req.query.email;
      console.log(email);
      const result = await jobsCollection.find({ hr_email: email }).toArray();
      res.send(result);
    });

    // apply for job and add data to db

    app.post("/jobs/apply", async (req, res) => {
      const result = await appliedJobsCollection.insertOne(req.body);
      res.send(result);
    });
  } catch (err) {
    console.log("something went wrong", err);
  }
};

run().catch((err) => console.log(err));

app.listen(port, () => {
  console.log("server is running on port ", port);
});
