const Router = require('express')
const router = new Router()
const userController = require('../controllers/userController')
const authMiddleware = require('../middleware/authMiddleware')


router.post('/registration', userController.registration)
router.post('/login', userController.login)
router.post('/login/google', userController.loginGoogle)
router.post('/getToken', authMiddleware, userController.getToken)
router.post('/profile', authMiddleware, userController.changeProfile)
router.post('/addphotoinprofile', authMiddleware, userController.addPhotoInProfile)
router.get('/auth', authMiddleware, userController.check)
router.post('/profile/changepass', authMiddleware, userController.changePass)


module.exports = router