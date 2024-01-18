import { Router } from "express";
import gtfs from "../controller/route.controller.js";

export const router = Router();

router.get('/routes', gtfs.getAllRoutes)
router.get('/routes/:id', gtfs.getRoutesById)
router.get('/search', gtfs.searchRoute)


