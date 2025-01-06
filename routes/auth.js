const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../model/user");
const Note=require('../model/notes');
require("dotenv").config();
const verifyToken = require("../others/verifyToken");
const Router = express.Router();

// Add user route
Router.post("/signup", async (req, res) => {
  const { userName, password, email, phone } = req.body;

  try {
    // Check if the email already exists
    const existingUser = await User.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({
        message: "Email already exists",
        success: false,
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      userName,
      password: hashedPassword,
      email,
      phone,
      IssuedTime: Date.now(),
    });

    // Save the new user to the database
    await newUser.save();

    // Generate a JWT token
    const token = jwt.sign(
      {
        userId: newUser._id,
        username: newUser.userName,
        IssuedTime: newUser.IssuedTime,
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Respond with the user and token
    res.status(200).json({
      message: "User added successfully!",
      user: { token },
      success: true,
    });
  } catch (error) {
    console.error("Signup Error:", error);
    res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
});

// Login the user
Router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Check if the email exists in the database
    const existingUser = await User.findOne({ email: email });
    if (!existingUser) {
      return res.status(401).json({
        message: "Invalid email",
        success: false,
      });
    }

    // Compare the entered password with the stored hashed password
    const isPasswordMatch = await bcrypt.compare(
      password,
      existingUser.password
    );
    if (!isPasswordMatch) {
      return res.status(401).json({
        message: "Wrong password",
        success: false,
      });
    }

    // Update IssuedTime during login
    existingUser.IssuedTime = Date.now(); // Update IssuedTime
    await existingUser.save(); // Save the updated IssuedTime in the database

    // Generate a JWT token for the user
    const token = jwt.sign(
      {
        userId: existingUser._id,
        username: existingUser.userName,
        IssuedTime: existingUser.IssuedTime,
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    // Respond with the token and user data
    res.status(200).json({
      message: "Login successful",
      success: true,
      token: token,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
});

// Get user profile
Router.get("/profile", verifyToken, (req, res) => {
  res.status(200).json({
    success: true,
    message: "User verified successfully",
    user: req.user,
  });
});

// Reset password
Router.put("/resetPassword", verifyToken, async (req, res) => {
  const { email, newPassword, oldPassword } = req.body;

  try {
    // Validate email
    const userData = await User.findOne({ email: email });
    if (!userData) {
      return res.status(404).json({ message: "Invalid Email", success: false });
    }

    // Compare the entered old password with the stored hashed password
    const isPasswordMatch = await bcrypt.compare(
      oldPassword,
      userData.password
    );
    if (!isPasswordMatch) {
      return res
        .status(401)
        .json({ message: "Wrong old password", success: false });
    }

    // Hash the new password
    const newHashedPassword = await bcrypt.hash(newPassword, 10);

    // Update the password in the database
    userData.password = newHashedPassword;
    await userData.save();

    return res
      .status(200)
      .json({ message: "Password reset successfully", success: true });
  } catch (error) {
    console.error("Error resetting password:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", success: false });
  }
});
// Update user profile
Router.put("/updateDetails", verifyToken, async (req, res) => {
  const { userName, oldEmail, newEmail, phone, password } = req.body;

  try {
    // Check if old email exists
    const existingUser = await User.findOne({ email: oldEmail });
    if (!existingUser) {
      return res
        .status(404)
        .json({ message: "Old email does not exist", success: false });
    }

    // Verify password
    const matchPassword = await bcrypt.compare(password, existingUser.password);
    if (!matchPassword) {
      return res
        .status(401)
        .json({ message: "Incorrect password", success: false });
    }

    // Check if new email is already in use
    const newEmailUser = await User.findOne({ email: newEmail });
    if (
      newEmailUser &&
      newEmailUser._id.toString() !== existingUser._id.toString()
    ) {
      return res
        .status(400)
        .json({ message: "New email is already in use", success: false });
    }

    const IssuedTime = Date.now();
    // Update user details
    const updatedUser = await User.findByIdAndUpdate(
      existingUser._id,
      { userName, email: newEmail, phone, IssuedTime },
      { new: true }
    );

    // Generate new JWT token
    const token = jwt.sign(
      {
        userId: updatedUser._id,
        username: updatedUser.userName,
        IssuedTime: updatedUser.IssuedTime,
      },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );
    return res.status(200).json({
      message: "User details updated successfully",
      success: true,
      token,
    });
  } catch (error) {
    console.error("Error updating user details:", error);
    return res
      .status(500)
      .json({ message: "Internal Server Error", success: false });
  }
});
//delete user updateDetails
Router.delete("/deleteUser", verifyToken, async (req, res) => {
  const userId = req.user._id;
  try {
    // Delete notes of the user
    await Note.deleteMany({ auther: userId });

    // Delete user data
    await User.deleteOne({ _id: userId });

    return res.status(200).json({
      message: "User and related notes deleted successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting user data:", error);
    return res.status(500).json({
      message: "Server error",
      success: false,
    });
  }
});


module.exports = Router;
