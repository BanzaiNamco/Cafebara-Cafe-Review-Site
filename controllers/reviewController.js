import { Cafe } from '../model/cafeSchema.js';
import { Review } from '../model/reviewsSchema.js';
import { User } from '../model/userSchema.js';
import { Reply } from '../model/ownerReply.js';
import mongoose from "mongoose";

const reviewController = {
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

            if (req.user) {
                const userReviewDoc = await Review.findOne({
                    cafeName: cafe._id,
                    reviewer: req.user.user._id
                });
                if (userReviewDoc) {
                    writebuttondisable = true;
                    userRating = userReviewDoc.rating;
                    userReview = userReviewDoc.review;
                    userReviewTitle = userReviewDoc.review_title;
                    userReviewId = userReviewDoc._id;
                    userReviewMedia = userReviewDoc.mediaPath;
                }
            }

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

            if (req.user.user.upvotes.includes(reviews._id)) {
                upvoted = true;
            } else if (req.user.user.downvotes.includes(reviews._id)) {
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
            const dateCreated = new Date();
            const email = req.user.user.email;

            let img_path = req.files;
            let attached = [];
            if (img_path && img_path.length > 0) {
                for (let i = 0; i < img_path.length; i++) {
                    attached.push("../uploads/" + img_path[i].filename);
                }
            }

            const user = await User.findOne({ email: email });
            const cafe = await Cafe.findOne({ name: cafeName });

            let existingReview = await Review.findOne({
                cafeName: cafe._id,
                reviewer: user._id
            });
            const reviewCount = await Review.countDocuments({ cafeName: cafe._id });
            if (existingReview) {
                cafe.rating = ((cafe.rating * (reviewCount)) - existingReview.rating + parseInt(rating))/(reviewCount);
                existingReview.review = review;
                existingReview.review_title = review_title;
                existingReview.rating = rating;
                existingReview.dateCreated = dateCreated;
                existingReview.mediaPath = attached;
                await existingReview.save();
            } else {
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
                cafe.rating = ((cafe.rating * (reviewCount)) + parseInt(rating))/(reviewCount + 1);
                const newReview = new Review(newDoc);
                await newReview.save();
            }

            await cafe.save();

            res.redirect(`/cafe/${cafeName}`);
        } catch (error) {
            console.error(error);
            res.sendStatus(400);
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
            } else
                await Review.updateOne({ _id: review_id }, { review: newReview, review_title: newTitle, dateModified: Date.now() });
            res.sendStatus(200);
        } catch (err) {
            console.log(err);
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
        } catch (err) {
            console.log(err);
            res.sendStatus(400)
        }
    },

    upvote: async function (req, res) {
        if (req.isAuthenticated()) {
            const session = await mongoose.startSession();
            session.startTransaction();
            try {
                const review_id = req.body.reviewId;
                const type = req.body.type;
                const user = await User.findOne({ _id: req.user.user._id }).session(session);
                const review = await Review.findOne({ _id: review_id }).session(session);
                if (type == "remove like") {
                    if (user.upvotes.includes(review_id)) {
                        user.upvotes.splice(user.upvotes.indexOf(review_id), 1);
                        review.upvotes--;
                    }
                } else {
                    if (user.downvotes.includes(review_id)) {
                        user.downvotes.splice(user.downvotes.indexOf(review_id), 1);
                        review.downvotes--;
                    }
                    if (!user.upvotes.includes(review_id)) {
                        user.upvotes.push(review_id);
                        review.upvotes++;
                    }
                }
                await user.save({ session });
                await review.save({ session });
                await session.commitTransaction();
                session.endSession();
                res.sendStatus(200);

            } catch (err) {
                await session.abortTransaction();
                session.endSession();
                console.log(err);
                res.sendStatus(400)
            }
        } else {
            res.sendStatus(400)
        }
    },

    downvote: async function (req, res) {
        if (req.isAuthenticated()) {
            const session = await mongoose.startSession();
            session.startTransaction();
            try {
                const review_id = req.body.reviewId;
                const type = req.body.type;
                const user = await User.findOne({ _id: req.user.user._id }).session(session);
                const review = await Review.findOne({ _id: review_id }).session(session);
                if (type == "remove dislike") {
                    if (user.downvotes.includes(review_id)) {
                        user.downvotes.splice(user.downvotes.indexOf(review_id), 1);
                        review.downvotes--;
                    } 
                } else {
                    if (user.upvotes.includes(review_id)) {
                        user.upvotes.splice(user.upvotes.indexOf(review_id), 1);
                        review.upvotes--;
                    }
                    if (!user.downvotes.includes(review_id)) {
                        user.downvotes.push(review_id);
                        review.downvotes++;
                    }
                }

                await user.save();
                await review.save();
                await session.commitTransaction();
                session.endSession();
                res.sendStatus(200);

            } catch (err) {
                await session.abortTransaction();
                session.endSession();
                console.log(err);
                res.sendStatus(400)
            }
        } else{
            res.sendStatus(400)
        }

    }
}

export default reviewController;