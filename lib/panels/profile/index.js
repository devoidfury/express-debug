var path = require('path'),
    inject = require('./inject');

module.exports = {
    name: 'profile',
    template: path.join(__dirname, 'template.jade'),

    initialize: function(app) {
        inject.app_handler(app);
        inject.middleware_profiler(app);
    },

    request: function(req) {
        inject.middleware_profiler(req.app);
        inject.param_handlers(req.app);
        inject.route_profiler(req.app);
    },

    finalize: inject.finalize,

    process: function (params) {
        var times = params.req.EDT;

        var middleware = times.middleware,
            filtered_middleware = [],
            EDT_times;

        middleware.forEach(function (item, i) {
            delete item.action.EDT;
            if (item.action.handler.name === 'EDT') {
                EDT_times = item;
            } else {
                filtered_middleware.push(item);
            }
        });

        if (EDT_times) { // remove EDT toolbar time from total
            times.global[0] -= EDT_times[0];
            times.global[1] -= EDT_times[1];
        }

        return {
            locals:   {
                middleware:  filtered_middleware,
                params:      times.param || [],
                routes:      times.route || [],
                global_time: times.global
            }
        };
    }
};