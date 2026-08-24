import mongoose from 'mongoose';
import app from '../server/src/app.js';

// Connect to MongoDB on cold start (reused across invocations).
// Guard against missing/blocked MONGODB_URI (e.g. Vercel dashboard not configured
// or pointing at a local DB unreachable from Vercel's cloud) so the module and
// route mounting still succeed instead of crashing with an empty 500.
let dbConnected = false;
if (mongoose.connection.readyState === 0) {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is not set — DB routes will fail, but server boots.');
  } else {
    mongoose
      .connect(uri)
      .then(() => {
        dbConnected = true;
        console.log('✅ MongoDB connected');
      })
      .catch((err) => {
        console.error('❌ MongoDB Connection Error:', err.message);
      });
  }
}

export default app;