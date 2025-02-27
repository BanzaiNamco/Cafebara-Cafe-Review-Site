import CafeHelper from '../utils/cafeHelper.js';


const cafeController = {
    getIndex: async function (req, res) {
        try {
            if (req.isAuthenticated()) {
                if (req.user.type == 'cafe') {
                    res.redirect('/myprofile');
                    return
                }
            }
            const cafeCarouselCards = await CafeHelper.getCafeCarouselCards();
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
            const cafes = await CafeHelper.getCafeList();
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
        try {
            const cafes = await CafeHelper.searchCafesByName(req.body.search);
            res.render('cafes', {
                cafeCards: cafes,
                session: req.isAuthenticated(),
                error: cafes.length === 0 ? "<h2 style='width: 100%; text-align: center;'>No results found...</h2>" : null
            });
        } catch {
            res.sendStatus(400);
        }
    }
}

export default cafeController;