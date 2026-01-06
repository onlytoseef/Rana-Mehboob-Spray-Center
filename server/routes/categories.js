const router = require("express").Router();
const pool = require("../db");
const authorization = require("../middleware/authorization");

// Create Category
router.post("/", authorization, async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }
    
    // Check if category already exists
    const existing = await pool.query("SELECT * FROM categories WHERE LOWER(name) = LOWER($1)", [name.trim()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Category already exists" });
    }
    
    const newCategory = await pool.query(
      "INSERT INTO categories (name) VALUES($1) RETURNING *",
      [name.trim()]
    );
    res.json(newCategory.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get All Categories
router.get("/", authorization, async (req, res) => {
  try {
    const allCategories = await pool.query("SELECT * FROM categories ORDER BY name ASC");
    res.json(allCategories.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Update Category
router.put("/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }
    
    // Check if another category with same name exists
    const existing = await pool.query(
      "SELECT * FROM categories WHERE LOWER(name) = LOWER($1) AND id != $2", 
      [name.trim(), id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ message: "Category name already exists" });
    }
    
    // Update category name in categories table
    await pool.query("UPDATE categories SET name = $1 WHERE id = $2", [name.trim(), id]);
    
    // Also update products that have this category
    const oldCategory = await pool.query("SELECT name FROM categories WHERE id = $1", [id]);
    if (oldCategory.rows[0]) {
      await pool.query(
        "UPDATE products SET category = $1 WHERE category = $2",
        [name.trim(), oldCategory.rows[0].name]
      );
    }
    
    res.json({ message: "Category updated successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Delete Category
router.delete("/:id", authorization, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if category is used in products
    const category = await pool.query("SELECT name FROM categories WHERE id = $1", [id]);
    if (category.rows[0]) {
      const usage = await pool.query("SELECT COUNT(*) FROM products WHERE category = $1", [category.rows[0].name]);
      if (parseInt(usage.rows[0].count) > 0) {
        return res.status(400).json({ message: "Cannot delete category. It is used by products." });
      }
    }
    
    await pool.query("DELETE FROM categories WHERE id = $1", [id]);
    res.json({ message: "Category deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
