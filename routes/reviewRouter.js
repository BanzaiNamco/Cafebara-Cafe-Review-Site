import { Router } from "express";
import reviewController from "../controllers/reviewController.js";
import multer from 'multer';

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });
const router = Router();

router.get(`/cafe/:cafeName`, reviewController.cafe);
router.post('/cafe/get/review', reviewController.getCafeReview);
router.post('/addReview', upload.array('review_upload', 10), reviewController.addReview);
router.delete('/deleteReview', reviewController.deleteReview);
router.post('/editReview', reviewController.editReview);
router.post(`/reply`, reviewController.reply);
router.post('/upvote', reviewController.upvote);
router.post('/downvote', reviewController.downvote);

export default router;