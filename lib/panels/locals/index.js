var path = require('path');

module.exports = function(params) {
    return {
        name: 'locals',
        template: path.join(__dirname, 'template.jade'),
        locals: {
            res_locals: params.locals,
            app_locals: params.app.locals
        }
    };
};