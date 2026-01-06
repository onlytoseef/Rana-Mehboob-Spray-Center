const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");

// Create Customer
router.post("/", authorization, async (req, res) => {
  try {
    const { name, phone } = req.body;
    const newCustomer = await pool.query(
      "INSERT INTO customers (name, phone) VALUES($1, $2) RETURNING *",
      [name, phone]
    );
    res.json(newCustomer.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get All Customers
router.get("/", authorization, async (req, res) => {
  try {
    const allCustomers = await pool.query("SELECT * FROM customers ORDER BY id ASC");
    res.json(allCustomers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get Single Customer
router.get("/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await pool.query("SELECT * FROM customers WHERE id = $1", [
      id
    ]);
    res.json(customer.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Update Customer
router.put("/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone } = req.body;
    const updateCustomer = await pool.query(
      "UPDATE customers SET name = $1, phone = $2 WHERE id = $3",
      [name, phone, id]
    );
    res.json("Customer was updated!");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Delete Customer
router.delete("/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const deleteCustomer = await pool.query("DELETE FROM customers WHERE id = $1", [
      id
    ]);
    res.json("Customer was deleted!");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
