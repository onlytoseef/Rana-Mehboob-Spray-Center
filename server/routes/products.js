const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");

// Create Product
router.post("/", authorization, async (req, res) => {
  try {
    const { name, category, unit, opening_stock, opening_cost } = req.body;
    const newProduct = await pool.query(
      "INSERT INTO products (name, category, unit, opening_stock, opening_cost, current_stock) VALUES($1, $2, $3, $4, $5, $6) RETURNING *",
      [name, category, unit, opening_stock, opening_cost, opening_stock]
    );
    res.json(newProduct.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get All Products
router.get("/", authorization, async (req, res) => {
  try {
    const allProducts = await pool.query("SELECT * FROM products ORDER BY id ASC");
    res.json(allProducts.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get Single Product
router.get("/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const product = await pool.query("SELECT * FROM products WHERE id = $1", [
      id
    ]);
    res.json(product.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Update Product
router.put("/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, unit } = req.body;
    const updateProduct = await pool.query(
      "UPDATE products SET name = $1, category = $2, unit = $3 WHERE id = $4",
      [name, category, unit, id]
    );
    res.json("Product was updated!");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Delete Product
router.delete("/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if product is used in import_items
    const importUsage = await pool.query("SELECT COUNT(*) FROM import_items WHERE product_id = $1", [id]);
    if (parseInt(importUsage.rows[0].count) > 0) {
      return res.status(400).json({ message: "Cannot delete product. It is used in import invoices." });
    }
    
    // Check if product is used in sales_items
    const salesUsage = await pool.query("SELECT COUNT(*) FROM sales_items WHERE product_id = $1", [id]);
    if (parseInt(salesUsage.rows[0].count) > 0) {
      return res.status(400).json({ message: "Cannot delete product. It is used in sales invoices." });
    }
    
    // Check if product is used in stock_movements
    const stockUsage = await pool.query("SELECT COUNT(*) FROM stock_movements WHERE product_id = $1", [id]);
    if (parseInt(stockUsage.rows[0].count) > 0) {
      return res.status(400).json({ message: "Cannot delete product. It has stock movement history." });
    }
    
    await pool.query("DELETE FROM products WHERE id = $1", [id]);
    res.json("Product was deleted!");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
