import express  from "express";
import dotenv from 'dotenv';
import connectDb from "./config/db.js";
import teacherRoutes from "./routes/teacherRoutes.js";

const app = express();
dotenv.config();
connectDb();
app.use(express.json());
app.use('/api/teachers', teacherRoutes);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => console.log(`Server started on port ${PORT}`));