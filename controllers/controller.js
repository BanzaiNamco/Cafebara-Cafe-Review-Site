import db from '../model/db.js';
import { About } from '../model/aboutSchema.js';
import { Cafe } from '../model/cafeSchema.js';
import { Review } from '../model/reviewsSchema.js';
import { User } from '../model/userSchema.js';
import { Reply } from '../model/ownerReply.js';
import fs from 'fs';
import bcrypt from 'bcrypt';

import multer from 'multer';
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});
const upload = multer({ storage: storage });

const controller = {

    getIndex: async function (req, res) {
        try {
            if (req.isAuthenticated()) {
                if (req.user.type == 'cafe') {
                    res.redirect('/myprofile');
                    return
                }
            }
            const cafeCarouselCards = [];
            const resp = await Cafe.find().sort({ dateCreated: -1 }).limit(5)
            for (let i = 0; i < resp.length; i++) {
                cafeCarouselCards.push({
                    cafeName: resp[i].name,
                    cafePath: resp[i].image,
                    avgPrice: resp[i].price
                });
            };
            res.render('index', {
                isIndex: true,
                carouselCards: cafeCarouselCards,
                session: req.isAuthenticated()
            });
        } catch {
            res.sendStatus(400);
        }
    },

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

                // clean up the version number
                for (let key in jsonData) jsonData[key] = `(${jsonData[key].substring(1)})`;
                console.log(jsonData);


                for (let i = 0; i < result.length; i++) {
                    profilecards.push({
                        name: result[i].name,
                        position: result[i].position,
                        bio: result[i].bio,
                        // fb: result[i].fb,
                        // twitter: result[i].twitter,
                        // insta: result[i].insta,
                        // git: result[i].git,
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

    getCafes: async function (req, res) {
        try {
            const cafes = [];
            const resp = await Cafe.find()
            for (let i = 0; i < resp.length; i++) {
                const result = await Review.find({ cafeName: resp[i]._id });
                cafes.push({
                    cafeName: resp[i].name,
                    numOfReviews: result.length,
                    cafeShortInfo: resp[i].description,
                    open_details: resp[i].weekdays_avail,
                    cafeImg: resp[i].image,
                    price: resp[i].price,
                    rating: resp[i].rating,
                    media: resp[i].mediPath,
                });
            };

            res.render('cafes', {
                cafeCards: cafes,
                session: req.isAuthenticated(),
                isCafe: true
            });
        } catch {
            res.sendStatus(400)
        }
    },
    cafe: async function (req, res) {
        try {
            const cafeName = req.params.cafeName;
            const cafe = await Cafe.findOne({ name: cafeName });
            const session = req.isAuthenticated();
            const reviews = await Review.find({ cafeName: cafe._id });

            let writebuttondisable = false;
            let userRating = 0;
            let userReview;
            let userReviewTitle;
            let userReviewId;
            let userReviewMedia;
            const cafeView = {
                cafeName: cafe.name,
                imgPath: cafe.image,
                description: cafe.description,
                weekday_avail: cafe.weekdays_avail,
                weekend_avail: cafe.weekends_avail,
                website: cafe.website,
                phonenumber: cafe.phone,
                price: cafe.price,
                numReviews: reviews.length,
                menu: cafe.menu,
                address: cafe.address,
                cafe_id: cafe._id,
                rating: cafe.rating
            };

            res.render("viewCafe", {
                layout: 'cafeTemplate',
                cafePage: cafeView,
                session: session,
                writeReview: writebuttondisable,
                rating: userRating,
                review_text: userReview,
                review_title: userReviewTitle,
                reviewId: userReviewId,
                review_media: userReviewMedia
            });
        } catch (err) {
            console.log(err)
            res.sendStatus(400)
        }

    },

    getCafeReview: async function (req, res) {
        const cafeName = req.body.cafeName;
        const i = req.body.reviewCount;

        const cafe = await Cafe.findOne({ name: cafeName });
        const reviews = await Review.findOne({ cafeName: cafe._id })
            .sort({ rating: -1, _id: 1 })
            .skip(i);
        if (reviews == null) {
            res.json({ reviews: [] });
            return
        }
        const session = req.isAuthenticated();
        const reviewList = [];
        const reply = await Reply.findOne({ _id: reviews.ownerReply });
        const reviewer = await User.findOne({ _id: reviews.reviewer });
        let author = false;
        let upvoted = false;
        let downvoted = false;
        if (session) {
            author = (reviewer.email == req.user.user.email) ? true : false;

            if (author) {
                writebuttondisable = true;
                userRating = reviews.rating;
                userReview = reviews.review;
                userReviewTitle = reviews.review_title;
                userReviewId = reviews._id;
                userReviewMedia = reviews.mediaPath;
            }

            if (req.user.user.upvotes.includes(reviews._id)) {
                upvoted = true;
            }
            else if (req.user.user.downvotes.includes(reviews._id)) {
                downvoted = true;
            }
        }

        let review = {
            review: reviews.review,
            reviewdate: reviews.dateCreated.toString().substring(0, 15),
            rating: reviews.rating,
            username: reviewer.firstname + " " + reviewer.lastname,
            dateModified: reviews.dateModified,
            up: reviews.upvotes,
            down: reviews.downvotes,
            media: reviews.mediaPath,
            profilepic: reviewer.profilepic,
            title: reviews.review_title,
            author: author,
            date: reviewer.dateCreated.toString().substring(11, 15),
            reviewId: reviews._id,
            upvoted: upvoted,
            downvoted: downvoted,
            session: session
        };
        if (reviews.dateModified != null)
            review.editdate = reviews.dateModified.toString().substring(0, 15);
        if (reply != null) {
            review.ownerreplydate = reply.date.toString().substring(0, 15);
            review.ownerreply = reply.reply_text;
        }
        reviewList.push(review);
        res.json({ reviews: reviewList });
    },

    addReview: async function (req, res) {
        try {
            const cafeName = req.body.cafename;
            const review = req.body.body;
            const review_title = req.body.title;
            const rating = req.body.rating;
            const dateCreated = new Date()
            const email = req.user.user.email;

            let img_path = req.files;
            const attached = [];
            console.log(img_path);
            if (img_path === undefined) {
                attached = [];
            }
            else {
                for (let i = 0; i < img_path.length; i++) {
                    attached.push("../uploads/" + img_path[i].filename);
                }
            }

            const user = await User.findOne({ email: email });

            const cafe = await Cafe.findOne({ name: cafeName });
            const newDoc = {
                cafeName: cafe._id,
                reviewer: user._id,
                review: review,
                review_title: review_title,
                rating: rating,
                dateCreated: dateCreated,
                mediaPath: attached,
                ownerreply: null
            };

            console.log(newDoc);

            const newReview = new Review(newDoc);
            await newReview.save();


            if (cafe.rating === 0)
                cafe.rating = parseInt(rating);
            else
                cafe.rating = (parseFloat(cafe.rating) + parseInt(rating)) / 2;

            await cafe.save();

            res.sendStatus(200)
        } catch {
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
            }
            else if (req.user.type == 'cafe') {

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
                res.render('cafeProfile', { //edit to correct one
                    layout: 'ownerTemplate',
                    ownerprofile: cafedetails,
                    reviews: reviewList,
                    session: req.isAuthenticated(),
                    owner: true
                });
            }
        }
        else {
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
            }
            else {
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
            }
            else {
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
        }
        else {
            res.redirect('/');
        }
    },

    searchcafes: async function (req, res) {
        console.log(`Search Query: ${req.body.search}`);

        const cafes = [];
        const cafeList = await Cafe.find({ name: { $regex: '.*' + req.body.search + '.*', $options: 'i' } })
        for (let i = 0; i < cafeList.length; i++) {
            const review = await Review.find({ cafeName: cafeList[i]._id })

            cafes.push({
                cafeName: cafeList[i].name,
                numOfReviews: review.length,
                cafeShortInfo: cafeList[i].description,
                open_details: cafeList[i].weekdays_avail,
                cafeImg: cafeList[i].image,
                price: cafeList[i].price,
                rating: cafeList[i].rating
            });
        }

        if (cafes.length == 0) {
            res.render('cafes', {
                cafeCards: cafes,
                error: "<h2 style='width: 100%; text-align: center;'>No results found...</h2>",
                session: req.isAuthenticated()
            });
        }
        else {
            res.render('cafes', {
                cafeCards: cafes,
                session: req.isAuthenticated()
            });
        }

    },

    deleteReview: async function (req, res) {
        try {
            const review_id = req.user.user._id;
            const cafe_id = req.body.cafe_id;
            const review = await Review.findOne({ reviewer: review_id, cafeName: cafe_id });
            const cafe = await Cafe.findOne({ _id: cafe_id });
            const reviews = await Review.find({ cafeName: cafe_id });

            if (reviews.length == 1)
                cafe.rating = 0;
            else
                cafe.rating = 2 * parseFloat(cafe.rating) - parseInt(review.rating);
            await cafe.save()
            if (review.ownerReply != null) {
                await Reply.deleteOne({ _id: review.ownerReply });
            }

            await Review.deleteOne({ reviewer: review_id, cafeName: cafe_id });
            res.sendStatus(200);
        } catch {
            res.sendStatus(400)
        }
    },

    editReview: async function (req, res) {
        try {
            const review_id = req.body.review_id;
            const newReview = req.body.review;
            const newTitle = req.body.review_title.trim();
            const newRating = req.body.rating;
            const oldrating = req.body.oldRating;
            const rev = await Review.findOne({ _id: review_id });

            if (newRating != rev.rating || newRating != 0) {
                rev.review = newReview;
                rev.review_title = newTitle;
                rev.rating = newRating;
                rev.dateModified = Date.now();
                await rev.save();

                const cafe = await Cafe.findOne({ _id: rev.cafeName });
                cafe.rating = 2 * parseFloat(cafe.rating) - parseInt(oldrating);
                cafe.rating = (parseFloat(cafe.rating) + parseInt(newRating)) / 2;
                await cafe.save();
            }
            else
                await Review.updateOne({ _id: review_id }, { review: newReview, review_title: newTitle, dateModified: Date.now() });
            res.sendStatus(200);
        }
        catch (err) {
            console.log(err);
            res.sendStatus(400)
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
    },

    reply: async function (req, res) {
        try {
            const review_id = req.body.reviewId;
            const reply = req.body.reply;

            const doc = {
                reply_text: reply,
                date: Date.now()
            }

            const newReply = new Reply(doc);
            await newReply.save();

            await Review.updateOne({ _id: review_id }, { ownerReply: newReply._id });
        }
        catch (err) {
            console.log(err);
            res.sendStatus(400)
        }

    },

    upvote: async function (req, res) {
        try {
            if (req.isAuthenticated()) {
                const review_id = req.body.reviewId;
                const user = await User.findOne({ _id: req.user.user._id });
                const review = await Review.findOne({ _id: review_id });

                if (user.upvotes.includes(review_id)) {
                    user.upvotes.splice(user.upvotes.indexOf(review_id), 1);
                    review.upvotes--;
                }
                else {
                    if (user.downvotes.includes(review_id)) {
                        user.downvotes.splice(user.downvotes.indexOf(review_id), 1);
                        review.downvotes--;
                    }
                    user.upvotes.push(review_id);
                    review.upvotes++;
                }

                await user.save();
                await review.save();
                res.sendStatus(200);
            }
            else
                res.sendStatus(400)
        }
        catch (err) {
            console.log(err);
            res.sendStatus(400)
        }
    },

    downvote: async function (req, res) {
        try {
            if (req.isAuthenticated()) {
                const review_id = req.body.reviewId;
                const user = await User.findOne({ _id: req.user.user._id });
                const review = await Review.findOne({ _id: review_id });

                if (user.downvotes.includes(review_id)) {
                    user.downvotes.splice(user.downvotes.indexOf(review_id), 1);
                    review.downvotes--;
                }
                else {
                    if (user.upvotes.includes(review_id)) {
                        user.upvotes.splice(user.upvotes.indexOf(review_id), 1);
                        review.upvotes--;
                    }
                    user.downvotes.push(review_id);
                    review.downvotes++;
                }

                await user.save();
                await review.save();
                res.sendStatus(200);
            }
            else
                res.sendStatus(400)
        }
        catch (err) {
            console.log(err);
            res.sendStatus(400)
        }
    },

    /*TODO
    - owner profile i feel there is stuff im missing
    
    - cafe menu should hold either an image or image path
    - implement pagination
    - finish register
    - edit profile page
    - handle adding of media for reviews
    - change media in edit review
    - is the read more thing fixed?
    */

}

export default controller;