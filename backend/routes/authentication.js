// routes/auth.js
const express = require('express');
const router = express.Router();
const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./inventory.db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_here'; // replace in .env
const JWT_EXPIRES = '1h';

// Register
router.post('/register', (req, res) => {
  const { username, password, email } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: "username and password are required" });
  }

  // Check user exists
  const selectQuery = `SELECT * FROM users WHERE username = ?`;
  db.get(selectQuery, [username], (err, row) => {
    if (err) {
      console.error("DB error (select):", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (row) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Hash and insert
    bcrypt.hash(password, 10, (hashErr, hashedPassword) => {
      if (hashErr) {
        console.error("Hash error:", hashErr);
        return res.status(500).json({ message: "Server error" });
      }

      const insertQuery = `INSERT INTO users (username, email, password, created_at) VALUES (?, ?, ?, datetime('now','localtime'))`;
      db.run(insertQuery, [username, email || null, hashedPassword], function(insertErr) {
        if (insertErr) {
          console.error("DB error (insert):", insertErr);
          return res.status(500).json({ message: "Database error" });
        }

        const userId = this.lastID;

        return res.status(201).json({
          message: "Registered successfully",
        });
      });
    });
  });
});

// Login
router.post('/login', (req, res) => {
  const { username, password } = req.body || {};

  if (!username || !password) {
    return res.status(400).json({ message: "username and password are required" });
  }

  const selectQuery = `SELECT * FROM users WHERE username = ?`;
  db.get(selectQuery, [username], (err, userRow) => {
    if (err) {
      console.error("DB error (select):", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (!userRow) {
      return res.status(400).json({ message: "Invalid username or password" });
    }

    // Compare password
    bcrypt.compare(password, userRow.password, (cmpErr, isMatch) => {
      if (cmpErr) {
        console.error("bcrypt error:", cmpErr);
        return res.status(500).json({ message: "Server error" });
      }

      if (!isMatch) {
        return res.status(400).json({ message: "Invalid username or password" });
      }

      const payload = { id: userRow.id, username: userRow.username };
      const token = jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES });

      return res.status(200).json({ message: "Login successful", token, user: { id: userRow.id, username: userRow.username } });
    });
  });
});

module.exports = router;
