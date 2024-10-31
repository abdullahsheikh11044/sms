import express from "express";
import { teacherInvitation, teacherSignup, signIn, deleteUserByEmail, studentInvitation } from "../controllers/teacherController.js";
import { authenticate } from "../middlewares/authenticate.js";
const router = express.Router();

router.post('/invite-teacher', teacherInvitation);
router.post('/signup/:token', teacherSignup);
router.post('/signin', signIn);
router.delete('/delete-user', deleteUserByEmail);
router.post('/invite-student', authenticate, studentInvitation);

export default router;