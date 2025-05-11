const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const { router: verifyRoutes } = require('./routes/verify');
const authMiddleware = require('./middleware/auth');
const { port, env, mongoUri, frontendUrl } = require('./config');
const path = require('path');

const app = express();

app.use(express.static(path.join(__dirname, '..', 'public')));
app.use(helmet());
app.use(
    cors({
        origin: env === 'development' ? true : frontendUrl, 
        credentials: true,
    })
); app.use(express.json());
app.use(cookieParser());

mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB error:', err));

app.use('/api/auth', authRoutes);
app.use('/', verifyRoutes); 

app.get('/api/protected', authMiddleware, (req, res) => {
    res.json({ message: `Hello, ${req.user.email}` });
});

app.listen(port, () => {
    console.log(`Server running in ${env} mode on port ${port}`);
});