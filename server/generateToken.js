const jwt = require("jsonwebtoken");
require("dotenv").config();

const generateToken = () => {
    const payload = {
        user: {
            id: 1 // Assuming admin has ID 1
        }
    };

    const secret = process.env.JWT_SECRET || "your_jwt_secret";
    const token = jwt.sign(payload, secret, { expiresIn: "1h" });

    console.log("Generated JWT Token:");
    console.log(token);
};

generateToken();
