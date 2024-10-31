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

        const signupLink = `http://localhost:5000/api/teachers/signup/${invitationToken}`;
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

export const studentInvitation = async (req, res) => {
    try {
        // Retrieve teacher's email from `req.user` (populated by the authentication middleware)
        const teacherEmail = req.user.email;

        const { studentEmail, section, courses } = req.body; // Email of the student to be invited and other details

        // Verify that the user has a teacher role
        if (req.user.role !== "teacher") {
            return res.status(403).json({ message: "You don't have permission to add students." });
        }

        // Check if the student already exists
        const existingStudent = await User.findOne({ email: studentEmail });
        if (existingStudent) {
            return res.status(400).json({ message: "Student with this email already exists." });
        }

        // Create an invitation token for the student
        const invitationToken = jwt.sign({ email: studentEmail, role: 'student', section, courses }, process.env.JWT_SECRET, { expiresIn: '24h' });

        // Configure the email transporter
        const transporter = nodemailer.createTransport({
            service: 'Gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
        });

        // Compose the email
        const signupLink = `http://localhost:5000/signup/${invitationToken}`;
        const mailOptions = {
            from: process.env.EMAIL_USER,
            to: studentEmail,
            subject: 'Student Invitation',
            html: `<p>You have been invited to join the course. Click <a href="${signupLink}">here</a> to complete the registration.</p>`,
        };

        // Send the email invitation
        await transporter.sendMail(mailOptions);
        res.status(200).json({ message: `Invitation sent successfully to student ${studentEmail} by teacher ${teacherEmail}.` });
    } catch (error) {
        console.error("Error sending student invitation:", error);
        res.status(500).json({ message: "An error occurred while inviting the student." });
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