class ReviewHelper {
    static updateRatingOnAdd(cafe, reviewCount, rating, existingReviewRating = null) {
      rating = parseInt(rating);
      if (existingReviewRating !== null) {
        existingReviewRating = parseInt(existingReviewRating);
        cafe.rating = ((cafe.rating * reviewCount) - existingReviewRating + rating) / reviewCount;
      } else {
        cafe.rating = ((cafe.rating * reviewCount) + rating) / (reviewCount + 1);
      }
    }
  
    static updateRatingOnDelete(cafe, reviewRating, reviewCount) {
      reviewRating = parseInt(reviewRating);
      if (reviewCount === 1) {
        cafe.rating = 0;
      } else {
        cafe.rating = 2 * parseFloat(cafe.rating) - reviewRating;
      }
    }
  
    static updateRatingOnEdit(cafe, oldRating, newRating) {
      oldRating = parseInt(oldRating);
      newRating = parseInt(newRating);
      cafe.rating = 2 * parseFloat(cafe.rating) - oldRating;
      cafe.rating = (parseFloat(cafe.rating) + newRating) / 2;
    }
  
    static formatReview(reviewDoc, reviewer, reply, session, reqUser) {
      let author = false;
      let upvoted = false;
      let downvoted = false;
      
      if (session && reqUser) {
        author = (reviewer.email === reqUser.email);
        if (reqUser.upvotes.includes(reviewDoc._id.toString())) {
          upvoted = true;
        } else if (reqUser.downvotes.includes(reviewDoc._id.toString())) {
          downvoted = true;
        }
      }

      let formattedReview = {
        review: reviewDoc.review,
        reviewdate: reviewDoc.dateCreated.toString().substring(0, 15),
        rating: reviewDoc.rating,
        username: reviewer.firstname + " " + reviewer.lastname,
        dateModified: reviewDoc.dateModified,
        up: reviewDoc.upvotes,
        down: reviewDoc.downvotes,
        media: reviewDoc.mediaPath,
        profilepic: reviewer.profilepic,
        title: reviewDoc.review_title,
        author: author,
        date: reviewer.dateCreated.toString().substring(11, 15),
        reviewId: reviewDoc._id,
        upvoted: upvoted,
        downvoted: downvoted,
        session: session
      };

      if (reviewDoc.dateModified != null)
        formattedReview.editdate = reviewDoc.dateModified.toString().substring(0, 15);
      if (reply != null) {
        formattedReview.ownerreplydate = reply.date.toString().substring(0, 15);
        formattedReview.ownerreply = reply.reply_text;
      }
      return formattedReview;
    }
  }
  
  export default ReviewHelper;  