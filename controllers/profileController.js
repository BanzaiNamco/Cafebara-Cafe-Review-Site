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
                const cafe = await Cafe.findOne({ _id: req.user.user._id });
                const reviews = await Review.find({ cafeName: req.user.user._id })
                    .sort({ _id: -1 })
                    .limit(3);
                const reviewCount = await Review.find({ cafeName: req.user.user._id }).countDocuments();

                const reviewList = [];
                let average = cafe.rating;

                for (let i = 0; i < reviews.length; i++) {
                    const user = await User.findOne({ _id: reviews[i].reviewer });
                    const reply = await Reply.findOne({ _id: reviews[i].ownerReply });
                    reviewList.push({
                        reviewtext: reviews[i].review,
                        title: reviews[i].review_title,
                        media: reviews[i].mediaPath,
                        username: user.firstname + " " + user.lastname,
                        reviewdate: reviews[i].dateCreated.toString().substring(0, 15),
                        rating: reviews[i].rating,
                        memberyear: user.dateCreated.toString().substring(11, 15),
                        userimg: user.profilepic,
                        reviewId: reviews[i]._id,
                    })

                    if (reply != null) {
                        reviewList[i].reply = reply.reply_text;
                        reviewList[i].reply_date = reply.date.toString().substring(0, 15);
                    }
                }

                const cafedetails = {
                    cafeimg: cafe.image,
                    cafeName: cafe.name,
                    description: cafe.description,
                    numreviews: reviews.length,
                    rating: average
                }
                res.render('cafeProfile', {
                    layout: 'ownerTemplate',
                    ownerprofile: cafedetails,
                    reviews: reviewList,
                    session: req.isAuthenticated(),
                    owner: true,
                    reviewCount
                });
            }
        } else {
            res.redirect('/');
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

            res.render('settings', {
                layout: 'profileTemplate',
                session: req.isAuthenticated(),
                userProfile: userdetails,
            });
        } else {
            res.redirect('/');
        }
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
    },

    getProfileReview: async function (req, res) {
        const cafeName = req.body.cafeName;
        const i = req.body.reviewCount;
        const cafe = await Cafe.findOne({ name: cafeName });
        const reviews = await Review.findOne({ cafeName: cafe._id })
            .sort({ _id: 1 })
            .skip(i);
        if (reviews == null) {
            res.json({ reviews: [] });
            return
        }
        const user = await User.findOne({ _id: reviews.reviewer });
        const reply = await Reply.findOne({ _id: reviews.ownerReply });
        let review = {
            reviewtext: reviews.review,
            title: reviews.review_title,
            media: reviews.mediaPath,
            username: user.firstname + " " + user.lastname,
            reviewdate: reviews.dateCreated.toString().substring(0, 15),
            rating: reviews.rating,
            memberyear: user.dateCreated.toString().substring(11, 15),
            userimg: user.profilepic,
            reviewId: reviews._id,
        }
        if (reply != null) {
            review.reply = reply.reply_text;
            review.reply_date = reply.date.toString().substring(0, 15);
        }
        res.json({ reviews: [review] });
    }
}

export default profileController;