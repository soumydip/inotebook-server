const mongoose = require("mongoose");
const UserSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 12,
  },
  phone: {
    type: Number,
    required: true,
    minlength: 10,
  },
  IssuedTime:{
    type: Date,
    default: Date.now()
  }
},{timestamps: true});
module.exports = mongoose.model("User", UserSchema);
