const Router = require('express')
const router = new Router()
const authMiddleware = require('../middleware/authMiddleware')
const needUserMiddleware = require('../middleware/needUserMiddleware')
const needUserMiddlewareWithQuery = require('../middleware/needUserMiddlewareWithQuery')
const reportsController = require('../controllers/reportsController')

router.post('/', reportsController.create)
router.get('/', reportsController.getAll)
router.get('/1/:idReport/', reportsController.getOne)
router.post('/1/:idReport/', reportsController.save)

module.exports = router