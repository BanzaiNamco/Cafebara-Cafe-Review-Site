import express from "express";
import exphbs from "express-handlebars";
import db from './model/db.js';
import bodyParser from 'body-parser';
import Handlebars from 'handlebars';
import path from 'path';
import bcrypt from 'bcrypt';
import passport from 'passport';
import flash from 'express-flash';
import session from 'express-session';
import cookieParser from 'cookie-parser';
import initPassport from './controllers/passport-config.js';
import loginRouter from "./routes/loginRouter.js";
import profileRouter from "./routes/profileRouter.js";
import reviewRouter from "./routes/reviewRouter.js";
import cafeRouter from "./routes/cafeRouter.js";


const port = process.env.PORT;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


import {fileURLToPath} from 'url';
import {dirname, join} from 'path';

const app = express();

await initPassport(passport);

app.engine("hbs", exphbs.engine({extname: 'hbs', defaultLayout: 'main'}));
app.set("view engine", "hbs");
app.use('/partials', express.static(path.join(__dirname, 'views/partials')));
app.set("views", "./views");

app.use ( express.static(`public`) );
app.use ( '/uploads', express.static(path.join(dirname(fileURLToPath(import.meta.url)), 'uploads')));
app.use ( express.urlencoded({ extended: true }));
app.use ( bodyParser.urlencoded({ extended: true }));
app.use ( bodyParser.json() );
app.use ( express.json() );
app.use ( flash() );
app.use ( session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 3 * 24 * 60 * 60 * 1000 }
}));

app.use ( passport.initialize() );
app.use ( passport.session() );
app.use ( cookieParser() );
app.use('/', loginRouter);
app.use('/', profileRouter);
app.use('/', reviewRouter);
app.use('/', cafeRouter);

db.connect();

app.listen(port, function () {
    console.log(`Server is running at:`);
    console.log(`http://localhost:` + port);
});

Handlebars.registerHelper("equals", function(a , b, options) {
    if (a === b) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});

Handlebars.registerHelper("grequal", function(a , b, options) {
    if (a >= b) {
        return options.fn(this);
    } else {
        return options.inverse(this);
    }
});

Handlebars.registerHelper('truncateText', function (text, maxLength) {
    if (text.length <= maxLength) {
        return new Handlebars.SafeString(text);
    } else {
        const truncatedText = text.substring(0, maxLength) + '...';
        return new Handlebars.SafeString(
            `<span class="truncated-text">${truncatedText}</span><button class="read-more-btn" data-fulltext="${text}">Read More</button>`
        );
    }
});

Handlebars.registerHelper('json', function(context) {
    return JSON.stringify(context);
});