import { About } from '../model/aboutSchema.js';
import { User } from '../model/userSchema.js';
import fs from 'fs';
import bcrypt from 'bcrypt';
import ProfileHelper from '../utils/profileHelper.js';

const profileController = {
    getAbout: async function (req, res) {
        try {
            const profilecards = [];
            const result = await About.find();

            fs.readFile('package.json', 'utf8', (err, data) => {
                if (err) {
                    console.error('Error reading file:', err);
                    return res.status(500).json({ error: 'Failed to read data.' });
                }

                let jsonData = JSON.parse(data).dependencies;

                for (let key in jsonData) jsonData[key] = `(${jsonData[key].substring(1)})`;
                console.log(jsonData);

                for (let i = 0; i < result.length; i++) {
                    profilecards.push({
                        name: result[i].name,
                        position: result[i].position,
                        bio: result[i].bio,
                        image: result[i].image
                    });
                };

                res.render('about', {
                    isAbout: true,
                    profilecards: profilecards,
                    session: req.isAuthenticated(),
                    dependencies: jsonData
                });
            });
        } catch (e) {
            console.log(e)
            res.sendStatus(400)
        }
    },

    profile: async function (req, res) {
        if (!req.isAuthenticated()) return res.redirect('/');
            
        if (req.user.type == 'user') {
            const userDetails = await ProfileHelper.getUserDetails(req.user.user._id);
            const { reviewList, stats } = await ProfileHelper.getReviews(req.user.user._id);

            const userdetails = {
                imgsrc: userDetails.profilepic,
                username: userDetails.firstname + " " + userDetails.lastname,
                memberyear: userDetails.dateCreated.toString().substring(11, 15),
                bio: userDetails.bio,
                ...stats
            }

            res.render('userProfile', {
                layout: 'profileTemplate',
                userProfile: userdetails,
                reviews: reviewList,
                session: req.isAuthenticated(),
                isProfile: true
            });
        } else if (req.user.type == 'cafe') {
            const cafeDetails = await ProfileHelper.getCafeDetails(req.user.user._id);
            const { reviewList, avgRating } = await ProfileHelper.getReviews(req.user.user._id, true);

            return res.render('cafeProfile', {
                layout: 'ownerTemplate',
                ownerprofile: {
                    cafeimg: cafeDetails.image,
                    cafeName: cafeDetails.name,
                    description: cafeDetails.description,
                    numreviews: reviewList.length,
                    rating: avgRating
                },
                reviews: reviewList,
                session: req.isAuthenticated(),
                owner: true
            });
        }
    },

    updateProfile: async function (req, res) {
        if (!req.isAuthenticated()) return res.redirect('/');

        const user = await ProfileHelper.getUserDetails(req.user.user._id);
        const updatedDetails = req.body;
        const imgPath = req.file ? `./uploads/${req.file.filename}` : user.profilepic;

        await User.updateOne({ _id: req.user.user._id }, {
            $set: {
                profilepic: imgPath,
                firstname: updatedDetails.firstname,
                lastname: updatedDetails.lastname,
                email: updatedDetails.email,
                password: await bcrypt.hash(updatedDetails.password, 10),
                birthday: new Date(updatedDetails.year, updatedDetails.month, updatedDetails.day),
                bio: updatedDetails.bio,
            }
        });
        res.redirect('/myprofile');
    },

    settings: async function (req, res) {
        if (!req.isAuthenticated()) return res.redirect('/');

        const userDetails = await ProfileHelper.getUserDetails(req.user.user._id);
        const birthDate = await ProfileHelper.parseBirthday(userDetails.birthday);

        res.render('settings', {
            layout: 'profileTemplate',
            session: req.isAuthenticated(),
            userProfile: {
                profilepic: userDetails.profilepic,
                email: userDetails.email,
                imgsrc: userDetails.profilepic,
                firstname: userDetails.firstname,
                lastname: userDetails.lastname,
                memberyear: userDetails.dateCreated.toString().substring(11, 15),
                bio: userDetails.bio,
                ...birthDate,
            }
        });
    },

    userProfile: async function (req, res) {
        try {
            const [firstName, lastName] = req.params.username.split("%20")[0].split(" ");
            const userDetails = await User.findOne({ firstname: firstName, lastname: lastName });
            if (!userDetails) return res.sendStatus(404);
            
            const { reviewList, stats } = await ProfileHelper.getReviews(userDetails._id);

            const userdetails = {
                imgsrc: userDetails.profilepic,
                username: `${userDetails.firstname} ${userDetails.lastname}`,
                memberyear: userDetails.dateCreated.toString().substring(11, 15),
                bio: userDetails.bio,
                ...stats
            };

            res.render('userProfile', {
                layout: 'profileTemplate',
                userProfile: userdetails,
                reviews: reviewList,
                session: req.isAuthenticated()
            });
        } catch (err) {
            res.sendStatus(400)
        }
    }
}

export default profileController;