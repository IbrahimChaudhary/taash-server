const express = require('express');
const crypto = require('crypto');
const User = require('../models/User');
const router = express.Router();
const nodemailer = require('nodemailer');
const { frontendUrl } = require('../config');
const jwt = require('jsonwebtoken');
const { jwtSecret } = require('../config');

// Nodemailer setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const sendVerificationEmail = async (email, userId) => {
    const token = jwt.sign({ id: userId }, jwtSecret, { expiresIn: '15m' });
    const verifyUrl = `http://${process.env.RESET_URL}/verify-email?token=${token}`;
  
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Verify Your Email',
      html: `Click <a href="${verifyUrl}">here</a> to verify your email. This link expires in 15 minutes.`,
    });
  };
  

// Endpoint to handle email verification link click
router.get('/verify-email', async (req, res) => {
    const { token } = req.query;
    try {
      const decoded = jwt.verify(token, jwtSecret);
      const user = await User.findById(decoded.id);
  
      if (!user) return res.status(404).send('User not found');
      if (user.verified) return res.send('Email already verified');
  
      user.verified = true;
      await user.save();
  
      res.send('Email verified successfully. You can now open the app and log in.');
    } catch (err) {
      res.status(400).send('Invalid or expired token');
    }
  });
  
  

module.exports = { router, sendVerificationEmail };
