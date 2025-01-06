const express = require("express");
const multer = require("multer");
const fs = require("fs");
const UserImage = require("../model/profileImage");
const verifyToken=require("../others/verifyToken")
const Router = express.Router();

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = "./uploads"; // If uploads folder is already there, no need to create it again
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + "_" + file.originalname;
    cb(null, uniqueName);
  },
});

// Multer Upload Middleware with file size limit and file type filter
const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true); // Accept file
    } else {
      cb(new Error("Invalid file type. Only JPEG and PNG are allowed."));
    }
  },
});

Router.post("/upload", verifyToken, upload.single("image"), async (req, res) => {
  try {
    console.log("Request Body:", req.body);
    console.log("Uploaded File:", req.file);
    const userId = req.user._id;

    // Check if file exists
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    // Save file data to the database with a unique URL
    const newImage = new UserImage({
      user: userId,
      imageUrl: `http://localhost:4000/uploads/${req.file.filename}`,
    });

    await newImage.save();

    res.status(201).json({
      message: "Image uploaded successfully",
      data: newImage,
      success: true,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: "Failed to upload image",
      success: false,
    });
  }
});


Router.delete("/delete/:id", verifyToken, async (req, res) => {
  try {
    const imageId = req.params.id; 
    const userId = req.user._id;
    const image = await UserImage.findOne({ _id: imageId, user: userId });

    if (!image) {
      return res.status(404).json({ error: "Image not found or unauthorized access" });
    }
    const filePath = `./uploads/${image.imageUrl.split("/").pop()}`;

    fs.unlink(filePath, async (err) => {
      if (err) {
        console.error("Error deleting file:", err);
        return res.status(500).json({ error: "Failed to delete file from server" });
      }

      await UserImage.findByIdAndDelete(imageId);

      res.status(200).json({
        message: "Image deleted successfully",
        success: true,
      });
    });
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ error: "Failed to delete image" });
  }
});


Router.get("/fetchImage", verifyToken, async (req, res) => {
  const userId = req.user._id;

  try {
    // Query the UserImage collection directly using the userId
    const image = await UserImage.findOne({ user: userId });

    // If no image is found
    if (!image) {
      return res.status(404).json({ error: "Image not found or unauthorized access" });
    }

    // If image is found, return the image URL
    res.status(200).json({
      imageUrl: image.imageUrl,
      success: true,
      ImageId:image._id,
      message: "Image fetched successfully"
    });

  } catch (err) {
    console.error("Error fetching image:", err);
    return res.status(500).json({ error: "Failed to fetch image" });
  }
});


module.exports = Router;
