const express = require('express');
const connectToMongo = require('./others/db'); // Ensure the path is correct
const app = express();
const port = 4000;
const cors = require('cors');
// MongoDB connection
connectToMongo();
app.use(cors())
app.use(express.json())
app.use("/uploads", express.static("uploads"));
app.use("/api/user", require('./routes/auth')); 
app.use("/api/notes",require('./routes/notes'))
app.use("/api/images",require('./routes/ImageRoutes'))
app.get('/', (req, res) => res.send('Hello World!'));

app.listen(port, () => console.log(`Server is running on port ${port}!`));
