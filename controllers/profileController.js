import { About } from '../model/aboutSchema.js';
import { Cafe } from '../model/cafeSchema.js';
import { Review } from '../model/reviewsSchema.js';
import { User } from '../model/userSchema.js';
import { Reply } from '../model/ownerReply.js';
import bcrypt from 'bcrypt';
import fs from 'fs';

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
        if (req.isAuthenticated()) {
            if (req.user.type == 'user') {
                const userDetails = await User.findOne({ _id: req.user.user._id });
                const reviews = await Review.find({ reviewer: req.user.user._id });
                const reviewList = [];
                let five = 0;
                let four = 0;
                let three = 0;
                let two = 0;
                let one = 0;
                for (let i = 0; i < reviews.length; i++) {
                    const cafe = await Cafe.findOne({ _id: reviews[i].cafeName });
                    reviewList.push({
                        cafe: cafe.name,
                        title: reviews[i].review_title,
                        rating: reviews[i].rating,
                        reviewtext: reviews[i].review,
                        cafeimg: cafe.image,
                    })
                    switch (reviewList[i].rating) {
                        case 5:
                            five++; break;
                        case 4:
                            four++; break;
                        case 3:
                            three++; break;
                        case 2:
                            two++; break;
                        case 1:
                            one++; break;
                    }
                }

                const userdetails = {
                    imgsrc: userDetails.profilepic,
                    username: userDetails.firstname + " " + userDetails.lastname,
                    memberyear: userDetails.dateCreated.toString().substring(11, 15),
                    bio: userDetails.bio,
                    go: five,
                    shi: four,
                    san: three,
                    ni: two,
                    ichi: one,
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
                const reviews = await Review.find({ cafeName: req.user.user._id });
                const reviewList = [];
                let average = 0;

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
                    average += reviews[i].rating;
                }
                average /= reviews.length;

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
                    owner: true
                });
            }
        } else {
            res.redirect('/');
        }
    },

    updateProfile: async function (req, res) {
        if (req.isAuthenticated()) {
            const user = await User.findOne({ _id: req.user.user._id });
            const updatedDetails = req.body;

            let img_path = req.file;
            console.log(img_path);
            if (img_path === undefined) {
                img_path = user.profilepic;
            } else {
                img_path = "./uploads/" + req.file.filename;
            }

            const userDetails = await User.updateOne({ _id: req.user.user._id }, {
                $set: {
                    profilepic: img_path,
                    firstname: updatedDetails.firstname,
                    lastname: updatedDetails.lastname,
                    email: updatedDetails.email,
                    password: await bcrypt.hash(updatedDetails.password, 10),
                    birthday: new Date(updatedDetails.year, updatedDetails.month, updatedDetails.day),
                    bio: updatedDetails.bio,
                }
            });
            res.redirect('/myprofile');
        }
        else {
            res.redirect('/');
        }
    },

    settings: async function (req, res) {
        if (req.isAuthenticated()) {
            const userDetails = await User.findOne({ _id: req.user.user._id });
            let day = '';
            let month = '';
            let year = '';
            if (userDetails.birthday === undefined) {
                day = '';
                month = '';
                year = '';
            } else {
                day = userDetails.birthday.getDate();
                month = userDetails.birthday.getMonth();
                year = userDetails.birthday.getFullYear();
            }

            const userdetails = {
                profilepic: userDetails.profilepic,
                email: userDetails.email,
                imgsrc: userDetails.profilepic,
                firstname: userDetails.firstname,
                lastname: userDetails.lastname,
                memberyear: userDetails.dateCreated.toString().substring(11, 15),
                bio: userDetails.bio,
                day: day,
                month: month,
                year: year,
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
            const username = req.params.username;
            const split = username.split("%20")[0].split(" ");

            const userDetails = await User.findOne({ firstname: split[0], lastname: split[1] });
            const reviews = await Review.find({ reviewer: userDetails._id });
            const reviewList = [];
            let five = 0;
            let four = 0;
            let three = 0;
            let two = 0;
            let one = 0;
            for (let i = 0; i < reviews.length; i++) {
                const cafe = await Cafe.findOne({ _id: reviews[i].cafeName });
                reviewList.push({
                    cafe: cafe.name,
                    title: reviews[i].review_title,
                    rating: reviews[i].rating,
                    reviewtext: reviews[i].review,
                    cafeimg: cafe.image,
                })
                switch (reviewList[i].rating) {
                    case 5:
                        five++; break;
                    case 4:
                        four++; break;
                    case 3:
                        three++; break;
                    case 2:
                        two++; break;
                    case 1:
                        one++; break;
                }
            }

            const userdetails = {
                imgsrc: userDetails.profilepic,
                username: userDetails.firstname + " " + userDetails.lastname,
                memberyear: userDetails.dateCreated.toString().substring(11, 15),
                bio: userDetails.bio,
                go: five,
                shi: four,
                san: three,
                ni: two,
                ichi: one,
            }

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