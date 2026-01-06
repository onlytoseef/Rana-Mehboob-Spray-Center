const router = require("express").Router();
const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwtGenerator = require("../utils/jwtGenerator");
const validInfo = require("../middleware/validInfo");
const authorization = require("../middleware/authorization");

// Register
router.post("/register", validInfo, async (req, res) => {
  try {
    // 1. Destructure the req.body (name, email, password)
    const { name, email, password } = req.body;

    // 2. Check if user exists (if user exists then throw error)
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email
    ]);

    if (user.rows.length > 0) {
      return res.status(401).json("User already exists");
    }

    // 3. Bcrypt the user password
    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const bcryptPassword = await bcrypt.hash(password, salt);

    // 4. Enter the new user inside our database
    const newUser = await pool.query(
      "INSERT INTO users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING *",
      [name, email, bcryptPassword]
    );

    // 5. Generating our jwt token
    const token = jwtGenerator(newUser.rows[0].id);

    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Login
router.post("/login", validInfo, async (req, res) => {
  try {
    // 1. Destructure the req.body
    const { email, password } = req.body;

    // 2. Check if user doesn't exist (if not then we throw error)
    const user = await pool.query("SELECT * FROM users WHERE email = $1", [
      email
    ]);

    if (user.rows.length === 0) {
      return res.status(401).json("Password or Email is incorrect");
    }

    // 3. Check if incoming password is the same the database password
    const validPassword = await bcrypt.compare(
      password,
      user.rows[0].password_hash
    );

    if (!validPassword) {
      return res.status(401).json("Password or Email is incorrect");
    }

    // 4. Give them the jwt token
    const token = jwtGenerator(user.rows[0].id);

    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Verify Token
router.get("/is-verify", authorization, async (req, res) => {
  try {
    res.json(true);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get Profile
router.get("/profile", authorization, async (req, res) => {
  try {
    const user = await pool.query(
      "SELECT id, name, email, created_at FROM users WHERE id = $1",
      [req.user.id]
    );
    
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    res.json(user.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Update Profile
router.put("/profile", authorization, async (req, res) => {
  try {
    const { name, email } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Name is required" });
    }
    
    if (!email || !email.trim()) {
      return res.status(400).json({ message: "Email is required" });
    }
    
    // Check if email already exists for another user
    const existingUser = await pool.query(
      "SELECT * FROM users WHERE email = $1 AND id != $2",
      [email, req.user.id]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ message: "Email already in use" });
    }
    
    await pool.query(
      "UPDATE users SET name = $1, email = $2 WHERE id = $3",
      [name.trim(), email.trim(), req.user.id]
    );
    
    res.json({ message: "Profile updated successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Change Password
router.put("/change-password", authorization, async (req, res) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;
    
    // Validation
    if (!currentPassword) {
      return res.status(400).json({ message: "Current password is required" });
    }
    
    if (!newPassword) {
      return res.status(400).json({ message: "New password is required" });
    }
    
    if (newPassword.length < 6) {
      return res.status(400).json({ message: "New password must be at least 6 characters" });
    }
    
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ message: "New passwords do not match" });
    }
    
    // Get user
    const user = await pool.query("SELECT * FROM users WHERE id = $1", [req.user.id]);
    
    if (user.rows.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Verify current password
    const validPassword = await bcrypt.compare(currentPassword, user.rows[0].password_hash);
    
    if (!validPassword) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }
    
    // Hash new password
    const saltRound = 10;
    const salt = await bcrypt.genSalt(saltRound);
    const bcryptPassword = await bcrypt.hash(newPassword, salt);
    
    // Update password
    await pool.query(
      "UPDATE users SET password_hash = $1 WHERE id = $2",
      [bcryptPassword, req.user.id]
    );
    
    res.json({ message: "Password changed successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
