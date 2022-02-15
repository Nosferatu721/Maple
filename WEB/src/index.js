const express = require('express');
const morgan = require('morgan');
const exphbs = require('express-handlebars');
const path = require('path');
const flash = require('connect-flash');
const session = require('express-session');
const MySqlStore = require('express-mysql-session');
const passport = require('passport');
const { database } = require('./keys');
const { isLoggedIn, error404 } = require('./lib/auth');
const fileUpload = require('express-fileupload');
// const cors = require('cors')
// require("dotenv").config();

// * Init
const app = express();
require('./lib/passport');
// require("./lib/helpers");

// * Public
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, '../node_modules/chart.js/dist')));
app.use(express.static(path.join(__dirname, '../node_modules/sweetalert2/dist')));
app.use(express.static(path.join(__dirname, '../node_modules/datatables.net/js')));
app.use(express.static(path.join(__dirname, '../node_modules/datatables.net-bs4')));

// * Settings
app.set('PORT', process.env.PORT || 8083);
app.set('views', path.join(__dirname, 'views'));
app.engine(
  '.hbs',
  exphbs({
    defaultLayout: 'main',
    layoutsDir: path.join(app.get('views'), 'layouts'),
    partialsDir: path.join(app.get('views'), 'partials'),
    extname: '.hbs',
    helpers: require('./lib/handlebars'),
  })
);
app.set('view engine', '.hbs');

// * Middleware
app.use(
  session({
    secret: 'appmysql',
    resave: false,
    saveUninitialized: false,
    store: new MySqlStore(database),
  })
);
// app.use(cors())
app.use(flash());
app.use(morgan('dev'));
app.use(fileUpload());
app.use(express.urlencoded({ extended: false })); // Aceptar datos sencillos
app.use(express.json());
app.use(passport.initialize());
app.use(passport.session());

// * Global Variables
app.use((req, res, next) => {
  app.locals.messageSuccess = req.flash('messageSuccess');
  app.locals.messageInfo = req.flash('messageInfo');
  app.locals.messageWarning = req.flash('messageWarning');
  app.locals.messageError = req.flash('messageError');
  app.locals.user = req.user;
  // console.log(req.user)
  next();
});

// * Routes
app.use(require('./routes/authentication'));
app.use(require('./routes'));
app.use(isLoggedIn); // No entrar a las rutas sin logearse, redirecciona al Login
app.use('/GECA', require('./routes/GECA'));
app.use('/GECARep', require('./routes/GECARep'));
app.use('/samaritanaRepExport', require('./routes/samaritanaRepExport'));

app.use(require('./routes/user'));

// * Starting Server
app.listen(app.get('PORT'), () => {
  console.log(`Server on port ${app.get('PORT')}`);
});

// let qr_img_buffer = qr.image("1@NrRytBVKp6vBk1ReBNcF53+W28QUhyOyDz=,7AcnZHfzVEGB64JMmYzkuQ==", { type: "svg" });
// console.log(qr_img_buffer);
// qr_img_buffer.pipe(require("fs").createWriteStream("src/public/img/xd.svg"));

// * 404
app.use(error404);
