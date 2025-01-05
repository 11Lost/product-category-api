const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Database configuration
const pool = new Pool({
  user: 'postgres', // Replace with your PostgreSQL username
  host: 'localhost',     // Replace with your host
  database: 'test', // Replace with your database name
  password: '123456', // Replace with your password
  port: 5432,            // Default PostgreSQL port
});

// Function to create tables
async function initializeDatabase() {
  const createCategoriesTable = `
    CREATE TABLE IF NOT EXISTS categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL
    );
  `;

  const createProductsTable = `
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name VARCHAR(50) NOT NULL,
      category_id INT REFERENCES categories(id)
    );
  `;

  try {
    // Check and create the tables
    await pool.query(createCategoriesTable);
    console.log('Categories table checked/created.');

    await pool.query(createProductsTable);
    console.log('Products table checked/created.');
  } catch (err) {
    console.error('Error creating tables:', err.message);
  }
}

// Initialize database and start server
initializeDatabase()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('Error initializing database:', err.message);
  });

// Routes

// 1. CRUD for Categories
app.get('/categories', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM categories');
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/categories', async (req, res) => {
  try {
    const { name } = req.body;
    const result = await pool.query(
      'INSERT INTO categories (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const result = await pool.query(
      'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/categories/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    res.json({ message: 'Category deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// 2. CRUD for Products
app.get('/products', async (req, res) => {
  let { page = 1, size = 10 } = req.query;

  // Convert query parameters to numbers and validate
  page = parseInt(page, 10);
  size = parseInt(size, 10);
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(size) || size < 1) size = 10;

  const offset = (page - 1) * size;

  try {
    const result = await pool.query(
      `SELECT p.id AS product_id, p.name AS product_name, 
              c.id AS category_id, c.name AS category_name
       FROM products p
       JOIN categories c ON p.category_id = c.id
       ORDER BY p.id
       LIMIT $1 OFFSET $2`,
      [size, offset]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.post('/products', async (req, res) => {
  try {
    const { name, category_id } = req.body;
    const result = await pool.query(
      'INSERT INTO products (name, category_id) VALUES ($1, $2) RETURNING *',
      [name, category_id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.put('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { product_name, category_id } = req.body;
    const result = await pool.query(
      'UPDATE products SET name = $1, category_id = $2 WHERE id = $3 RETURNING *',
      [product_name, category_id, id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

app.delete('/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ message: 'Product deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});
