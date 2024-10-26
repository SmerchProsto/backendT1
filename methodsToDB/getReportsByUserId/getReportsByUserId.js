const { User_Reports, Report } = require('../../models/models');
const { Op } = require ('sequelize');
async function getReportsByUserId(userId, limit=undefined, offset=undefined) {
    try {
        let userReports
        if (limit && offset) {
            userReports = await User_Reports.findAll({
                where: { userId }, limit, offset
            });
        }
        // Получаем все записи из User_Reports, где userId = 1
        userReports = await User_Reports.findAll({
            where: { userId },
        });

        const allRepsIds = userReports.map(userReport => userReport.dataValues.reportIdReport);
        // Возвращаем все поля модели Report для каждого отчета
        const reports = await Report.findAll({
            where: {
                idReport: {
                    [Op.in]: allRepsIds,
                },
            },
        });

        return reports.map(report=> report.dataValues)
    } catch (error) {
        console.error('Ошибка при получении отчетов пользователя:', error);
        throw error; // Обработка ошибок
    }
}

module.exports = getReportsByUserId;

/*// Использование функции
getReportsByUserId(1)
    .then(reports => console.log('Отчеты пользователя:', reports))
    .catch(error => console.error('Ошибка:', error));*/
