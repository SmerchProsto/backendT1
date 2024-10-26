const ApiError = require('../error/ApiError');
const {User_Reports} = require('../models/models')
const {Source} = require('../models/models')
const {Report} = require('../models/models')
const fs = require('fs')
const path = require('path')
const archiver = require('archiver')
const convertCsvToJson = require("../utils/convertCsvToJson/convertCsvToJson");
const createDirectoryIfPathNotFound = require("../utils/createDirectoryIfPathNotFound/createDirectoryIfPathNotFound")
const saveJsonToFile = require("../utils/saveJsonToFile/saveJsonToFile")
class ReportsController {

    async uploadCSV(req, res, next) {
        if (!req.files || !req.files.file || path.extname(req.files.file.name).toLowerCase() !== '.csv') {
            return res.status(400).send('Пожалуйста, загрузите CSV файл.');
        }

        const file = req.files.file;
        const jsonFileName = path.basename(file.name, '.csv') + '.json';
        const uploadsDir = path.join(__dirname, '..', 'uploads'); // Определяем директорию uploads
        const jsonOutputPath = path.join(uploadsDir, jsonFileName); // Определяем путь для сохранения JSON файла

        try {
            // Проверяем и создаём папку, если её нет
            await createDirectoryIfPathNotFound(uploadsDir);

            // Преобразуем CSV в JSON и сохраняем результат
            convertCsvToJson(file.data, (err, jsonData) => {
                if (err) {
                    console.error('Ошибка обработки CSV:', err);
                    return res.status(500).send('Ошибка обработки CSV');
                }

                // Сохраняем JSON данные в файл
                saveJsonToFile(jsonData, jsonOutputPath, (err, message) => {
                    if (err) {
                        console.error('Ошибка записи JSON:', err);
                        return res.status(500).send('Ошибка на стороне сервера');
                    }
                    res.status(200).send(message);
                });
            });
        } catch (error) {
            console.error('Ошибка при обработке запроса:', error);
            res.status(500).send('Произошла ошибка при обработке файла.');
        }
    }

    // Контроллер для загрузки JSON файла
    async uploadJSON(req, res, next) {
        if (!req.files || !req.files.file) {
            return res.status(400).send('Пожалуйста, загрузите JSON файл.');
        }

        const file = req.files.file;
        const jsonFileName = file.name;
        const uploadsDir = path.join(__dirname, '..', 'uploads'); // Определяем директорию uploads
        const jsonOutputPath = path.join(uploadsDir, jsonFileName); // Определяем путь для сохранения JSON файла


        try {
            await createDirectoryIfPathNotFound(uploadsDir);
            // Читаем содержимое файла
            const jsonData = JSON.parse(file.data.toString());

            // Сохраняем JSON данные в файл
            saveJsonToFile(jsonData, jsonOutputPath, (err, message) => {
                if (err) {
                    return res.status(500).send('Ошибка на стороне сервера');
                }
                res.status(200).send(message);
            });
        } catch (error) {
            console.error('Ошибка обработки JSON:', error);
            return res.status(400).send('Неверный формат JSON файла.');
        }
    }
    async create(req, res, next) {
        try {
            // Получаем путь текущей рабочей папки
            const currentDirectory = path.resolve();
            const parentFolderPath = path.resolve(currentDirectory, 'static');
            const userId = req.user.id.toString()

            const {name, reportName} = req.body

            const fileName = reportName;
            const folderName = name
            const fileContent = ''
            let folderNameWithUserId = path.join(parentFolderPath, userId);

            if (!fs.existsSync(folderNameWithUserId)) {
                await fs.promises.mkdir(folderNameWithUserId);
            }

            folderNameWithUserId = path.join(parentFolderPath, userId, folderName);
            // Полный путь к файлу
            const filePath = path.join(folderNameWithUserId, fileName);

            if (!fs.existsSync(folderNameWithUserId)) {
                await fs.promises.mkdir(folderNameWithUserId);
                console.log(`Папка отчета ${name} создана`);
            } else {
                return res.status(500).json({message: 'Отчет уже создан1'})
            }

            if (!fs.existsSync(filePath)) {
                fs.writeFile(filePath, fileContent, (err) => {
                    console.log('Отчет успешно создан');
                });
            } else {
                return res.status(500).json({message: 'отчет уже создан2'})
            }

            const Report = await Report.create({name})
            const ReportId = Report.dataValues.idReport;
            const srcReport = await Source.create({reportIdReport: ReportId, location: filePath})
            const userReports = await User_Reports.create({userId: userId, ReportIdReport: ReportId})
            res.json({message: 'Файлы и папки созданы и успешно занесены в бд'})
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }

    }

    async getAll(req, res, next) {
        const allReport = []
        const allReportsWithoutLimit = []
        const allReportsWithoutLimitObject = []
        const ReportObjects = []
        try {
            let {userId} = req.params
            let {limit, page} = req.query
            page = page || 1
            limit = limit || 9
            let offset = page * limit - limit
            const Reports = await User_Reports.findAll({ where: { userId:  userId}, limit, offset})
            let ReportsAllCount = await User_Reports.findAndCountAll({ where: { userId:  userId}})
            const allReportWithoutLimitDataValues = ReportsAllCount.rows
            ReportsAllCount = ReportsAllCount.count

            allReportWithoutLimitDataValues.forEach(Report => {
                allReportsWithoutLimit.push(Report.dataValues.ReportIdReport)
            })

            for (const id of allReportsWithoutLimit) {
                const ReportUnique = await Report.findOne({where: {idReport: id}})
                allReportsWithoutLimitObject.push(ReportUnique.dataValues)
            }

            Reports.forEach(Report => {
                allReport.push(Report.dataValues.reportIdReport)
            })

            for (const id of allReport) {
                const ReportUnique = await Report.findOne({where: {idReport: id}})
                ReportObjects.push(ReportUnique.dataValues)
            }

            res.json({ReportObjects, count: ReportObjects.length, allCount: ReportsAllCount, allReportsWithoutLimitObject})
            // пока для debug
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }

    }
    async getOne(req, res, next) {
        try {
            const {userId, ReportId, nameReport} = req.params;
            const reportPath = path.join(__dirname, '..', 'static', userId, nameReport);


            let content = fs.readFileSync(reportPath, 'utf-8')

            res.json({ content });
        } catch (e) {
            next(ApiError.badRequest(e.message));
        }
    }

    async save(req, res, next) {
        try {
            const {userId, nameReport} = req.params;
            const {report} = req.files
            const fileExtension = report.name;
            const ReportPath = path.join(__dirname, '..', 'static', userId, fileExtension);

            await report.mv(path.resolve(ReportPath))

            res.status(200).send({ message: 'Отчет успешно сохранен!' });

        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }

    async download(req, res, next){
        try {
            const {userId, nameReport} = req.body;

            // Создаем путь к папке проекта
            const ReportPath = path.join(__dirname, '..', 'static', userId, nameReport);


            const archive = archiver('zip', {
                zlib: {level: 9} // Уровень сжатия
            });

            // Handle archive errors
            archive.on('error', (err) => {
                res.status(500).send({message: err.message});
            });

            // Set the appropriate headers
            res.attachment(nameReport + '.zip');

            // Pipe the archive to the response
            archive.pipe(res);

            // Add files to the archive
            const files = ['index.html', 'index.css', 'index.js']; // Replace with your files
            files.forEach((file) => {
                const filePath = path.join(ReportPath, file); // Adjust the directory
                if (fs.existsSync(filePath)) {
                    archive.file(filePath, { name: file });
                } else {
                    next(ApiError.internal('Не существует такого'))
                }
            });

            // Finalize the archive
            await archive.finalize();
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }
    }
}

module.exports = new ReportsController()