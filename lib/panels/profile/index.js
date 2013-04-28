var path = require('path'),
    inject = require('./inject');

module.exports = {
    name: 'profile',
    template: path.join(__dirname, 'template.jade'),

    initialize: function(app) {
        // starts req timer, sets up req.EDT for other injections
        inject.app_handler(app);

        // hijacks early middleware
        // on the first request, these middleware would have already executed
        // and wouldn't be caught on the first request
        inject.middleware_profiler(app);
    },

    request: function(req) {
        // run these per request, as some may do dynamic route changes
        // because the route internals are public
        // the injector marks hijacked functions, so anything already wrapped
        // will be skipped quickly
        inject.middleware_profiler(req.app);
        inject.param_handlers(req.app);
        inject.route_profiler(req.app);
    },

    // ends all open req and fn timers (done before rendering for accuracy)
    finalize: inject.finalize,

    process: function (params) {
        var times = params.req.EDT,
            EDT_times;

        var middleware = times.middleware,
            filtered_middleware = [];

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