const express = require('express');
const app = express();
const parser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const csurf = require('csurf')
const routes = require('./src/routes/routes');

const morgan = require('morgan');
const logger = require('./src/config/logger');

const isTesting = process.env.NODE_ENV === 'test';

require('dotenv').config();

if (!isTesting) {
    mongoose.connect(process.env.MONGO_URI, {
        useCreateIndex: true,
        useNewUrlParser: true,
        useUnifiedTopology: true,
        useFindAndModify: false
    }, function (err) {
        if (err) throw err;
        console.log("Connected to the mongo database");
        const port = 3001;
        app.listen(port, function () {
            console.log('Listening on port ' + port);
        });
    });
    app.use(morgan('":method :url" :status (len: :res[content-length] - :response-time ms) ":user-agent"',
        { stream: logger.stream }));
}
// If this app is sitting behind a reverse proxy (e.g nginx)
// app.enable('trust proxy')
app.use(cookieParser());

const limit = '5mb';
app.use(parser.urlencoded({
    limit: limit,
    extended: false
}));
app.use(parser.json({
    limit: limit,
}));

app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true
}));
require('./src/config/passport');
app.use(require('./src/config/sessionConfig'));
app.use(passport.initialize());
app.use(passport.session());
if (!isTesting) {
    app.use(csurf());
    app.use(function (err, req, res, next) {
        if (req.csrfToken) {
            res.cookie('XSRF-TOKEN', req.csrfToken());
        }
        if (req.url === '/user/login' || req.url === '/user/register') {
            return next();
        }
        return next(err)
    });
}
app.use(routes);
app.use(require('./src/middlewares/errorHandler'));

module.exports = app;