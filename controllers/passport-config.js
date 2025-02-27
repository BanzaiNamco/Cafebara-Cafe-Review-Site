import { Strategy as LocalStrategy } from 'passport-local';
import { User } from '../model/userSchema.js';
import { Cafe } from '../model/cafeSchema.js';
import bcrypt from 'bcrypt';

async function initPassport(passport) {
    const authenticateUser = async (email, password, done) => {
        const user = await User.findOne({email: email})
        const cafe = await Cafe.findOne({email: email})
        if (user == null && cafe == null) {
            console.log("no email")
            return done(null, false, {message: 'No user with that email'})
        }
        
        try {
            if (user != null) {
                if (await bcrypt.compare(password, user.password)){
                        console.log("user")
                        return done(null, {user, 'type': 'user'})
                    } else {
                        console.log("user wrong password")
                        return done(null, false, {message: 'Password incorrect'})
                    }
            } else if (cafe != null){
                if (await bcrypt.compare(password, cafe.password)){
                    console.log("cafe")
                    return done(null, {cafe, 'type': 'cafe'})
                } else {
                    console.log("wrong password")
                    return done(null, false, {message: 'Password incorrect'})
                }
            }
        } catch (e){
            return done(e)
        }
    }
    
    passport.use(new LocalStrategy({usernameField: 'email'}, authenticateUser))
    passport.serializeUser(({user, cafe, type}, done) => {
        if (user != null)
            done(null, {id: user._id, type})
        else if (cafe != null)
            done(null, {id: cafe._id, type})
    })

    await passport.deserializeUser(async ({id, type}, done) => {
        if (type == 'user')
            return done(null, {'user': await getUserById(id), type})
        else if (type == 'cafe')
            return done(null, { 'user' : await getCafeById(id), type})
    })
}

async function getUserById(id){
    const user =  await User.findOne({_id: id})
    return user
}

async function getCafeById(id){
    const cafe = await Cafe.findOne({_id: id})
    return cafe
}

export default initPassport;