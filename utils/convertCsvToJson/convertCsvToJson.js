const csv = require("csv-parser");
function convertCsvToJson (stream, callback) {
    const csvData = [];
    const csvStream = require('stream').Readable.from(stream);

    csvStream
        .pipe(csv())
        .on('data', (row) => {
            csvData.push(row);
        })
        .on('end', () => {
            callback(null, csvData);
        })
        .on('error', (err) => {
            callback(err, null);
        });
}
module.exports = convertCsvToJson;