const express = require("express");
const Router = express.Router();
const Note = require("../model/notes"); // Correct the typo in model path
const verifyToken = require("../others/verifyToken");

//add note to the user
Router.post("/addNote", verifyToken, async (req, res) => {
  try {
    const newNote = new Note({
      title: req.body.title,
      description: req.body.description,  // Corrected here
      tag: req.body.tag || "General",
      auther: req.user.id, // Set the authenticated user's ID
    });

    const savedNote = await newNote.save();

    res.status(200).json({
      message: "Note added successfully",
      success: true,
      note: {
        noteId: savedNote._id,
        title: savedNote.title,
        description: savedNote.description, // Corrected here
        tag: savedNote.tag,
        createdAt: savedNote.createdAt,
      },
    });
  } catch (err) {
    console.error("Error while saving note:", err);
    res.status(400).json({
      message: "An error occurred while saving",
      success: false,
    });
  }
});

// Edit note with particular id
Router.put("/editNote/:id", verifyToken, async (req, res) => {
  try {
    const { title, description, tag } = req.body; // Corrected here

    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { title, description, tag }, // Corrected here
      { new: true }
    );

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Note updated successfully",
      success: true,
      note: {
        noteId: note._id,
        title: note.title,
        description: note.description, // Corrected here
        tag: note.tag,
        createdAt: note.createdAt,
      },
    });
  } catch (error) {
    console.error("Error while updating note:", error);
    return res.status(400).json({
      message: "An error occurred while editing the note",
      success: false,
    });
  }
});

// Delete the particular note
Router.put("/deleteNote/:id", verifyToken, async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { $set: { isDeleted: true } },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Note moved to recycle bin successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error while moving note to recycle bin:", error);
    res.status(500).json({
      message: "An error occurred while deleting the note",
      success: false,
    });
  }
});

// Restore note from recycle bin
Router.put("/restoreNote/:id", verifyToken, async (req, res) => {
  try {
    const note = await Note.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false },
      { new: true }
    );

    if (!note) {
      return res.status(404).json({
        message: "Note not found in recycle bin",
        success: false,
      });
    }

    res.status(200).json({
      message: "Note restored successfully",
      success: true,
    });
  } catch (error) {
    console.error("Error while restoring note:", error);
    res.status(500).json({
      message: "An error occurred while restoring the note",
      success: false,
    });
  }
});

// Delete the note permanently
Router.delete("/deletePermanent/:id", verifyToken, async (req, res) => {
  try {
    const note = await Note.findByIdAndDelete(req.params.id);

    if (!note) {
      return res.status(404).json({
        message: "Note not found for permanent deletion",
        success: false,
      });
    }

    res.status(200).json({
      message: "Note deleted permanently",
      success: true,
    });
  } catch (error) {
    console.error("Error while permanently deleting note:", error);
    res.status(500).json({
      message: "An error occurred while permanently deleting the note",
      success: false,
    });
  }
});

// Find particular note
Router.get("/findNote/:id", verifyToken, async (req, res) => {
  try {
    // Fetch note by ID and populate author details
    const note = await Note.findById(req.params.id).populate("auther", "userName email");

    if (!note) {
      return res.status(404).json({
        message: "Note not found",
        success: false,
      });
    }

    const { title, description, tag } = note;
    const { userName, email } = note.auther;

    res.status(200).json({
      message: "Note found successfully",
      success: true,
      note: {
        noteId: note._id,
        title,
        tag,
        description,
        userName,
        email,
      },
    });
  } catch (error) {
    console.error("Error while fetching note:", error);
    res.status(500).json({
      message: "An error occurred while fetching the note",
      success: false,
    });
  }
});

// Get all notes
Router.get("/fetchAllNotes", verifyToken, async (req, res) => {
  try {
    const notes = await Note.find(
      { 
        auther: req.user.id,
        isDeleted: false
      },
      { new: true }
    )
      .populate("auther", "userName")
      .select("title description tag createdAt"); // Corrected here

    res.status(200).json({
      message: "Notes fetched successfully",
      success: true,
      notes: notes.map((note) => ({
        noteId: note._id,
        auther: note.auther.userName,
        title: note.title,
        description: note.description, // Corrected here
        tag: note.tag,
        createdAt: note.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error while fetching notes:", error);
    res.status(500).json({
      message: "An error occurred while fetching notes",
      success: false,
    });
  }
});

// Fetch all recycle bin notes
Router.get("/fetchRecycleBin", verifyToken, async (req, res) => {
  try {
    const notes = await Note.find({ auther: req.user.id, isDeleted: true });

    res.status(200).json({
      message: "Recycle bin notes fetched successfully",
      success: true,
      notes: notes.map((note) => ({
        noteId: note._id,
        title: note.title,
        description: note.description, // Corrected here
        auther: note.auther,
        tag: note.tag,
        createdAt: note.createdAt,
      })),
    });
  } catch (error) {
    console.error("Error while fetching recycle bin notes:", error);
    res.status(500).json({
      message: "An error occurred while fetching recycle bin notes",
      success: false,
    });
  }
});

module.exports = Router;
