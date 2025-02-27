import { Router } from "express";
import profileController from "../controllers/profileController.js";
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

router.get(`/about`, profileController.getAbout);
router.get(`/myprofile`, profileController.profile);
router.get(`/settings`, profileController.settings);
router.get(`/user/:username`, profileController.userProfile);
router.post(`/updateprofile`,upload.single('dp_upload'), profileController.updateProfile)
router.post(`/profile/get/review`, profileController.getProfileReview);
export default router;