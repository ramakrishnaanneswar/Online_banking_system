import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';

import authRoutes from './routes/authRoutes.js';
import accountRoutes from './routes/accountRoutes.js';
import transferRoutes from './routes/transferRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import cardRoutes from './routes/cardRoutes.js';
import loanRoutes from './routes/loanRoutes.js';
import billRoutes from './routes/billRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

dotenv.config();

const app = express();

// Middleware
const allowedOrigins = [
  "http://localhost:5173",
  "https://online-banking-system-m51f.vercel.app",
  "https://online-banking-system-m51f-git-main-rama-krishna-s-projects.vercel.app",
  "https://online-banking-system-khaki.vercel.app",
];

// Allow additional origins from CLIENT_URL env (Render / custom domains)
if (process.env.CLIENT_URL) {
  process.env.CLIENT_URL.split(',').forEach((origin) => {
    const trimmed = origin.trim();
    if (trimmed && !allowedOrigins.includes(trimmed)) {
      allowedOrigins.push(trimmed);
    }
  });
}

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// API Routes
app.use('/api/auth', authRoutes);
console.log("✅ Auth routes mounted");

app._router.stack.forEach((layer) => {
  if (layer.route) {
    console.log(layer.route.path, Object.keys(layer.route.methods));
  } else if (layer.name === "router") {
    layer.handle.stack.forEach((r) => {
      if (r.route) {
        console.log(
          "AUTH:",
          r.route.path,
          Object.keys(r.route.methods)
        );
      }
    });
  }
});
app.use('/api/accounts', accountRoutes);
app.use('/api/transfer', transferRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/cards', cardRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Online Banking API is running',
    version: '1.0.0',
    endpoints: [
      '/api/auth',
      '/api/accounts',
      '/api/transfer',
      '/api/transactions',
      '/api/cards',
      '/api/loans',
      '/api/bills',
      '/api/reports',
      '/api/dashboard',
    ],
  });
});

app.get('/api/health', (req, res) => {
  res.json({ success: true, status: 'UP', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.originalUrl}` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('❌ Server Error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

export default app;