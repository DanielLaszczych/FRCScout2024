var fs = require('fs');

module.exports = function (app) {
    fs.readdirSync(__dirname).forEach(function (file) {
        if (file == 'index.js') return;
        var name = file.substring(0, file.indexOf('.'));
        if (require('./' + name).router) {
            app.use('/' + name, require('./' + name).router);
        } else {
            app.use('/' + name, require('./' + name));
        }
    });
};
