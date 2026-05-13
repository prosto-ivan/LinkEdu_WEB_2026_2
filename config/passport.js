const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const User = require('../models/User');

passport.use(new GoogleStrategy(
    {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL
    },
    async (accessToken, refreshToken, profile, done) => {
        try {
            const googleId = profile.id;
            const email = profile.emails?.[0]?.value;
            const username = profile.displayName || email;

            if (!email) {
                return done(null, false, { message: 'Google не повернув email' });
            }

            let user = await User.findOne({
                where: { google_id: googleId }
            });

            if (user) {
                return done(null, user);
            }

            user = await User.findOne({
                where: { email }
            });

            if (user) {
                user.google_id = googleId;
                user.is_email_confirmed = true;
                await user.save();

                return done(null, user);
            }

            const randomPassword = crypto.randomBytes(32).toString('hex');
            const hashedPassword = await bcrypt.hash(randomPassword, 10);

            user = await User.create({
                username,
                email,
                password_hash: hashedPassword,
                role_id: 2,
                google_id: googleId,
                is_email_confirmed: true,
                email_verification_token: null
            });

            return done(null, user);
        } catch (error) {
            return done(error, null);
        }
    }
));

module.exports = passport;