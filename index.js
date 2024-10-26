require('dotenv').config()
/*const { Sequelize } = require('sequelize');
const {DataTypes} = require('sequelize')*/
const express = require('express')
const path = require('path')

const PORT = process.env.PORT || 8080

const cors = require('cors')
const fileUpload = require('express-fileupload')
const router = require('./routes/index')


const errorHandler = require('./middleware/ErrorHandlingMiddleware')

const app = express()
app.use(cors()); // Для работы с CORS
app.use(express.json()); // Парсинг JSON тел запросов
app.use(express.urlencoded({ extended: true })); // Парсинг x-www-form-urlencoded тел запросов
app.use(fileUpload()); // Загрузка файлов (должно быть после json и urlencoded парсеров)
app.use(express.static(path.resolve(__dirname, 'static'))); // Отдача статических файлов
app.use('/api', router); // Роутер с маршрутами для API

app.use(errorHandler)

const sequelize = require('./db')

const models = require('./models/models')

const start = async () => {
    try {
        await sequelize.authenticate()
        sequelize.sync({ alter: true })
            .then(() => {
                console.log('Database & tables updated!');
            }); //синхрон бд с схемой данных
        app.listen(PORT, () => {console.log(`Server started on port ${PORT}`)})
    } catch (e) {

    }
}

start()