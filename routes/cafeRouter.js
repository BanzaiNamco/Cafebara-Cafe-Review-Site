import { Router } from "express";
import cafeController from "../controllers/cafeController.js";

const router = Router();

router.get(`/`, cafeController.getIndex);
router.get(`/cafe`, cafeController.getCafes);
router.post(`/cafe`, cafeController.searchcafes);

export default router;