import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';
import { notFound, errorHandler } from './middlewares/error.js';
import usersRouter from './routes/users.js';
import tasksRouter from './routes/tasks.js';
import { ok } from './utils/response.js';

const app = express();

// Base middleware
app.use(helmet());
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(morgan('dev'));

// DB connect
const uri = process.env.MONGODB_URI;
if (!uri) throw new Error('MONGODB_URI missing in .env');

mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
  .then(() => console.log('MongoDB connected'))
  .catch((e) => {
    console.error('MongoDB connection error:', e.message);
  });

// Health
app.get('/api/health', (req, res) => ok(res, { status: 'ok' }));

// Routers
app.use('/api/users', usersRouter);
app.use('/api/tasks', tasksRouter);

// 404 + error handler
app.use(notFound);
app.use(errorHandler);

export default app;