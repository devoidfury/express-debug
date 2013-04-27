"use strict";

var path = require('path'),
    fs = require('fs'),
    jade = require('jade'),

    utils = require('./utils'),
    panels = require('./panels'),
    inject = require('./panels/profile/inject'),

    template = path.join(__dirname, 'templates', 'toolbar.jade');


module.exports = function (app, settings) {
    var theme = null;

    if (app && !settings && !app.stack) {
        settings = app;
        app = null;
    }

    settings = settings || {};
    settings.depth = settings.depth || 4;
    settings.panels = settings.panels || ['locals', 'request', 'session', 'template'];
    settings.extra_panels = settings.extra_panels || [];
    settings.mixin_path = path.join(__dirname, 'templates', 'mixins.jade');

    settings.use_profiler = !!app;

    // inject into the early middleware as we can't do it in the middle of execution later
    if (app) {
        settings.panels.push('profile');
    }

    // load and initialize panels
    panels.load(app, settings.panels.concat(settings.extra_panels), settings);

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

        panels.finalize(req);

        // support callback function as second arg
        if (typeof options === 'function') {
            fn = options;
            options = {};
        }

        // merge res.locals
        options._locals = res.locals;

        var render_toolbar = function (str, callback) {
            var opts = {
                EDTsettings: settings,
                theme:       theme,
                req:         req,
                panels:      panels.render({
                    locals: options,
                    app:    app,
                    res:    res,
                    req:    req,
                    view:   view
                }, settings)
            };

            jade.renderFile(template, opts, function (err, toolbar) {
                callback(err, err ? undefined : utils.inject_toolbar(str, toolbar));
            });
        };

        var toolbar_callback = function (err, str) {
            if (err) {
                console.log(err);
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
        panels.request(req);

        res._EDT_original_render = res.render;
        res.render = debug_render;
        next();
    };
};
