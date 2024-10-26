const {Source} = require('../models/models');
const path = require('path')
async function getSourceRepByRepId(repId) {
    try {
        const userSource = await Source.findOne({
            where: { reportIdReport: repId },
        });

        if (!userSource) {
            throw Error('Нет данного отчета')
        }

        return {reportSource: path.join(userSource.dataValues.location, 'report.json'), reportTrashSource: path.join(userSource.dataValues.locationTrash, 'trash.json')};

    } catch (error) {
        console.error('Ошибка при получении отчетов пользователя:', error);
        throw error; // Обработка ошибок
    }
}

module.exports = getSourceRepByRepId;
