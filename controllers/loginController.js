import passport from 'passport';
import AuthHelper from '../utils/authHelper.js';

const loginController = {
    getLogin: function (req, res) {
        if (req.isAuthenticated()) {
            return AuthHelper.redirectAuthenticatedUser(req, res);
        } 
        return  AuthHelper.renderPageWithMessage(res, 'login', req.query);
    },

    loginAuth: async function(req, res, next) {
        passport.authenticate('local', {
            successRedirect: '/',
            failureRedirect: `/login?${AuthHelper.appendQueryMessage('Incorrect username or password!')}`,
            failureFlash: true
        })(req, res, next);
    },

    logout: function (req, res) {
        req.logout(function(err) {
            if (err) { return next(err); }
            res.redirect('/');
        });
    },

    getRegister: async function (req, res) {
        if (req.isAuthenticated()) {
            res.redirect('/');
        } 
        AuthHelper.renderPageWithMessage(res, 'register', req.query);        
    },

    register_process: async function(req, res) {
        try {
            const userdata = req.body;
            if (userdata.usertype === 'customer') {
                return await AuthHelper.registerUser(userdata, res);
            } else if (userdata.usertype === 'owner') {
                return await AuthHelper.registerCafe(userdata, res);
            }
        } catch (err) {
            console.log(err);
            return res.sendStatus(500);
        }
    }
}

export default loginController;