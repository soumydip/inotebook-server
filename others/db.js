const mongoose = require("mongoose");

const connectToMongo = () => {
  mongoose.connect("mongodb://localhost:27017/inotebook")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log(err));
};

module.exports = connectToMongo;
