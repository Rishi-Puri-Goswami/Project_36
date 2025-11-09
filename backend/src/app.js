import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import connectDB from "./config/db.js";
import workerRoutes from "./routes/workerRoutes.js";
import clientRoutes from "./routes/clientRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import fs from "fs";
import path from "path";

dotenv.config();

const app = express();

app.use(cors({
    origin: ['http://localhost:5173' , 'https://project-36-lyart.vercel.app'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

// ensure uploads folder exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// connect DB
connectDB();

// mount routes
app.use('/api/workers', workerRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/admin', adminRoutes);

app.get('/', (req, res) => res.send('API is running'));

export default app;
