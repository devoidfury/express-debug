var path = require('path');

module.exports = function (params) {
    var middleware = params.req.EDT_middleware_times,
        filtered_middleware = [],
        global_time = params.req.EDT_req_time,
        EDT_times;

    middleware.forEach(function(item) {
        delete item.action.EDT;
        if (item.action.original.name === 'EDT') {
            EDT_times = item;
        } else {
            filtered_middleware.push(item);
        }
    });

    if (EDT_times) { // remove EDT toolbar time from total
        global_time[0] -= EDT_times[0];
        global_time[0] -= EDT_times[1];
    }

    return {
        name:     'profile',
        template: path.join(__dirname, 'template.jade'),
        locals:   {
            middleware: filtered_middleware,
            global_time: params.req.EDT_req_time
        }
    };
};