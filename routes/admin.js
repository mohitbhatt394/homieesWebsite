import express from "express";
import { dashboard, deleteUser, deleteProvider } from "../controllers/admin.js";
import { isAdmin } from "../middlewares/isAdmin.js";
import isLoggedIn from "../middlewares/auth.js";


const router = express.Router();


router.get("/dashboard",isLoggedIn ,isAdmin ,dashboard);
router.post("/delete-user/:user_id", isLoggedIn, isAdmin, deleteUser);
router.post("/delete-provider/:provider_id", isLoggedIn, isAdmin, deleteProvider);


export default router;
