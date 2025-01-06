const mongoose = require("mongoose");

const userImageSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  imageUrl: {
    type: String,
    required: true,
    unique: true,
    default: "default.jpg",
  },
});

const UserImage = mongoose.model("UserImage", userImageSchema);
module.exports = UserImage;
