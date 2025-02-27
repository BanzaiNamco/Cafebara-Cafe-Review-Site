import { Cafe } from '../model/cafeSchema.js';
import { User } from '../model/userSchema.js';
import bcrypt from 'bcrypt';
import passport from 'passport';

const loginController = {
    getLogin: function (req, res) {
        if (req.isAuthenticated()) {
            if (req.user.type === 'user')
                res.redirect('/');
            else if (req.user.type === 'cafe')
                res.redirect('/myprofile');
        } else {
            if (!req.query)
                res.render ('login', {layout: 'logregTemplate'});
            else {
                res.render ('login', {
                    layout: 'logregTemplate',
                    message: req.query.message
                });
            }
        }
    },

    loginAuth: async function(req, res, next) {
        const queryParams = new URLSearchParams();
        queryParams.append('message', 'Incorrect username or password!');
        const queryString = queryParams.toString();

        passport.authenticate('local', {
            successRedirect: '/',
            failureRedirect: `/login?${queryString}`,
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
        } else {   
            if (req.query) {
                res.render ('register', {
                    layout: 'logregTemplate',
                    message: req.query.message});
            } else {
                res.render ('register', {layout: 'logregTemplate'});
            }
        }
    },

    register_process: async function(req, res) {
        try {
            const userdata = req.body;
            if (userdata.usertype === `customer`) {
                const existingUser = await User.findOne({email: userdata.email});

                if (existingUser) {
                    const queryParams = new URLSearchParams();
                    queryParams.append('message', 'Email already exists!');
                    const queryString = queryParams.toString();
                    return res.redirect(`/register?${queryString}`);
                }
                else {
                    if (userdata.password === userdata.confirmpassword) {
                        const hashedPassword = await bcrypt.hash(req.body.password, 10);
                        const newUser = new User({
                            password: hashedPassword,
                            email: userdata.email,
                            firstname: userdata.firstname,
                            lastname: userdata.lastname
                        });
                        newUser.save();
                        res.redirect('/login');
                    } else {
                        const queryParams = new URLSearchParams();
                        queryParams.append('message', 'Passwords do not match!');
                        const queryString = queryParams.toString();
                        return res.redirect(`/register?${queryString}`);
                    }
                }
            }
            else if (userdata.usertype === `owner`) {
                const existingCafe = await Cafe.findOne({email: userdata.email});
                if (existingCafe) {
                    const queryParams = new URLSearchParams();
                    queryParams.append('message', 'Email already exists!');
                    const queryString = queryParams.toString();
                    return res.redirect(`/register?${queryString}`);
                } else {
                    if (userdata.password === userdata.confirmpassword) {
                        const hashedPassword = await bcrypt.hash(req.body.password, 10);
                        const newCafe = new Cafe({
                            name: userdata.estname,
                            address: userdata.estaddress,
                            email: userdata.email,
                            password: hashedPassword
                        });
                        newCafe.save();
                        res.redirect('/login');
                    }else{
                        const queryParams = new URLSearchParams();
                        queryParams.append('message', 'Passwords do not match!');
                        const queryString = queryParams.toString();
                        return res.redirect(`/register?${queryString}`);
                    }
                }
            }
        } catch (err) {
            console.log(err);
            return res.sendStatus(500);
        }
    }
}

export default loginController;