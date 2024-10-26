const sequelize = require('../db')
const {DataTypes} = require('sequelize') // импорт для типов данных в бд

const User = sequelize.define('user', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    email: {type: DataTypes.STRING, unique: true},
    password: {type: DataTypes.STRING},
    role: {type: DataTypes.STRING, defaultValue: 'USER'},
    FIO: {type: DataTypes.STRING},
    tokenGPT: {type: DataTypes.STRING},
    profilePhoto: {type: DataTypes.STRING}
})

const User_Reports = sequelize.define('user_reports', {
    idReports: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true}
})

const Report = sequelize.define('report', {
    idProject: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING, unique: true}
})

const Source = sequelize.define('srcs', {
    idSrc: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    reportIdReport: {type: DataTypes.INTEGER, allowNull: false},
    location: {type: DataTypes.STRING, allowNull: false}
})


User.belongsToMany(Report, {through: User_Reports})
Report.belongsToMany(User, {through: User_Reports})

Report.hasMany(Source)
Source.belongsTo(Report)

module.exports = {
    User,
    Report,
    User_Reports,
    Source
}