import dotenv from 'dotenv';
import connectDB from './config/db.js';
import app from './app.js';

dotenv.config();

const PORT = process.env.PORT || 3100;

// Start server (for local development only)
if (process.env.VERCEL !== '1') {
  connectDB()
    .then(() => {
      app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📚 API Documentation available at http://localhost:${PORT}/`);
      });
    })
    .catch((error) => {
      console.error('❌ MongoDB Connection Error:', error.message);
    });
}

export default app;