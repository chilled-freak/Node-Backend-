const express = require('express');
const userController = require('../controllers/userController');
const authController = require('../controllers/authController');
const router = express.Router();

router.post('/signUp', authController.signUp);
router.post('/login', authController.login);

router.post('/forgotPassword', authController.forgotPassword);
router.patch('/resetPassword/:token', authController.resetPassword);
router.patch('/updateMyPassword', authController.protect, authController.updatePassword);
router.get('/me', authController.protect, userController.getMe, userController.getOneUser);
router.patch('/updateMe', authController.protect, userController.uploadImage, userController.resizeImage, userController.updateMe);
router.delete('/deleteMe', authController.protect, userController.deleteMe);

router
    .route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser)

router
    .route('/:id')
    .get(userController.getOneUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser)

module.exports = router 