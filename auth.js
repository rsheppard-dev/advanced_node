const passport = require('passport')
const bcrypt = require('bcrypt')

module.exports = function (app, myDatabase) {
    passport.use(new LocalStrategy((username, password, done) => {
        myDatabase.findOne({ username }, (err, user) => {
            console.log(`User ${username} attempted to log in.`)
            if (err) { return done(err) }
            if (!user) { return done(null, false) }
            if (!bcrypt.compareSync(password, user.password)) { return done(null, false) }
            return done(null, user)
        })
    }))

    passport.serializeUser((user, done) => {
        done(null, user._id)
    })

    passport.deserializeUser((id, done) => {
        myDatabase.findOne({ _id: new ObjectID(id) }, (err, user) => {
            done(null, user)
        })
    })
}