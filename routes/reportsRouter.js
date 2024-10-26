const Router = require('express')
const router = new Router()
const authMiddleware = require('../middleware/authMiddleware')
const needUserMiddleware = require('../middleware/needUserMiddleware')
const needUserMiddlewareWithQuery = require('../middleware/needUserMiddlewareWithQuery')
const reportsController = require('../controllers/reportsController')

router.post('/', authMiddleware, reportsController.create)
router.post('/upload-csv', reportsController.uploadCSV)
router.post('/upload-json', reportsController.uploadJSON)
router.get('/:userId', needUserMiddleware, reportsController.getAll)
router.get('/:userId/:projectId/:nameProject/', needUserMiddleware, reportsController.getOne)
router.post('/:userId/:nameProject/', needUserMiddleware, reportsController.save)
router.post('/download/:userId/:nameProject/', needUserMiddlewareWithQuery, reportsController.download)

module.exports = router