import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { importGtfs } from "gtfs";
import config from './config/gtfs.config.js';
import { router } from "./router/route.js";

const PORT = process.env.PORT || 5050
const app = express()
const corsOptions = {
  origin: 'https://komyut.vercel.app/',
  credentials: true
}

app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());
app.use(helmet());

app.use('/api/v1', router);

// await importGtfs(config);
app.listen(PORT, () => console.log(`server is running on PORT ${PORT}`));



