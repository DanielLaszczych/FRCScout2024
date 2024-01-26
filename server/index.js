const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');
const path = require('path');
const bcrypt = require('bcrypt');
const cloudinary = require('cloudinary').v2;
require('dotenv').config();
require('./auth/passport');

const app = express();

app.enable('trust proxy');
const PORT = process.env.PORT || 5000;

const corsPolicy = async (req, res, next) => {
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Origin', req.headers.origin);
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
    res.header('Access-Control-Allow-Headers', 'X-Requested-With, X-HTTP-Method-Override, Content-Type, Accept');
    next();
};

app.options('*', cors());
app.use(corsPolicy);

const requireHTTPS = (req, res, next) => {
    // The 'x-forwarded-proto' check is for Heroku
    if (!req.secure && req.get('x-forwarded-proto') !== 'https' && process.env.NODE_ENV !== 'development') {
        return res.redirect('https://' + req.get('host') + req.url);
    }
    next();
};

app.use(requireHTTPS);

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        resave: true,
        saveUninitialized: true,
        store: MongoStore.create({
            mongoUrl: process.env.DATABASE_URL
        }),
        cookie: {
            sameSite: `${process.env.NODE_ENV === 'production' ? 'none' : 'lax'}`, // cross site // set lax while working with http:localhost, but none when in prod
            secure: `${process.env.NODE_ENV === 'production' ? 'true' : 'auto'}`, // only https // auto when in development, true when in prod
            maxAge: 1000 * 60 * 60 * 24 * 14 // expiration time
        }
    })
);

const serverOptions = (app) => {
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());
    app.use(passport.initialize());
    app.use(passport.session());
};

serverOptions(app);

//routes
require('./routes')(app);
// app.use('/auth', require('./routes/auth'));
// app.use('/event', require('./routes/event'));
// app.use('/pitForm', require('./routes/pitForm'));
// app.use('/matchForm', require('./routes/matchForm'));
// app.use('/matchData', require('./routes/matchData'));
// app.use('/blueAlliance', require('./routes/blueAlliance').router);
// app.use('/groupMeBot', require('./routes/groupMeBot').router);
app.use('/checkTableauPass/:password', async (req, res) => {
    await bcrypt
        .compare(req.params.password, process.env.TABLEAU_HASH)
        .then((result) => {
            result ? res.send('Valid') : res.send('Invalid');
        })
        .catch((err) => {
            res.send('Invalid');
        });
});
app.use('/getuser', (req, res) => {
    res.send(req.user);
});

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

startServer();

async function startServer() {
    if (process.env.NODE_ENV === 'production') {
        app.use(express.static('../client/build'));
        app.get('*', (request, response) => {
            response.sendFile(path.join(__dirname, '../client/build', 'index.html'));
        });
    } else {
        app.get('/', (req, res) => {
            res.send('Hello World!');
        });
    }

    mongoose.set('strictQuery', false);

    mongoose
        .connect(process.env.DATABASE_URL)
        .then(() => {
            console.log('MongoDB Connected');
            const http = app.listen({ port: PORT });
        })
        .then((res) => {
            console.log(`Server running at http://localhost:${PORT}`);
        })
        .catch((err) => {
            console.error(err);
        });
}
