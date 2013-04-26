var path = require('path');

module.exports = function (params) {
    var middleware = params.req.EDT_middleware_times;

    middleware.forEach(function(item) {
        delete item.action.EDT;
    });

    return {
        name:     'profile',
        template: path.join(__dirname, 'template.jade'),
        locals:   {
            middleware: middleware,
            global_time: params.req.EDT_req_time
        }
    };
};