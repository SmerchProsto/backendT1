const fs = require('fs');
const path = require('path');

// Функция для проверки наличия папки и создания её, если её нет
const createDirectoryIfPathNotFound = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

module.exports = createDirectoryIfPathNotFound;
