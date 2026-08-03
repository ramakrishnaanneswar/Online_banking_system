import mongoose from 'mongoose';
import app from '../server/src/app.js';

// Connect to MongoDB on cold start (reused across invocations)
if (mongoose.connection.readyState === 0) {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/online_banking';
  mongoose.connect(uri).catch((err) => {
    console.error('❌ MongoDB Connection Error:', err.message);
  });
}

export default app;