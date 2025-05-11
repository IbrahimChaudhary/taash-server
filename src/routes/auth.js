const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtSecret, cookieOptions } = require('../config');
const authMiddleware = require('../middleware/auth');
const crypto = require('node:crypto');
const { sendVerificationEmail } = require('./verify');
const router = express.Router();
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

router.post('/signup', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email & password required' });
    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Already registered; please login' });
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const user = new User({ email, password, provider: 'email', verified: false });
    await sendVerificationEmail(user.email, user._id);
    await user.save();
    res.status(201).json({ message: 'User created' });
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log("login", email, password);
        const user = await User.findOne({ email });
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        if (!user.verified) {
            return res.status(403).json({ error: 'Please verify your email before logging in.' });
        }
        const token = jwt.sign({ id: user._id, email: user.email }, jwtSecret, { expiresIn: '1d' });
        res.cookie('token', token, cookieOptions);
        res.json({ message: 'Logged in' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;

router.post('/forgot-password', async (req, res) => {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ error: 'User not found' });
  
    const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '15m' });
    const resetUrl = `http://${process.env.RESET_URL}/reset-password.html?token=${token}`;
  
    await transporter.sendMail({
      to: email,
      subject: 'Reset Your Password',
      html: `Click <a href="${resetUrl}">here</a> to reset your password.`,
    });
    console.log("email sent")
    res.json({ message: 'Reset link sent to email' });
  });

router.post('/reset-password', async (req, res) => {
    const { token, password } = req.body;
    try {
      const decoded = jwt.verify(token, jwtSecret);
      const user = await User.findById(decoded.id);
      if (!user) return res.status(404).send('User not found');
  
      user.password = password;
      await user.save();
  
      res.send('Password has been reset successfully.');
    } catch (err) {
      res.status(400).send('Invalid or expired token.');
    }
  });

  
router.post('/google/signup', async (req,res) => {
    try {
      const { idToken } = req.body;
      const ticket = await client.verifyIdToken({ idToken, audience:googleClientId });
      const { email } = ticket.getPayload();
      const existing = await User.findOne({ email });
      if (existing) {
        return res.status(400).json({ error:'User already exists, please login' });
      }
      const user = new User({
        email,
        provider:'google',
        verified:true,      
      });
      await user.save();
      res.status(201).json({ message:'User created via Google' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error:'Google signup failed' });
    }
  });

router.post('/google/login', async (req, res) => {
    try {
        const { idToken } = req.body;
        const ticket = await client.verifyIdToken({
            idToken,
            audience: googleClientId,
        });
        const { email } = ticket.getPayload();
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ error: 'User does not exist' });
        }
        const token = jwt.sign(
            { id: user._id, email: user.email },
            jwtSecret,
            { expiresIn: '1d' }
        );
        res.cookie('token', token, cookieOptions);
        res.json({ message: 'Logged in' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Google login failed' });
    }
});

module.exports = router;

router.get('/me', authMiddleware, async (req, res) => {
    try {
        // req.user was injected by authMiddleware
        const user = await User.findById(req.user.id).select('-password');
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }
        res.json({ user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router

router.post('/logout', (req, res) => {
    res.clearCookie('token', cookieOptions);
    res.json({ message: 'Logged out' });
});