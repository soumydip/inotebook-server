const jwt = require("jsonwebtoken");
const User = require("../model/user");
const JWT_SECRET = process.env.JWT_SECRET;
const moment = require("moment");

const verifyToken = async (req, res, next) => {
  const token = req.header("Authorization")?.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "No token, authorization denied" });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, JWT_SECRET);
    const { userId, username, IssuedTime } = decoded;

    // Check if the token contains all required fields
    if (!userId || !username || !IssuedTime) {
      return res.status(400).json({ message: "Invalid token structure" });
    }

    // Find the user by ID
    const user = await User.findById(userId).select("-password");

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const userIssuedTime = moment(user.IssuedTime).utc().toISOString();
    const tokenIssuedTime = moment(IssuedTime).utc().toISOString();
    if (userIssuedTime !== tokenIssuedTime) {
      return res.status(401).json({ message: "IssuedTime does not match" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Token verification failed:", error.message);
    return res.status(400).json({ message: "Invalid token" });
  }
};

module.exports = verifyToken;
