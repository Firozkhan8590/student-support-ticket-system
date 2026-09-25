import { Router } from "express";
import {
    login,
    register,
} from "../../controllers/auth/auth.controller";
import {
    authenticate,
    AuthRequest,
} from "../../middleware/auth.middleware";

const router = Router();

router.post("/register", register);
router.post("/login", login);

router.get("/me", authenticate, (req: AuthRequest, res) => {
    return res.status(200).json({
        success: true,
        data: {
            user: req.user,
        },
    });
});

export default router;