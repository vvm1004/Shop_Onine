const fs = require('fs');

const deleteFile = (filePath) => {
    fs.unlink(filePath, (err) => {
        if (err) {
            console.error(err); // Ghi lỗi ra console
        }
    });
}

exports.deleteFile = deleteFile;
