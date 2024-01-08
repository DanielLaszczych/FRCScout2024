const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');

passport.use(
    new GoogleStrategy(
        {
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: '/auth/google/callback',
            proxy: true,
        },
        async (accessToken, refreshToken, profile, done) => {
            if (!(profile._json.hd && profile._json.hd === 'robotigers1796.com')) {
                done(null, false);
                return;
            }
            const userInput = {
                googleId: profile.id,
                googleDisplayName: profile.displayName,
                firstName: profile.name.givenName,
                lastName: profile.name.familyName,
                email: profile.emails[0].value,
                displayName: profile.displayName,
                iconImage: profile.photos[0].value,
            };

            try {
                let user = await User.findOneAndUpdate({ googleId: userInput.googleId }, userInput, { new: true, upsert: true });
                done(null, user);
            } catch (err) {
                console.error(err);
                return done(null, false);
            }
        }
    )
);

passport.serializeUser((user, done) => {
    done(null, user._id);
});

passport.deserializeUser((id, done) => {
    User.findById(id, (err, user) => done(err, user));
});
