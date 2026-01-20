const express = require('express');
const cors = require('cors');
const path = require('path');

// Load dotenv with explicit path
try {
    require('dotenv').config({ path: path.join(__dirname, '.env') });
} catch (err) {
    console.log('No .env file found, using config file instead');
}

const pool = require('./db');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Global Error Handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Something went wrong!' });
});

// Config routes (no auth required)
app.use("/api/config", require("./routes/config"));

// Backup route (no auth required - runs on window close)
app.use("/api/backup", require("./routes/backup"));

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/products", require("./routes/products"));
app.use("/api/categories", require("./routes/categories"));
app.use("/api/suppliers", require("./routes/suppliers"));
app.use("/api/customers", require("./routes/customers"));
app.use("/api/imports", require("./routes/imports"));
app.use("/api/sales", require("./routes/sales"));
app.use("/api/returns", require("./routes/returns"));
app.use("/api/payments", require("./routes/payments"));
app.use("/api/ledger", require("./routes/ledger"));
app.use("/api/dashboard", require("./routes/dashboard"));
app.use("/api/batches", require("./routes/batches"));

// Test Route
app.get('/', (req, res) => {
    res.send('Mehboob Spray Center API is running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
