import db from '../schemas/db.js';
import {About} from '../schemas/aboutSchema.js';
import { Cafe } from '../schemas/cafeSchema.js';
import { Review } from '../schemas/reviewsSchema.js';
import { User } from '../schemas/userSchema.js';

let email = ``;
let isLogged = 0;

const controller = {

    getIndex: async function(req, res) {
        // your code here
        const cafeCarouselCards = [];
        const resp = await db.findLimitSorted(Cafe, {}, 5, function(result) {
            if(result != false)for(let i = 0; i < result.length; i++){
                cafeCarouselCards.push({
                    cafeName: result[i].name,
                    cafePath: result[i].image,
                    avgPrice: result[i].price
                });
            }
        });
        console.log(`YESSSSS${email}`);
       res.render('index', {
            isIndex: true,
            carouselCards: cafeCarouselCards,
            session: isLogged
       });
       res.status(200);
       return;
    },

    getAbout: async function(req, res) {
        // your code here
        const profilecards = [];
        const resp = await db.findAll(About, function(result) {
            for(let i = 0; i < result.length; i++){
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
            }
        });
        res.render('about', {
            isAbout: true,
            profilecards: profilecards,
            session: isLogged
        });
    },

    getCafes: async function(req, res) {
        // your code here
        // do database stuff here
        const cafes = [];
        const resp = await db.findAll(Cafe, async function(result) {
            for(let i = 0; i < result.length; i++){
                await db.findAllQuery(Review, {cafeName: result[i]._id}, function(result2) {
                    cafes.push({
                        cafeName: result[i].name,
                        numOfReviews: result2.length,
                        cafeShortInfo: result[i].description,
                        open_details: result[i].weekdays_avail,
                        cafeImg: result[i].image,
                        price: result[i].price,
                    });
                })
            };
        });

        res.render('cafes', {
            cafeCards: cafes,
            session: isLogged
        });
    },
 
    cafe: async function(req, res){
       //change render to the correct one
       const cafe = [];
       const reviews = [];

       const cafeName = req.params.cafeName;

        let cafe_id;
        const resp1 = await db.findOne(Cafe, {name: cafeName}, function(result) { 
            if(result!= false){
                cafe_id = result._id;
            }
        });
        
        let revs = [];
        const resp2 = await db.findAllQuery(Review, {cafeName: cafe_id}, function(result2) {
            if(result2 != false){
                revs = result2
            }
        });

        for(let i = 0; i < revs.length; i++){
            const resp3 = await db.findOne(User, {_id: revs[i].reviewer}, function(result3) {
                    reviews.push({
                        review: revs[i].review,
                        reviewdate: revs[i].dateCreated.toString().substring(0, 15),
                        rating: revs[i].rating,
                        cafeName: revs[i].cafeName,
                        username: result3.firstname + " " + result3.lastname,
                        dateModified: revs[i].dateModified,
                        up: revs[i].upvotes,
                        down: revs[i].downvotes,
                        media: revs[i].mediaPath,
                        profilepic: result3.profilepic,
                        title: revs[i].review_title,
                        date: result3.dateCreated.toString().substring(11, 15)
                    });
                });
            }
            
        const resp4 = await db.findOne(Cafe, {name: cafeName}, function(result4) {
            cafe.push({
                cafeName: result4.name,
                imgPath: result4.image,
                description: result4.description,
                weekday_avail: result4.weekdays_avail,
                weekend_avail: result4.weekends_avail,
                website: result4.website,
                phonenumber: result4.phone,
                price: result4.price,
                numReviews: reviews.length,
                menu: result4.menu,
                address: result4.address
            });
        });
       res.render("viewCafe", {
            layout: 'cafeTemplate',
            cafePage: cafe,
            reviews: reviews,
            session: isLogged
       });

    },

    addReview: async function(req, res) {
        const cafeName = req.body.cafeName;
        const review = req.body.review;
        const review_title = req.body.review_title;
        const rating = req.body.rating;
        const dateCreated = req.body.dateCreated;
        const media = req.body.media;
        const user = email;
        let user_id;
        let cafe_id;
        
        const resp1 = await db.findOne(User, {email: user}, function(result) {
            if(result != false)
                user_id = result._id;
        });
        const resp2 = await db.findOne(Cafe, {name: cafeName}, function(result2) {
            if(result2){
                cafe_id = result2._id;
            }
        });
        const newReview = {
            cafeName: cafe_id,
            reviewer: user_id,
            review: review,
            review_title: review_title,
            rating: rating,
            dateCreated: dateCreated,
            mediaPath: media,
        };

        const resp3 = await db.insertOne(Review, newReview, function(flag) {
            if(flag!=false){
                console.log("Review added");
            }
            else{
                console.log("Review not added");
            }
        });

        res.redirect('/review?cafeid=' + cafe_id);
    },

    login: function (req, res) {
        res.render ('login', {layout: 'logregTemplate'});
    },

    logsucc: function (req, res) {
        email = req.body.email;
        isLogged = 1;
        console.log(`${email}`);
        res.redirect(`/`);
    },

    logout: function (req, res) {
        email = ``;
        isLogged = 0;
        res.redirect(`/`);
    },

    refreshCafe: async function(req, res) {
        const cafe_id= req.query.cafeid;

        const cafe = []
        let revs = [];
        const reviews = []
        const resp2 = await db.findAllQuery(Review, {cafeName: cafe_id}, function(result2) {
            if(result2 != false){
                revs = result2
            }
        });

        for(let i = 0; i < revs.length; i++){
            const resp3 = await db.findOne(User, {_id: revs[i].reviewer}, function(result3) {
                    reviews.push({
                        review: revs[i].review,
                        reviewdate: revs[i].dateCreated.toString().substring(0, 15),
                        rating: revs[i].rating,
                        cafeName: revs[i].cafeName,
                        username: result3.firstname + " " + result3.lastname,
                        dateModified: revs[i].dateModified,
                        up: revs[i].upvotes,
                        down: revs[i].downvotes,
                        media: revs[i].mediaPath,
                        profilepic: result3.profilepic,
                        title: revs[i].review_title,
                        date: result3.dateCreated.toString().substring(11, 15)
                    });
                });
            }
            
        const resp4 = await db.findOne(Cafe, {_id: cafe_id}, function(result4) {
            cafe.push({
                cafeName: result4.name,
                imgPath: result4.image,
                description: result4.description,
                weekday_avail: result4.weekdays_avail,
                weekend_avail: result4.weekends_avail,
                website: result4.website,
                phonenumber: result4.phone,
                price: result4.price,
                numReviews: reviews.length,
                menu: result4.menu,
                address: result4.address
            });
        });
       res.render("viewCafe", {
            layout: 'cafeTemplate',
            cafePage: cafe,
            reviews: reviews,
            session: isLogged
       });

    }

}

export default controller;