const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files from the current directory
app.use(express.static(__dirname));

// Parse JSON bodies
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Route for the main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Route for employee page
app.get('/employee.html', (req, res) => {
  res.sendFile(path.join(__dirname, 'employee.html'));
});

// Start the server
app.listen(PORT, () => {
  console.log(`\n🚀 Server is running!`);
  console.log(`📍 Local:    http://localhost:${PORT}`);
  console.log(`📍 Employee: http://localhost:${PORT}/employee.html`);
  console.log(`\nPress Ctrl+C to stop the server\n`);
});
