import express from "express";
import authController from "../controllers/auth.controller";
import isAuthorized from "../middlewares/auth.middleware";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", isAuthorized, authController.logout);
router.post("/refresh-token", authController.refreshToken);

export default router;
