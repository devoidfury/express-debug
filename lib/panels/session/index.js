var path = require('path');

module.exports = function(params) {
    return {
        name: 'session',
        template: path.join(__dirname, 'template.jade'),
        locals: {
            session: params.req.session || {}
        }
    };
};