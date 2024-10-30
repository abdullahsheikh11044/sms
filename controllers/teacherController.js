import User from "../models/User.js";
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';

export const teacherInvitation = async (req, res) => {
    try {
        const { email } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "User with this email already exists." });
        }

        const invitationToken = jwt.sign({ email, role: 'teacher' }, process.env.JWT_SECRET, { expiresIn: '24h' });
        const newTeacher = new User({
            email,
            role: "teacher",
            isInvited: true,
            invitationToken
        });
        await newTeacher.save();

        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
        });

        const signupLink = `http://localhost:5000/api/teachers/teacher-signup/${invitationToken}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: email,
            subject: 'Teacher Invitation',
            html: `<p>You have been invited to sign up as a teacher. Click <a href="${signupLink}">here</a> to complete the registration.</p>`,
        };

        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: 'Invitation sent successfully.' });
    } catch (err) {
        res.status(500).json({ message: 'An error occurred while inviting the teacher.' });
    }
};


export const teacherSignup = async (req, res) => {
    try {
        const { token } = req.params;
        const { password } = req.body;

        let decoded;
        try {
            decoded = jwt.verify(token, process.env.JWT_SECRET);
        } catch (error) {
            return res.status(400).json({ message: 'Invalid or expired invitation token.' });
        }

        const { email, role } = decoded;

        const user = await User.findOne({ email, role: 'teacher', isInvited: true });
        if (!user) {
            return res.status(400).json({ message: 'User not found or already signed up.' });
        }

        user.password = await bcrypt.hash(password, 10);
        user.isInvited = false;
        user.invitationToken = undefined;
        await user.save();
        res.status(200).json({ message: 'Signup successful. You can now log in.' });
    } catch (error) {
        res.status(500).json({ message: 'An error occurred during signup.' });
    }
};

export const signIn = async (req, res) => {
    try {

        const { email, password } = req.body;
        const verifyUser = await User.findOne({ email });
        if (!verifyUser) {
            return res.status(400).json({ message: "User with this email doesnot exists." });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        console.log(hashedPassword);
        const isPasswordCorrect = bcrypt.compare(password, verifyUser.password);
        if (!isPasswordCorrect) {
            res.status(400).json({ message: "invalid password." });
        }
        const token = jwt.sign({ email: verifyUser.email, id: verifyUser._id, role: verifyUser.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" });

        res.status(200).json({ result: verifyUser, token });
    }
    catch (err) {
        res.status(400).json({ message: "unable to login." })
    }
};

export const deleteUserByEmail = async (req, res) => {
    try {
        const { email } = req.body;
        const verifyUser = await User.findOne({ email });
        if (!verifyUser) {
            res.status(400).json({ message: "no user with this mail found." });
        }
        const result = await User.findByIdAndDelete(verifyUser._id)
        res.status(200).json({ message: "user deleted." });
        console.log(`Deleted ${result.deletedCount} user(s) with email: ${email}`);
    }
    catch (err) {
        res.status(400).json({ message: "unable to delete the user." });
    }
};