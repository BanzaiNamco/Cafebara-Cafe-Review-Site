import { User } from "../model/userSchema.js";
import { Cafe } from "../model/cafeSchema.js";
import { Review } from "../model/reviewsSchema.js";
import { Reply } from "../model/ownerReply.js";

class ProfileHelper {
    static async getUserDetails(userId) {
        return await User.findOne({ _id: userId });
    }

    static async getCafeDetails(cafeId) {
        return await Cafe.findOne({ _id: cafeId });
    }

    static async parseBirthday(birthday) {
        if (!birthday) return { day: '', month: '', year: '' };
        return {
            day: birthday.getDate(),
            month: birthday.getMonth(),
            year: birthday.getFullYear(),
        };
    }

    static async getReviews(userId, isCafe = false) {
        const filter = isCafe ? { cafeName: userId } : { reviewer: userId };
        const reviews = await Review.find(filter);
        let reviewList = [];
        let go = 0, shi = 0, san = 0, ni = 0, ichi = 0;
        let totalRating = 0;

        for (let review of reviews) {
            const relatedEntity = await (isCafe ? User : Cafe).findOne({ _id: isCafe ? review.reviewer : review.cafeName });
            const reply = await Reply.findOne({ _id: review.ownerReply });

            let reviewData = {
                reviewtext: review.review,
                title: review.review_title,
                rating: review.rating,
                reviewdate: review.dateCreated?.toString().substring(0, 15),
                memberyear: relatedEntity.dateCreated?.toString().substring(11, 15),
                userimg: relatedEntity.profilepic,
                reviewId: review._id,
            };

            if (isCafe) {
                reviewData.username = `${relatedEntity.firstname} ${relatedEntity.lastname}`;
                reviewData.media = review.mediaPath;
                if (reply) {
                    reviewData.reply = reply.reply_text;
                    reviewData.reply_date = reply.date.toString().substring(0, 15);
                }
                totalRating += review.rating;
            } else {
                reviewData.cafe = relatedEntity.name;
                reviewData.cafeimg = relatedEntity.image;
            }

            switch (review.rating) {
                case 5: go++; break;
                case 4: shi++; break;
                case 3: san++; break;
                case 2: ni++; break;
                case 1: ichi++; break;
            }

            reviewList.push(reviewData);
        }

        return { reviewList, stats: { go, shi, san, ni, ichi } };
    }
}

export default ProfileHelper;
