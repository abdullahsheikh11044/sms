import express from "express";
import { teacherInvitation, teacherSignup, signIn, deleteUserByEmail } from "../controllers/teacherController.js";

const router = express.Router();

router.post('/invite-teacher', teacherInvitation);
router.post('/teacher-signup/:token', teacherSignup);
router.post('/signin', signIn);
router.delete('/delete-user', deleteUserByEmail);

export default router;