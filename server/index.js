const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo');
const path = require('path');
const bcrypt = require('bcrypt');
const cloudinary = require('cloudinary').v2;
const socketIo = require('socket.io');
require('dotenv').config();
require('./auth/passport');

const typeDefs = require('./graphql/typeDefs');
const resolvers = require('./graphql/resolvers');
const PickList = require('./util/pickList');
const { getHomePageData, getRTESSIssuesPageData } = require('./util/helperFunctions');

const server = new ApolloServer({
    typeDefs: typeDefs,
    resolvers: resolvers,
    context: ({ req, res }) => ({ req, res })
});

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

function requireHTTPS(req, res, next) {
    // The 'x-forwarded-proto' check is for Heroku
    if (!req.secure && req.get('x-forwarded-proto') !== 'https' && process.env.NODE_ENV !== 'development') {
        return res.redirect('https://' + req.get('host') + req.url);
    }
    next();
}

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
app.use('/auth', require('./routes/auth'));
app.use('/blueAlliance', require('./routes/blueAlliance').router);
app.use('/matchData', require('./routes/matchData'));
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
app.use('/pickList', require('./routes/pickList'));
app.use('/getuser', (req, res) => {
    res.send(req.user);
});
app.use('/groupMeBot', require('./routes/groupMeBot').router);

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});

startServer();

async function startServer() {
    // since the express server has cors configured, cors on the apollo server
    // can be false; passing the same options as defined on the express instance
    // works as well
    await server.start();
    server.applyMiddleware({ app, path: '/graphql', cors: true });

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
        .connect(process.env.DATABASE_URL, {
            useNewUrlParser: true
        })
        .then(() => {
            console.log('MongoDB Connected');
            const http = app.listen({ port: PORT });

            const io = socketIo(http, {
                cors: {
                    origin: process.env.CLIENT_URL
                }
            }); //in case server and client run on different urls
            app.set('socketio', io);

            let homePageInterval = null;
            let rtessIssuesInterval = null;
            io.on('connection', (socket) => {
                console.log(`A user connected: ${socket.id}`);
                if (io.engine.clientsCount >= 1) {
                    if (!homePageInterval) {
                        homePageInterval = setInterval(async () => {
                            let data = await getHomePageData();
                            if (data) {
                                io.sockets.emit('homePageUpdate', data);
                            }
                        }, 30 * 1000);
                    }

                    if (!rtessIssuesInterval) {
                        rtessIssuesInterval = setInterval(async () => {
                            let data = await getRTESSIssuesPageData();
                            if (data) {
                                io.sockets.emit('rtessIssuesPageUpdate', data);
                            }
                        }, 30 * 1000);
                    }
                }

                //Whenever someone disconnects this piece of code executed
                socket.on('disconnect', () => {
                    if (io.engine.clientsCount === 0) {
                        homePageInterval = clearInterval(homePageInterval);
                        rtessIssuesInterval = clearInterval(rtessIssuesInterval);
                    }
                });
            });

            PickList.initialize();
        })
        .then((res) => {
            console.log(`Server running at http://localhost:${PORT}`);
        })
        .catch((err) => {
            console.error(err);
        });
}
