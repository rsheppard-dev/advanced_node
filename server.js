'use strict';
require('dotenv').config({ path: './config/.env' })
const express = require('express');
const myDB = require('./connection');
const fccTesting = require('./freeCodeCamp/fcctesting.js');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local')
const ObjectID = require('mongodb').ObjectID

const app = express();
app.set('view engine', 'pug');

fccTesting(app); // For fCC testing purposes
app.use('/public', express.static(process.cwd() + '/public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: true,
  saveUninitialized: true,
  cookie: { secure: false }
}));
app.use(passport.initialize());
app.use(passport.session());

myDB(async client => {
  const myDatabase = await client.db('database').collection('users')

  passport.use(new LocalStrategy((username, password, done) => {
    myDatabase.findOne({ username }, (err, user) => {
      console.log(`User ${username} attempted to log in.`)
      if (err) { return done(err) }
      if (!user) { return done(null, false) }
      if (password !== user.password) { return done(null, false) }
      return done(null, user)
    })
  }))

  const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next()
    }
    res.redirect('/')
  }

  app.route('/')
    .get((req, res) => {
      res.render('pug', {
        title: 'Home Page',
        message: 'Please login',
        showLogin: true,
        showRegistration: true
      })
    })

  app.route('/register')
    .post((req, res, next) => {
      const { username, password } = req.body
      myDatabase.findOne({ username }, (error, user) => {
        if (error) {
          next(error)
        } else if (user) {
          res.redirect('/')
        } else {
          myDatabase.insertOne({
            username,
            password
          }, (error, doc) => {
            if (error) {
              res.redirect('/')
            } else {
              next(null, doc.ops[0])
            }
          })
        }
      })
    }, passport.authenticate('local', { failureRedirect: '/' }), (req, res, next) => {
      res.redirect('/profile')
    })

  app.route('/login')
    .post(passport.authenticate('local', {
      failureRedirect: '/'
    }), (req, res) => {
      res.redirect('/profile')
    })

  app.route('/profile').get(ensureAuthenticated, (req, res) => {
    res.render(process.cwd() + '/views/pug/profile', {
      title: 'Profile Home',
      username: req.user.username
    })
  })

  app.route('/logout')
    .get((req, res) => {
      req.logout()
      res.redirect('/')
    })

  app.use((req, res, next) => {
    res.status(404)
      .type('text')
      .send('Not Found')
  })

  passport.serializeUser((user, done) => {
    done(null, user._id)
  })

  passport.deserializeUser((id, done) => {
    myDatabase.findOne({ _id: new ObjectID(id) }, (err, user) => {
      done(null, user)
    })
  })

}).catch(e => {
  app.route('/').get((req, res) => {
    res.render('pug', {
      title: e,
      message: 'Unable to login'
    })
  })
})

app.listen(process.env.PORT || 3000, () => {
  console.log('Listening on port ' + process.env.PORT);
});