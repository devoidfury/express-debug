"use strict";
var path = require('path'),
    inject = require('./inject'),
    utils = require('../../utils');


module.exports = {
    name: 'profile',
    template: path.join(__dirname, 'template.jade'),

    initialize: function(app) {
        // hijacks early middleware
        // on the first request, these middleware would have already executed
        // and wouldn't be caught on the first request
        inject.middleware_profiler(app);
    },

    handle: function(req) {
        req.EDT.profile = { global: process.hrtime() };
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

    pre_render: function(req) {
        req.EDT.profile.render = {
            hr_start: process.hrtime()
        };
    },

    post_render: function(req) {
        var time = req.EDT.profile.render.hr_start;
        if (time) {
            var diff = process.hrtime(time);
            req.EDT.profile.render = {
                seconds:      diff[0],
                milliseconds: utils.get_ms_from_ns(diff[1])
            };
        }
    },

    process: function (params) {
        var times = params.req.EDT.profile,
            EDT_times;

        var middleware = times.middleware,
            filtered_middleware = [];

        middleware.forEach(function (item) {
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
                global_time: times.global,
                render:      times.render
            }
        };
    }
};
