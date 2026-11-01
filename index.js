const express = require('express');
const path = require('path');
const { open } = require('sqlite');
const sqlite3 = require('sqlite3');

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, 'books.db');
let db = null;

// Initialize Database connection and start Express server
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });

    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
      console.log(`Server is running at http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error(`DB Error: ${error.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

// Root route - Student details and API Info
app.get('/', (req, res) => {
  res.status(200).json({
    project: 'BDF Lab 2: SQLite Database and CRUD Routes',
    student: {
      name: 'M Dharmik Satya',
      registrationNumber: '252U1R5075',
      section: '106 AI/DE-1A',
    },
    status: 'Server and Database Active',
    availableEndpoints: [
      { method: 'GET', endpoint: '/books/', description: 'Get all books' },
      { method: 'GET', endpoint: '/books/:bookId/', description: 'Get book by ID' },
      { method: 'POST', endpoint: '/books/', description: 'Add a new book' },
      { method: 'PUT', endpoint: '/books/:bookId/', description: 'Update a book' },
      { method: 'DELETE', endpoint: '/books/:bookId/', description: 'Delete a book' },
    ],
  });
});

// API 1: Get All Books
// Method: GET | Endpoint: /books/
app.get('/books/', async (req, res) => {
  try {
    const getBooksQuery = `
      SELECT *
      FROM book
      ORDER BY id;
    `;
    const books = await db.all(getBooksQuery);
    res.status(200).json(books);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error while fetching books', details: error.message });
  }
});

// API 2: Get Book by ID
// Method: GET | Endpoint: /books/:bookId/
app.get('/books/:bookId/', async (req, res) => {
  try {
    const { bookId } = req.params;

    if (isNaN(bookId)) {
      return res.status(400).json({ error: 'Invalid Book ID format. ID must be an integer.' });
    }

    const getBookQuery = `
      SELECT *
      FROM book
      WHERE id = ?;
    `;
    const book = await db.get(getBookQuery, [bookId]);

    if (!book) {
      return res.status(404).json({ error: `Book with ID ${bookId} not found` });
    }

    res.status(200).json(book);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error while fetching book', details: error.message });
  }
});

// API 3: Add a New Book
// Method: POST | Endpoint: /books/
app.post('/books/', async (req, res) => {
  try {
    const { title, author, price, pages } = req.body;

    // Validation
    if (!title || !author || price === undefined || pages === undefined) {
      return res.status(400).json({
        error: 'Missing required fields. Please provide title, author, price, and pages.',
      });
    }

    if (typeof price !== 'number' || typeof pages !== 'number' || price < 0 || pages <= 0) {
      return res.status(400).json({
        error: 'Invalid input. Price must be a non-negative number and pages must be a positive number.',
      });
    }

    const addBookQuery = `
      INSERT INTO book (title, author, price, pages)
      VALUES (?, ?, ?, ?);
    `;
    const result = await db.run(addBookQuery, [title.trim(), author.trim(), price, pages]);

    res.status(201).json({
      message: 'Book Added Successfully',
      bookId: result.lastID,
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error while adding book', details: error.message });
  }
});

// API 4: Update a Book
// Method: PUT | Endpoint: /books/:bookId/
app.put('/books/:bookId/', async (req, res) => {
  try {
    const { bookId } = req.params;

    if (isNaN(bookId)) {
      return res.status(400).json({ error: 'Invalid Book ID format. ID must be an integer.' });
    }

    // Check if book exists first
    const checkBookQuery = `
      SELECT *
      FROM book
      WHERE id = ?;
    `;
    const existingBook = await db.get(checkBookQuery, [bookId]);

    if (!existingBook) {
      return res.status(404).json({ error: `Book with ID ${bookId} not found` });
    }

    const { title, author, price, pages } = req.body;

    // Validation
    if (!title || !author || price === undefined || pages === undefined) {
      return res.status(400).json({
        error: 'Missing required fields. Please provide title, author, price, and pages.',
      });
    }

    if (typeof price !== 'number' || typeof pages !== 'number' || price < 0 || pages <= 0) {
      return res.status(400).json({
        error: 'Invalid input. Price must be a non-negative number and pages must be a positive number.',
      });
    }

    const updateBookQuery = `
      UPDATE book
      SET title = ?,
          author = ?,
          price = ?,
          pages = ?
      WHERE id = ?;
    `;
    await db.run(updateBookQuery, [title.trim(), author.trim(), price, pages, bookId]);

    res.status(200).json({
      message: 'Book Updated Successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error while updating book', details: error.message });
  }
});

// API 5: Delete a Book
// Method: DELETE | Endpoint: /books/:bookId/
app.delete('/books/:bookId/', async (req, res) => {
  try {
    const { bookId } = req.params;

    if (isNaN(bookId)) {
      return res.status(400).json({ error: 'Invalid Book ID format. ID must be an integer.' });
    }

    // Check if book exists first
    const checkBookQuery = `
      SELECT *
      FROM book
      WHERE id = ?;
    `;
    const existingBook = await db.get(checkBookQuery, [bookId]);

    if (!existingBook) {
      return res.status(404).json({ error: `Book with ID ${bookId} not found` });
    }

    const deleteBookQuery = `
      DELETE FROM book
      WHERE id = ?;
    `;
    await db.run(deleteBookQuery, [bookId]);

    res.status(200).json({
      message: 'Book Deleted Successfully',
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error while deleting book', details: error.message });
  }
});

// 404 Route Catch-All Handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

module.exports = app;
