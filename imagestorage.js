var fs = require('fs')
var sharp = require("sharp")
var uuid = require("uuid")

function getDestination(req, file, cb) {
    cb(null, '/dev/null')
}

function ImageStorage() { }

ImageStorage.prototype._handleFile = function _handleFile(req, file, cb) {
    file.filename = uuid.v4()
    const path = "uploads/" + file.filename

    var pngConverter = sharp()
        .resize(500, 500)
        .png()
    pngConverter.on('error', cb)

    var outStream = fs.createWriteStream(path)
    outStream.on('error', cb)
    outStream.on('finish', function () {
        cb(null, {
            path: path,
            size: outStream.bytesWritten
        })
    })

    file.stream
        .pipe(pngConverter)
        .pipe(outStream)
}

ImageStorage.prototype._removeFile = function _removeFile(req, file, cb) {
    fs.unlink(file.path, cb)
}

module.exports = function (opts) {
    return new ImageStorage(opts)
}