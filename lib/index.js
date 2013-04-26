var path = require('path'),
    fs = require('fs'),
    jade = require('jade'),

    utils = require('./utils'),

    mixin_path = path.join(__dirname, 'templates', 'mixins.jade'),
    template = path.join(__dirname, 'templates', 'toolbar.jade'),

    injected_profiler = false;


var inject_middleware_profiler = function (app) {

    // global request timer, only do this the first time we inject
    if (!injected_profiler) {
        var handle = app.handle;

        app.handle = function (req) {
            req.EDT_start = process.hrtime();
            handle.apply(this, arguments);
        }
    }

    for (var i = 0; i < app.stack.length; i++) {
        if (app.stack[i].handle.name === 'EDT' || app.stack[i].EDT) {
            continue; // skip the early bits we already covered
        }
        (function () {
            var current = i,
                original = app.stack[current].handle;

            app.stack[current].EDT = true;
            app.stack[current].original = original,
                app.stack[current].handle = function () {
                    var args = Array.prototype.slice.apply(arguments),
                        next = args[2],
                        req = args[0],
                        time = {
                            start:  Date.now(),
                            action: app.stack[current]
                        };

                    req.EDT_middleware_times = req.EDT_middleware_times || [];
                    req.EDT_middleware_times[current] = time;

//              hijack 'next' function
                    args[2] = function () {
                        var diff = process.hrtime(time.hr_start);
                        time.time = {
                            seconds: diff[0],
                            milliseconds: utils.get_ms_from_ns(diff[1])
                        };
                        delete time.hr_start;
                        // end profiling
                        next.apply(this, arguments);
                    };

                    // begin profiling
                    time.start = Date.now();
                    time.hr_start = process.hrtime();
                    original.apply(this, args);
                }

        })();
    }

};

module.exports = function (app, settings) {
    'use strict';
    var theme = null,
        panels = [],
        cached_panels = {};

    if (app && !settings && !app.stack) {
        settings = app;
        app = null;
    }

    settings = settings || {};
    settings.depth = settings.depth || 4;
    settings.panels = settings.panels || ['locals', 'request', 'session', 'template'];
    settings.extra_panels = settings.extra_panels || [];

    settings.use_profiler = !!app;

    // inject into the early middleware as we can't do it in the middle of execution later
    if (settings.use_profiler) {
        settings.panels.push('profile');
        inject_middleware_profiler(app);
    }

    // initialize panels
    settings.panels.concat(settings.extra_panels).forEach(function (panel) {
        if (typeof panel === 'string') {
            try {
                var tmp = require('./panels/' + panel);
                panels.push(tmp)
            } catch (e) {
                console.error('EDT: Error loading builtin panel ' + panel, e);
            }
        } else if (typeof panel === 'function') {
            panels.push(panel);
        }
    });

    // user-supplied css
    if (settings.theme) {
        try {
            theme = fs.readFileSync(settings.theme, 'utf-8');
        } catch (e) {
            console.error('EDT: error loading css file at ' + settings.theme);
            console.error('please check that the path is correct. Err: ', e);
        }
    }

    var debug_render = function (view, options, fn) {
        options = options || {};

        var res = this,
            req = this.req,
            app = req.app,
            accept = req.headers.accept || '';

        if (settings.use_profiler) {
            var last_route = req.EDT_middleware_times[req.EDT_middleware_times.length - 1];
            var diff = process.hrtime(req.EDT_start);

            req.EDT_req_time = {
                seconds: diff[0],
                milliseconds: utils.get_ms_from_ns(diff[1])
            };

            if (!last_route.time) {
                var last_route_diff = process.hrtime(last_route.hr_start);

                last_route.time = {
                    seconds: last_route_diff[0],
                    milliseconds: utils.get_ms_from_ns(last_route_diff[1])
                };
                delete last_route.hr_start;
            }
        }

        // support callback function as second arg
        if (typeof options === 'function') {
            fn = options;
            options = {};
        }

        // merge res.locals
        options._locals = res.locals;

        var render_toolbar = function (str, callback) {

            var panel_opts = {
                locals: options,
                app:    app,
                res:    res,
                req:    req,
                view:   view
            };
            var edt_opts = {
                EDTsettings: settings,
                panels:      [],
                theme:       theme,
                req:         req
            };
            panels.forEach(function(panel) {
                var result = panel(panel_opts);

                if (!cached_panels[result.template]) {
                    var tmpl = fs.readFileSync(result.template, 'utf-8');

                    tmpl = 'include ' + path.relative(path.dirname(result.template), mixin_path) + '\n\n' + tmpl;
                    cached_panels[result.template] = jade.compile(tmpl, {filename: result.template});
                }
                result.locals.EDTsettings = settings;

                edt_opts.panels.push({
                    html: cached_panels[result.template](result.locals),
                    name: result.name
                });
            });

            jade.renderFile(template, edt_opts, function (err, toolbar) {
                callback(err, err ? undefined : utils.inject_toolbar(str, toolbar));
            });
        };

        var toolbar_callback = function (err, str) {
            if (err) {
                req.next(err);

                // skip if this client req isn't expecting html
            } else if (accept.indexOf('html') === -1) {
                res.send(str);

            } else {
                render_toolbar(str, function (err, str) {
                    // keep existing callback if one was passed
                    if (typeof fn === 'function') {
                        fn(err, str);
                    } else if (err) {
                        req.next(err);
                    } else {
                        res.send(str);
                    }
                });
            }
        };

        // inject toolbar callback into render callback
        this._EDT_original_render.apply(this, [view, options, toolbar_callback]);
    };

    // actual middleware function
    return function EDT(req, res, next) {
        if (settings.use_profiler && !injected_profiler) {
            injected_profiler = true;
            // inject into the later middleware, on first request
            inject_middleware_profiler(req.app);
        }
        res._EDT_original_render = res.render;
        res.render = debug_render;
        next();
    };
};
