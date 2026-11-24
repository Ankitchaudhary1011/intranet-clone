const express = require('express');
const cors = require('cors');
const app = express()
const port = process.env.port || 5000;
const mongoose = require("mongoose");
const {mongoUrl} = require("./keys")
const path = require("path");

require('./models/post')
require('./models/model')
app.use(express.json())
app.use(cors());
app.use(require("./routes/auth"))
app.use(require("./routes/CreatePost"))
app.use(require("./routes/user"))
mongoose.connect(mongoUrl);

mongoose.connection.on("connected",()=>{
     console.log("successfully connected to mongo")
})

mongoose.connection.on("error",()=>{
     console.log("Not connected to mongodb")
})


//serving the frontend
app.use(express.static(path.join(__dirname, "./frontend//build")))

app.get("/{*splat}",(req,res)=>{
     res.sendFile(
          path.join(__dirname, "./frontend/build/index.html"),
          function (err){
               res.status(500).send(err)
          }
     )
})

app.listen(port, () => {
     console.log("server is running on port" + " " + port)
})