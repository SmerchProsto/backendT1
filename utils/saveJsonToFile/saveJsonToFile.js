const fs = require('fs');
const path = require('path');
const saveJsonToFile = (jsonData, outputPath, callback) => {
    fs.writeFile(outputPath, JSON.stringify(jsonData, null, 2), (err) => {
        if (err) {
            console.error('Ошибка записи JSON:', err);
            return callback(err);
        }
        callback(null, `JSON успешно сохранён под именем ${path.basename(outputPath)}`);
    });
};

module.exports = saveJsonToFile;