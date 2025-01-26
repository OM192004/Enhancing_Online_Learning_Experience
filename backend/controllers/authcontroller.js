const jwt = require("jsonwebtoken")
const User = require("../models/User")
const bcrypt = require("bcrypt")
const crypto = require('crypto');
const nodemailer = require('nodemailer');

const SignUp = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'All fields are required.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email is already registered.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new User({
            username,
            email,
            password: hashedPassword,
        });

        await newUser.save();

        res.status(201).json({
            message: 'User registered successfully!',
            user: { id: newUser._id, username: newUser.username, email: newUser.email },
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
}

const Login = async (req, res) => {
    try {
        const { email, password } = req.body;


        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required.' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const isPasswordMatch = await bcrypt.compare(password, user.password);
        if (!isPasswordMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
            expiresIn: '7d',
        });

        res.cookie('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        res.status(200).json({
            message: 'Login successful.',
            user: { id: user._id, username: user.username, email: user.email },
        });
    } catch (error) {
        console.error('Error during login:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

const LogOut = async (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
    });

    res.status(200).json({ message: 'Logout successful.' });
}

const ForgetPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required.' });
        }

        const user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const resetToken = crypto.randomBytes(32).toString('hex');
        const resetTokenExpiry = Date.now() + 15 * 60 * 1000;

        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = resetTokenExpiry;
        await user.save();

        const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: user.email,
            subject: 'Password Reset Request',
            html: `<p>Click the link below to reset your password:</p>
                 <a href="${resetLink}">${resetLink}</a>
                 <p>This link is valid for 15 minutes.</p>`,
        });

        res.status(200).json({ message: 'Password reset link sent to your email.' });
    } catch (error) {
        console.error('Error during password reset request:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

const ResetPassword = async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token and new password are required.' });
        }

        const user = await User.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ message: 'Invalid or expired reset token.' });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);

        user.password = hashedPassword;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        await user.save();

        res.status(200).json({ message: 'Password has been reset successfully.' });
    } catch (error) {
        console.error('Error during password reset:', error);
        res.status(500).json({ message: 'Internal server error.' });
    }
}

const thirdPartyLogin = async (req, res) => {
    try {
      const { user } = req;
      if (!user) {
        return res.status(400).json({ message: 'Authentication failed.' });
      }
  
      const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, {
        expiresIn: '7d',
      });
  
      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });
  
      res.status(200).json({
        message: 'Login successful.',
        user: { id: user._id, username: user.username, email: user.email },
      });
    } catch (error) {
      console.error('Error during third-party login:', error);
      res.status(500).json({ message: 'Internal server error.' });
    }
  };
  

module.exports = { SignUp, Login, LogOut, ForgetPassword, ResetPassword, thirdPartyLogin} 
