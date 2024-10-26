const jwt = require('jsonwebtoken')

module.exports = function (req, res, next) {
    if (req.method === 'OPTIONS') {
        next()
    }

    try {
        const authHeader = req.headers.authorization;
        const token = authHeader.split(' ')[1]; // Bearer adsfasdf
        if (!token) {
            return res.status(401).json({message: "Пользователь не авторизован"})
        }
        const decoded = jwt.verify(token, process.env.SECRET_KEY)
        req.user = decoded
        let {userId} = req.body
        if (req.user.id.toString() !== userId) {
            return res.status(403).json({message: "Нет доступа"})
        }



        next()
    } catch (e) {
        res.status(401).json({message: "Пользователь не авторизован"})
    }
}