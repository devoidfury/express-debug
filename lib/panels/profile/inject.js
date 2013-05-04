"use strict";
var injections = module.exports,
    utils = require('../../utils'),
    _EDT_HIDDEN = { EDT_hidden: true };

var ProfileTime = function(action, name) {
    this.action = action;
    this.name = name;
};
ProfileTime.prototype.toJSON = function() {
    var str = this.name + ' fn() { args: ' + this.action.handler.length;
    str += ', name: ' + this.action.handler.name + ' }';
    str += ' Time: ' + (this.time.seconds * 1000 + this.time.milliseconds).toFixed(2) + 'ms';
    return str;
};

var hijack = function(original, action, time_name) {
    // returns a wrapper that will replace any middleware/route function
    // following the pattern of 'function(req, x, next[, ...])'
    return function() {
        var args = Array.prototype.slice.apply(arguments),
            next = args[2],
            req = args[0],

            times = req.EDT.profile[time_name] = req.EDT.profile[time_name] || [],
            time = new ProfileTime(action, time_name + ' #' + times.length);

        times[times.length] = time;

        args[2] = function (err) {
            if (!time.time) {
                // end profiling
                var diff = process.hrtime(time.hr_start);
                time.time = {
                    seconds:      diff[0],
                    milliseconds: utils.get_ms_from_ns(diff[1])
                };
                delete time.hr_start;
            }
            next.apply(this, arguments);
        };

        // begin profiling
        time.hr_start = process.hrtime();
        original.apply(this, args);
    };
};

// global request timer

injections.middleware_profiler = function (app) {
    var stack = app.stack,
        original;

    for (var i = 0; i < stack.length; i++) {
        // skip middleware already covered, also
        // middleware with 4 params is error handling, do not wrap
        if (!stack[i].handler && stack[i].handle.length < 4) {

            original = stack[i].handle;
            stack[i].handler = original;

            stack[i].handle = hijack(original, stack[i], 'middleware');
            stack[i].handle.EDT_hidden = true;
        }
    }
};

injections.param_handlers = function (app) {
    var params = app._router.params,
        flat_params = [];

    Object.keys(params).forEach(function (key) {
        var key_params = utils.flatten(params[key]).map(function (item) {
            item.key = key;
            return item;
        });
        flat_params = flat_params.concat(key_params);
    });
    flat_params.forEach(function (fn) {
        var parent = fn.EDT_parent,
            i = fn.EDT_index;
        // skip already hijacked params
        if (!parent[i].EDT) {
            parent[i].EDT_hidden = true;
            parent[i] = hijack(fn, { param: fn.key, action: fn }, 'param');
            parent[i].EDT = _EDT_HIDDEN;
        }
    });
};

injections.route_profiler = function(app) {
    Object.keys(app.routes).forEach(function(method) {
        var routes = app.routes[method];

        routes.forEach(function(rt) {
            var current = utils.flatten(rt.callbacks);

            current.forEach(function (cb) {
                var parent = cb.EDT_parent,
                    i = cb.EDT_index;

                if (!parent[i].EDT) {
                    parent[i].EDT_hidden = true;

                    var action = { method: method, route: rt.path, handler: cb };

                    parent[i] = hijack(cb, action, 'route');
                    parent[i].EDT = _EDT_HIDDEN;
                }
            });
        });
    })
};

// close any open 'timers'
injections.finalize = function(req) {
    var now = process.hrtime(),
        times = req.EDT.profile;
    times.global = {
        seconds:      now[0] - times.global[0],
        milliseconds: utils.get_ms_from_ns(now[1] - times.global[1])
    };
    times.global.toJSON = function() {
        return 'Time: ' + (this.seconds * 1000 + this.milliseconds).toFixed(2) + 'ms';
    };

    Object.keys(times).forEach(function(type) {
        if (times[type] instanceof Array) {
            times[type].forEach(function (profile) {
                if (!profile.time) {
                    profile.time = {
                        seconds:      now[0] - profile.hr_start[0],
                        milliseconds: utils.get_ms_from_ns(now[1] - profile.hr_start[1])
                    };
                    delete profile.hr_start;
                }
            });
        }
    });
};
