import { Router } from "express";
import loginController from "../controllers/loginController.js";
import bodyParser from "body-parser";

const router = Router();

router.use(bodyParser.urlencoded({extended: true}));
router.use(bodyParser.json());
router.use(bodyParser.urlencoded({ extended: true }));

router.get(`/register`, loginController.getRegister);
router.get(`/login`, loginController.getLogin);
router.get(`/logout`, loginController.logout);
router.post(`/login`, loginController.loginAuth);
router.post(`/register_process`, loginController.register_process)

export default router;