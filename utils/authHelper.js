import bcrypt from 'bcrypt';
import { Cafe } from '../model/cafeSchema.js';
import { User } from '../model/userSchema.js';

class AuthHelper {
    static appendQueryMessage(message) {
        const queryParams = new URLSearchParams();
        queryParams.append('message', message);
        return queryParams.toString();
    }

    static renderPageWithMessage(res, page, query, layout = 'logregTemplate') {
        res.render(page, {
            layout,
            message: query?.message || null
        });
    }

    static async hashPassword(password) {
        return await bcrypt.hash(password, 10);
    }

    static async registerUser(userdata, res) {
        const existingUser = await User.findOne({ email: userdata.email });
        if (existingUser) {
            return res.redirect(`/register?${this.appendQueryMessage('Email already exists!')}`);
        }
        if (userdata.password !== userdata.confirmpassword) {
            return res.redirect(`/register?${this.appendQueryMessage('Passwords do not match!')}`);
        }

        const hashedPassword = await this.hashPassword(userdata.password);
        const newUser = new User({
            email: userdata.email,
            password: hashedPassword,
            firstname: userdata.firstname,
            lastname: userdata.lastname
        });

        await newUser.save();
        return res.redirect('/login');
    }

    static async registerCafe(userdata, res) {
        const existingCafe = await Cafe.findOne({ email: userdata.email });
        if (existingCafe) {
            return res.redirect(`/register?${this.appendQueryMessage('Email already exists!')}`);
        }
        if (userdata.password !== userdata.confirmpassword) {
            return res.redirect(`/register?${this.appendQueryMessage('Passwords do not match!')}`);
        }

        const hashedPassword = await this.hashPassword(userdata.password);
        const newCafe = new Cafe({
            name: userdata.estname,
            address: userdata.estaddress,
            email: userdata.email,
            password: hashedPassword
        });

        await newCafe.save();
        return res.redirect('/login');
    }

    static redirectAuthenticatedUser(req, res) {
        if (req.user.type === 'user') {
            return res.redirect('/');
        } else if (req.user.type === 'cafe') {
            return res.redirect('/myprofile');
        }
    }
}

export default AuthHelper;