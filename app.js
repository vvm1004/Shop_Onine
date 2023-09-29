const path = require('path');
require('dotenv').config()


const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;


const errorController = require('./controllers/error');
const User = require('./models/user');

const app = express();
const MONGODB_URL = 'mongodb+srv://vvm1004:test123@cluster0.4a2h5sc.mongodb.net/shop?retryWrites=true&w=majority';
const store = new MongoDBStore({
  uri: MONGODB_URL,
  collection: 'sessions'
});

const csrfProtection = csrf();


app.set('view engine', 'ejs');
app.set('views', 'views');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');


app.use(bodyParser.urlencoded({ extended: false }));

app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'my secret',
  resave: false,
  saveUninitialized: false,
  store: store
}))

app.use(csrfProtection);
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());


passport.serializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, {
      id: user.id,
      username: user.username,
      picture: user.picture
    });
  });
});

passport.deserializeUser(function (user, cb) {
  process.nextTick(function () {
    return cb(null, user);
  });
});

passport.use(new GoogleStrategy({
  clientID: "270534234511-uhqj3m81aej8ehfjjemmi2bog6c0p100.apps.googleusercontent.com",
  clientSecret: "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",
  callbackURL: "http://localhost:3000/auth/google/shop_online",
  userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo",
  scope: ['profile']
},
  function (accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id}, function (err, user) {     
      return cb(err, user);
    });
  }
));

app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});



app.use((req, res, next) => {
  // throw new Error('Sync Dummy');
  if (!req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then(user => {
      if (!user) {
        return next();
      }
      req.user = user;
      next();
    })
    .catch(err => {
      next(new Error(err));
    });
});

app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));

app.get('/auth/google/shop_online',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function (req, res) {
    // Successful authentication, redirect to /.
    const userId = req.user._id;
    User.findById(userId)
      .then((user) => {
          req.session.isLoggedIn = true;
          req.session.user = user;
          res.redirect('/');
      })
      .catch(err => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });

  });

// app.get('/auth/google/shop_online',
//   passport.authenticate('google', { failureRedirect: '/login' }),
//   function (req, res) {
//     // Successful authentication, redirect to secrets.
//     res.redirect('/');
//   });
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);

app.get('/500', errorController.get500);
app.use(errorController.get404);




app.use((error, req, res, next) => {
  console.log(error)
  const isAuthenticated = req.session ? req.session.isLoggedIn : false;
  res.status(500).render('500', {
    pageTitle: 'Error!',
    path: '/500',
    isAuthenticated: isAuthenticated
  });
})

// app.use((error, req, res, next) => {
//   // res.status(error.httpStatusCode).render(...);
//   // res.redirect('/500');
//   res.status(500).render('500', {
//     pageTitle: 'Error!',
//     path: '/500',
//     isAuthenticated: req.session.isLoggedIn
//   });
// });

mongoose.connect(MONGODB_URL)
  // mongoose.connect("mongodb://127.0.0.1:27017/shop")
  .then(result => {
    app.listen(process.env.PORT || 3000)
  })
  .catch(err => {
    console.log(err)
  });