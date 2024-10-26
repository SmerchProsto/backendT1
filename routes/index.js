const Router = require('express')
const router = new Router()

const reportsRouter = require('./reportsRouter')
const userRouter = require('./userRouter')

router.use('/user', userRouter)
router.use('/reports', reportsRouter)
module.exports = router