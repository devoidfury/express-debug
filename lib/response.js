"use strict";
var fs = require('fs'),
    path = require('path'),
    jade = require('jade'),

    utils = require('./utils'),
    panels = require('./panels'),
    request = require('./request'),

    response = module.exports = {},

    template = path.join(__dirname, 'templates', 'toolbar.jade'),
    fullpage = path.join(__dirname, 'templates', 'page.jade');



response.init = function(app, settings) {
    var theme = null;

    // user-supplied css
    if (settings.theme) {
        try {
            theme = fs.readFileSync(settings.theme, 'utf-8');
        } catch (e) {
            console.error('EDT: error loading css file at ' + settings.theme);
            console.error('please check that the path is correct. Err: ', e);
        }
    }

    // replaces res.render and injects express-debug toolbar
    var render = function (view, options, fn) {
        options = options || {};

        var res = this,
            req = this.req,
            app = this.app,
            accept = req.headers.accept || '';


        var finalize = function (err, str) {
            // keep existing callback if one was passed
            if (typeof fn === 'function') {
                fn(err, str);
            } else if (err) {
                req.next(err);
            } else {
                res.send(str);
            }
        };

        panels.finalize(req);

        // support callback function as second arg
        if (typeof options === 'function') {
            fn = options;
            options = {};
        }

        // merge res.locals
        options._locals = res.locals;

        var render_toolbar = function (str, callback) {
            var standalone = settings.path === req.path;
            var opts = {
                EDTsettings: settings,
                theme:       theme,
                req:         req,
                standalone:  standalone,
                extra_attrs: settings.extra_attrs,
                panels:      panels.render({
                    locals: options,
                    app:    app,
                    res:    res,
                    req:    req,
                    view:   view
                }, settings, standalone)
            };

            jade.renderFile(template, opts, function (err, toolbar) {
                callback(err, err ? undefined : utils.inject_toolbar(str, toolbar));
            });
        };

        var toolbar_callback = function (err, str) {
            panels.post_render(req);

            if (err) {
                console.log(err);
                req.next(err);

                // skip if this client req isn't expecting html or is ajax
            } else if (accept.indexOf('html') === -1 ||  req.xhr) {
                res.send(str);

            } else if (res.EDT_rendered) {
                // if callback method was used, more than one template may be rendered.
                // in this care, do not render another copy
                // TODO: see if we can catch this on the last render, and attach it in .send instead
                finalize(err, str);

            } else {
                res.EDT_rendered = true;
                render_toolbar(str, finalize);
            }
        };

        panels.pre_render(req);
        if (req.path.indexOf(settings.path) === 0) {
            // standalone mode
            jade.renderFile(fullpage, function (err, str) {
                toolbar_callback(err, str);
            });

        } else {
            // inject toolbar callback into render callback
            res._EDT_orig_render.call(res, view, options, toolbar_callback);
        }
    };

    var send = function() {
        if (this.EDT_rendered !== true) {
            request.add(this.req, arguments);
        }
        this._EDT_orig_send.apply(this, arguments);
    };

    response.patch = function(res) {
        res._EDT_orig_render = res.render;
        res.render = render;
        res._EDT_orig_send = res.send;
        res.send = send;
    }
};