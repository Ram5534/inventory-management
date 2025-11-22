const sqlite3 = require('sqlite3').verbose();
const express = require('express');
const cors = require('cors');
const dotEnv = require('dotenv');
const autenticationRouter = require('./routes/authentication')
const productRoutes = require('./routes/products')
const path = require("path");

const dbPath = path.resolve(__dirname, "inventory.db");

const db = new sqlite3.Database(dbPath, err => {
  if (err) {
    console.error("Failed to connect:", err);
  } else {
    console.log("Connected to SQLite at", dbPath);
  }
});

module.exports = db;


dotEnv.config();
const app = express();
const PORT = process.env.PORT || 8080;

// Middleware
app.use(cors());
app.use(express.json());

// Database tables
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    unit TEXT,
    category TEXT,
    brand TEXT,
    stock INTEGER NOT NULL,
    status TEXT,
    image TEXT
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS inventory_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER,
    old_quantity INTEGER,
    new_quantity INTEGER,
    change_date TEXT,
    user_info TEXT,
    FOREIGN KEY(product_id) REFERENCES products(id)
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime'))
  )`);
});

// Routes
app.get('/', (req, res) => {
    console.log("Welcome");
    res.send("Welcome to Inventory API!");
});

app.use('/authentication',autenticationRouter)
app.use('/api',productRoutes)

// Start server
app.listen(PORT, () => {
    console.log(`Server is running at port ${PORT}`);
});
