require('dotenv').config();

const app       = require('./src/app');
const connectDB = require('./src/config/db');
const logger    = require('./src/utils/logger');

const PORT = process.env.PORT || 3000;

connectDB()
  .then(() => {
    app.listen(PORT, '0.0.0.0', () => {
      logger.info(`Server running on http://localhost:${PORT}`);
      logger.info(`Swagger UI → http://localhost:${PORT}/api-docs`);
    });
  })
  .catch((err) => {
    logger.error('MongoDB connection failed:', err.message);
    process.exit(1);
  });
