import { Cafe } from '../model/cafeSchema.js';
import { Review } from '../model/reviewsSchema.js';

class CafeHelper {
    static async getCafeCarouselCards(limit = 5) {
        const cafes = await Cafe.find().sort({ dateCreated: -1 }).limit(limit);
        return cafes.map(cafe => ({
            cafeName: cafe.name,
            cafePath: cafe.image,
            avgPrice: cafe.price
        }));
    }

    static async getCafeList() {
        const cafes = await Cafe.find();
        return Promise.all(
            cafes.map(async (cafe) => {
                const reviews = await Review.find({ cafeName: cafe._id });
                return {
                    cafeName: cafe.name,
                    numOfReviews: reviews.length,
                    cafeShortInfo: cafe.description,
                    open_details: cafe.weekdays_avail,
                    cafeImg: cafe.image,
                    price: cafe.price,
                    rating: cafe.rating,
                    media: cafe.mediPath,
                };
            })
        );
    }

    static async searchCafesByName(searchTerm) {
        const cafeList = await Cafe.find({ name: { $regex: '.*' + searchTerm + '.*', $options: 'i' } });
        return Promise.all(
            cafeList.map(async (cafe) => {
                const reviews = await Review.find({ cafeName: cafe._id });
                return {
                    cafeName: cafe.name,
                    numOfReviews: reviews.length,
                    cafeShortInfo: cafe.description,
                    open_details: cafe.weekdays_avail,
                    cafeImg: cafe.image,
                    price: cafe.price,
                    rating: cafe.rating
                };
            })
        );
    }
}

export default CafeHelper;