const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");

// Create Supplier
router.post("/", authorization, async (req, res) => {
  try {
    const { name, phone, currency } = req.body;
    const newSupplier = await pool.query(
      "INSERT INTO suppliers (name, phone, currency) VALUES($1, $2, $3) RETURNING *",
      [name, phone, currency]
    );
    res.json(newSupplier.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get All Suppliers
router.get("/", authorization, async (req, res) => {
  try {
    const allSuppliers = await pool.query("SELECT * FROM suppliers ORDER BY id ASC");
    res.json(allSuppliers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get Single Supplier
router.get("/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const supplier = await pool.query("SELECT * FROM suppliers WHERE id = $1", [
      id
    ]);
    res.json(supplier.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Update Supplier
router.put("/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phone, currency } = req.body;
    const updateSupplier = await pool.query(
      "UPDATE suppliers SET name = $1, phone = $2, currency = $3 WHERE id = $4",
      [name, phone, currency, id]
    );
    res.json("Supplier was updated!");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Delete Supplier
router.delete("/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const deleteSupplier = await pool.query("DELETE FROM suppliers WHERE id = $1", [
      id
    ]);
    res.json("Supplier was deleted!");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
