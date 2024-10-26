const sequelize = require('../db')
const {DataTypes} = require('sequelize') // импорт для типов данных в бд

const User = sequelize.define('users', {
    id: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    email: {type: DataTypes.STRING, unique: true},
    password: {type: DataTypes.STRING},
    role: {type: DataTypes.STRING, defaultValue: 'USER'},
    FIO: {type: DataTypes.STRING},
    profilePhoto: {type: DataTypes.STRING}
})

const User_Reports = sequelize.define('user_reports', {
    idReports: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    userId: {type: DataTypes.INTEGER, allowNull: false}, // Добавьте поле userId
    reportIdReport: {type: DataTypes.INTEGER, allowNull: false} // Добавьте поле для связи с Report
});

const Report = sequelize.define('reports', {
    idReport: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    name: {type: DataTypes.STRING, unique: true}
})

const Source = sequelize.define('srcs', {
    idSrc: {type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true},
    reportIdReport: {type: DataTypes.INTEGER, allowNull: false},
    location: {type: DataTypes.STRING, allowNull: false}
})


User.belongsToMany(Report, {through: User_Reports})
/*User.associate = function(models) {
    User.belongsToMany(Report,{
        through: User_Reports,
        foreignkey:'userId',
        as: 'userRep'
    })
};*/
Report.belongsToMany(User, {through: User_Reports})
/*Report.associate = function(models) {
    Report.belongsToMany(User,{
        through: User_Reports,
        foreignkey:'reportIdReport',
        as: 'repUser'
    })
};*/
Report.hasMany(Source)
Source.belongsTo(Report)

module.exports = {
    User,
    Report,
    User_Reports,
    Source
}