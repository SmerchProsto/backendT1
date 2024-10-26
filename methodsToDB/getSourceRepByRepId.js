const { User_Reports, Source} = require('../models/models');
async function getSourceRepByRepId(repId) {
    try {
        const userSource = await Source.findOne({
            where: { reportIdReport: repId },
        });

        return userSource.dataValues.location;

    } catch (error) {
        console.error('Ошибка при получении отчетов пользователя:', error);
        throw error; // Обработка ошибок
    }
}

module.exports = getSourceRepByRepId;
