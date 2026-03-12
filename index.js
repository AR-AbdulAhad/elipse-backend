const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const contactRoutes = require('./src/routes/contactRoutes');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api', contactRoutes);

// Basic route for health check
app.get('/', (req, res) => {
  res.send('Elipse Backend is running...');
});

const server = app.listen(PORT, () => {
  console.log(`Server is successfully running on port ${PORT}`);
});

server.on('error', (error) => {
  console.error('Server failed to start:', error);
});
