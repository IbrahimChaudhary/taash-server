const dotenv = require('dotenv');
dotenv.config();

module.exports = {
    port: process.env.PORT || 3000,
    env: process.env.NODE_ENV || 'development',
    mongoUri: process.env.MONGO_URI,
    jwtSecret: process.env.JWT_SECRET,
    googleClientId: process.env.GOOGLE_CLIENT_ID,
    cookieOptions: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000,
    },
    frontendUrl: process.env.FRONTEND_URL,
};
