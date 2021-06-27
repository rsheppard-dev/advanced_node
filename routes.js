const passport = require('passport')
const bcrypt = require('bcrypt')

module.exports = function (app, myDataBase) {
    const ensureAuthenticated = (req, res, next) => {
        if (req.isAuthenticated()) {
            return next()
        }
        res.redirect('/')
    }

    app.route('/')
        .get((req, res) => {
            res.render('pug', {
                title: 'Home Profile',
                message: 'Please login',
                showLogin: true,
                showRegistration: true,
                showSocialAuth: true
            })
        })

    app.route('/register')
        .post((req, res, next) => {
            const hash = bcrypt.hashSync(req.body.password, 12)
            myDatabase.findOne({ username: req.body.username }, (error, user) => {
                if (error) {
                    next(error)
                } else if (user) {
                    res.redirect('/')
                } else {
                    myDatabase.insertOne({
                        username: req.body.username,
                        password: hash
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

    app.route('/auth/github')
        .get(passport.authenticate('github'))

    app.route('/auth/github/callback')
        .get(passport.authenticate('github', { failureRedirect: '/' }), (req, res) => {
            req.session.user_id = req.user.id
            res.redirect('/chat')
        })

    app.route('/profile').get(ensureAuthenticated, (req, res) => {
        res.render(process.cwd() + '/views/pug/profile', {
            title: 'Profile Home',
            username: req.user.username
        })
    })

    app.route('/chat')
        .get(ensureAuthenticated, (req, res) => {
            res.render(process.cwd() + '/views/pug/chat', {
                user: req.user
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
}