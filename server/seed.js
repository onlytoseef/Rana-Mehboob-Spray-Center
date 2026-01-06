const pool = require('./db');
const bcrypt = require('bcryptjs');

const seedAdmin = async () => {
    try {
        const name = "Admin User";
        const email = "admin@example.com";
        const password = "adminpassword";
        const role = "admin";

        // Check if user exists
        const userExist = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userExist.rows.length > 0) {
            console.log("Admin user already exists.");
            process.exit(0);
        }

        // Hash password
        const saltRound = 10;
        const salt = await bcrypt.genSalt(saltRound);
        const bcryptPassword = await bcrypt.hash(password, salt);

        // Insert user
        const newUser = await pool.query(
            "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING *",
            [name, email, bcryptPassword, role]
        );

        console.log("Admin user created successfully:");
        console.log("Email: admin@example.com");
        console.log("Password: adminpassword");
        
    } catch (err) {
        console.error(err.message);
    } finally {
        // Close the pool connection to allow the script to exit
        pool.end();
    }
};

seedAdmin();
