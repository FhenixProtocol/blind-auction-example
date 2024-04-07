const { Level } = require("level");
const express = require("express");
const bodyParser = require("body-parser");
var cors = require("cors");

const SERVER_PORT = 1337;
const app = express();

app.use(cors());

const db = new Level("records", { valueEncoding: "json" });

async function initREST() {
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  app.post("/set", async (req, res, _next) => {
    const request = JSON.parse(Object.keys(req.body)[0]);
    console.log(JSON.stringify(request));
    db.put(request.name, request);
    res.json({ result: "success" });
  });

  app.get("/get-my", async (req, res, _next) => {
    console.log(`hello get my`);
    const owner = req.query.owner;
    let result = new Array();
    for await (const [_, value] of db.iterator()) {
      console.log(`Value is`, value);
      if (value.owner.toLowerCase() === owner.toLowerCase()) {
        console.log(`In`);
        result.push(value);
      }
    }
    console.log(`Output of get my is ${JSON.stringify(result)}`);
    res.json({ result: "success", output: JSON.stringify(result) });
  });

  app.get("/get-their", async (req, res, _next) => {
    const owner = req.query.owner;
    let result = new Array();
    for await (const [_, value] of db.iterator()) {
      if (value.owner.toLowerCase() !== owner.toLowerCase()) {
        result.push(value);
      }
    }
    console.log(`Output of get thier is ${JSON.stringify(result)}`);
    res.json({ result: "success", output: JSON.stringify(result) });
  });

  app.get("/get-all", async (req, res, _next) => {
    let result = new Array();
    for await (const [_, value] of db.iterator()) {
      result.push(value);
    }
    console.log(`Output of all is ${JSON.stringify(result)}`);
    res.json({ result: "success", output: JSON.stringify(result) });
  });  

  app.get("/clear", async (_req, res, _next) => {
    db.clear();
    res.json({ result: "success" });
  });

  app.get("/health", async (_req, res, _next) => {
    console.log("Health Check!");
    res.json({ result: "success" });
 });


  app.listen(SERVER_PORT, () => {
    console.log(`Server running on port ${SERVER_PORT}`);
  });
}

async function main() {
  initREST();
}

main();
