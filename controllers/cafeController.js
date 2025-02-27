import { Cafe } from '../model/cafeSchema.js';
import { Review } from '../model/reviewsSchema.js';

const cafeController = {
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

    searchcafes: async function (req, res) {
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
        } else {
            res.render('cafes', {
                cafeCards: cafes,
                session: req.isAuthenticated()
            });
        }
    }
}

export default cafeController;