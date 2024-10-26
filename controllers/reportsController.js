const ApiError = require('../error/ApiError');
const {User_Reports, User, Report} = require('../models/models')
const {Source} = require('../models/models')
const fs = require('fs')
const path = require('path')
const archiver = require('archiver')
const convertCsvToJson = require("../utils/convertCsvToJson/convertCsvToJson");
const createDirectoryIfPathNotFound = require("../utils/createDirectoryIfPathNotFound/createDirectoryIfPathNotFound")
const saveJsonToFile = require("../utils/saveJsonToFile/saveJsonToFile")
const getReportsByUserId = require("../methodsToDB/getReportsByUserId/getReportsByUserId");
const getSourceRepByRepId = require("../methodsToDB/getSourceRepByRepId");
const uploadsDir = path.join(__dirname, '..', 'uploads');
class ReportsController {
    async uploadCSV(req, res, next) {
        try {
            if (!req.files || !req.files.file || path.extname(req.files.file.name).toLowerCase() !== '.csv') {
                return res.status(400).send('Пожалуйста, загрузите CSV файл.');
            }
            const {idReport} = req.params
            const file = req.files.file;
            const jsonFileName = path.basename(file.name, '.csv') + '.json';
            /*const allReps = await getReportsByUserId(1)*/
            const uploadsDir = path.join(__dirname, '..', 'uploads'); // Определяем директорию uploads

            // Проверяем и создаём папку, если её нет
            await createDirectoryIfPathNotFound(uploadsDir);
            const pathToRep = path.join(uploadsDir, idReport)
            await createDirectoryIfPathNotFound(path.join(pathToRep));//потом исключение написать
            const allReps = getFilesInDirectory(pathToRep)
            if (isReportExists(getNameFromReports(allReps, jsonFileName))) {
                return res.status(400).send('Данное название уже есть');
            }

            const jsonOutputPath = path.join(uploadsDir, idReport, jsonFileName); // Определяем путь для сохранения JSON файла


            // Преобразуем CSV в JSON и сохраняем результат
            convertCsvToJson(file.data, async (err, jsonData) => {
                if (err) {
                    console.error('Ошибка обработки CSV:', err);
                    return res.status(500).send('Ошибка обработки CSV');
                }

                // Сохраняем JSON данные в файл
                saveJsonToFile(jsonData, jsonOutputPath, async (err, message) => {
                    if (err) {
                        console.error('Ошибка записи JSON:', err);
                        return res.status(500).send('Ошибка на стороне сервера');
                    }
                    /*await saveRepToDB(Report, jsonFileName, jsonOutputPath)*/
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
        try {
            if (!req.files || !req.files.file) {
                return res.status(400).send('Пожалуйста, загрузите JSON файл.');
            }
            const {idReport} = req.params

            const file = req.files.file;
            const jsonFileName = file.name;

            const pathToRep = path.join(uploadsDir, idReport)
            await createDirectoryIfPathNotFound(path.join(pathToRep));//потом исключение написать
            const jsonOutputPath = path.join(uploadsDir, idReport,  jsonFileName);
            /*const allReps = await getReportsByUserId(1);*/
            const allReps = getFilesInDirectory(pathToRep)

            if (isReportExists(getNameFromReports(allReps, jsonFileName))) {
                return res.status(400).send('Данное название уже есть');
            }


            // Читаем содержимое файла
            const jsonData = JSON.parse(file.data.toString());

            // Сохраняем JSON данные в файл с использованием промиса
            await saveJsonToFile(jsonData, jsonOutputPath);

            /*// Сохраняем данные в базу данных
            await saveRepToDB(Report, jsonFileName, jsonOutputPath);*/

            // Отправляем ответ только после успешного завершения всех операций
            res.status(200).send('Файл успешно загружен и данные сохранены.');
        } catch (error) {
            console.error('Ошибка обработки JSON:', error);
            return res.status(400).send('Неверный формат JSON файла.');
        }
    }

    async create(req, res, next) {
        try {
            const { reportName } = req.body;
            if (!reportName || typeof reportName !== 'string' || reportName.trim().length === 0) {
                next(ApiError.badRequest("Имя отчета заполнено неверно или не заполнено вовсе"));
            }
            let { reportId, location, locationTrash } = await saveRepToDB(Report, reportName, uploadsDir);

            // Используем хелперы для создания директории и файла
            ensureDirExists(location);

            const reportFile = path.join(location, 'report.json');
            ensureFileExists(reportFile);


            ensureDirExists(locationTrash);

            const trashFile = path.join(locationTrash, 'trash.json');
            ensureFileExists(trashFile);

            res.status(200).json(reportId);
        } catch (e) {
            next(ApiError.badRequest(e.message));
        }
    }

    /*async getAll(req, res, next) {
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

    }*/
    async getAll(req, res, next) {
        let {limit, page} = req.query
        page = page || 1
        limit = limit || 9
        let offset = page * limit - limit
        const all = await getReportsByUserId(1, limit, offset)
        try {
            res.json(all)
        } catch (e) {
            next(ApiError.badRequest(e.message))
        }

    }


    async getOne(req, res, next) {
        try {
            const { idReport } = req.params;
            if (!idReport || isNaN(parseInt(idReport, 10))) {
                next(ApiError.badRequest("Неверный id отчета"));
            }
            const {reportTrashSource, reportSource} = await getSourceRepByRepId(idReport);
            const data = await fs.promises.readFile(reportSource, 'utf-8');
            const dataTrash = await fs.promises.readFile(reportTrashSource, 'utf-8');

            // Преобразуем в JSON
            const jsonData = JSON.parse(data);
            const jsonDataTrash = JSON.parse(dataTrash);

            // Отправляем JSON-ответ
            return res.json({report:jsonData, trash: jsonDataTrash});
        } catch (e) {
            return next(ApiError.badRequest(e.message));
        }
    }


    async save(req, res, next) {
        try {
            const { idReport } = req.params;
            if (!idReport || isNaN(parseInt(idReport, 10))) {
                next(ApiError.badRequest("Неверный id отчета"));
            }
            const { report, trash } = req.body;
            const { reportTrashSource, reportSource } = await getSourceRepByRepId(idReport);
            if (!(Array.isArray(report) && areAllElementsJSON(report))) {
                return next(ApiError.badRequest('Неверный формат Отчета'));
            }
            if (!(Array.isArray(trash) && areAllElementsJSON(trash))) {
                return next(ApiError.badRequest('Неверный формат Корзины'));
            }


            // Сохраняем JSON данных в файлы
            try {
                await fs.promises.writeFile(reportSource, JSON.stringify(report, null, 2), 'utf-8');
            } catch (e) {
                return next(ApiError.badRequest('Не удалось сохранить JSON Отчета'));
            }

            try {
                await fs.promises.writeFile(reportTrashSource, JSON.stringify(trash, null, 2), 'utf-8');
            } catch (e) {
                return next(ApiError.badRequest('Не удалось сохранить JSON Корзины'));
            }

            // Успешный ответ
            res.status(200).json({ message: 'Данные успешно сохранены' });
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

function getNameFromReports(reports, name) {
    return reports.filter(report=>report.name===name);
}

function isReportExists(callback) {
    return callback.length === 0
}

async function saveRepToDB(report, jsonFileName, jsonOutputPath) {
    const Report = await report.create({name: jsonFileName})
    const reportId = Report.dataValues.idReport;
    const location = path.join(jsonOutputPath, reportId.toString(), 'report')
    const locationTrash = path.join(jsonOutputPath, reportId.toString(), 'trash')
    const srcReport = await Source.create({reportIdReport: reportId, location, locationTrash})
    const userReports = await User_Reports.create({userId: 1, reportIdReport: reportId})
    return {reportId, location, locationTrash}
}

function getFilesInDirectory(directoryPath) {
    try {
        // Читаем содержимое директории
        const files = fs.readdirSync(directoryPath);

        // Возвращаем массив названий файлов
        return files;
    } catch (error) {
        console.error('Ошибка чтения директории:', error);
        return [];
    }
}

// Хелпер для создания директории, если она не существует
function ensureDirExists(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`Директория создана: ${dirPath}`);
    } else {
        console.log(`Директория уже существует: ${dirPath}`);
    }
}

// Хелпер для создания файла, если он не существует
function ensureFileExists(filePath) {
    if (!fs.existsSync(filePath)) {
        fs.writeFileSync(filePath, '{}');
        console.log(`Файл создан: ${filePath}`);
    } else {
        console.log(`Файл уже существует: ${filePath}`);
    }
}

function areAllElementsJSON(array) {
    return array.every(item => {
        // Проверяем, что элемент - объект и не null
        if (typeof item === 'object' && item !== null) {
            try {
                // Пробуем преобразовать объект в строку JSON
                JSON.stringify(item);
                return true;
            } catch (e) {
                return false;
            }
        }
        return false;
    });
}

module.exports = new ReportsController()