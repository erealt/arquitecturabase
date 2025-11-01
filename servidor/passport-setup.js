const passport=require("passport"); 
const GoogleStrategy = require('passport-google-oauth20').Strategy; 
const GoogleOneTapStrategy = require("passport-google-one-tap").GoogleOneTapStrategy;

passport.serializeUser(function(user, done) { done(null, user); }); 
passport.deserializeUser(function(user, done) { done(null, user); }); 
passport.use(new GoogleStrategy({ clientID: process.env.GOOGLE_CLIENT_ID,
     clientSecret: process.env.GOOGLE_CLIENT_SECRET, callbackURL: "http://localhost:3000/google/callback" },
     function(accessToken, refreshToken, profile, done) { return done(null, profile); } ));

     passport.use( 
          new GoogleOneTapStrategy(
                { 
                    //client_id:"xxxxxxx.apps.googleusercontent.com", //local 
                    client_id:process.env.GOOGLE_CLIENT_ID, //prod-oneTap
                    //clientSecret: "xxxx", //local 
                    clientSecret:process.env.GOOGLE_CLIENT_SECRET, // prod-oneTap
                    verifyCsrfToken: false, // whether to validate the csrf token or not 
                     }, 
                     function (profile, done) {
                          return done(null, profile); 
                         } ) );