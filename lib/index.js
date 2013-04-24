var path = require('path'),
    fs = require('fs'),
    jade = require('jade'),

    mixin_path = path.join(__dirname, 'templates', 'mixins.jade'),
    template = path.join(__dirname, 'templates', 'toolbar.jade');

var get_injection_location = function(str) {
    var location = str.lastIndexOf('</body');
    if (location === -1) {
        location = str.lastIndexOf('</html');

        if (location === -1) {
            location = null;
        }
    }
    return location;
};

module.exports = function(settings) {
    'use strict';
    var theme = null,
        panels = [],
        cached_panels = {};

    settings = settings || {};
    settings.depth = settings.depth || 4;
    settings.panels = settings.panels || ['locals', 'request', 'session', 'template'];
    settings.extra_panels = settings.extra_panels || [];

    // initialize panels
    settings.panels.concat(settings.extra_panels).forEach(function(panel) {
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

    var debug_render = function(view, options, fn){
        options = options || {};

        var res = this,
            req = this.req,
            app = req.app,

            accept = req.headers.accept || '';

        // support callback function as second arg
        if (typeof options === 'function') {
            fn = options;
            options = {};
        }

        // merge res.locals
        options._locals = res.locals;

        var render_toolbar = function(str, callback) {

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

            jade.renderFile(template, edt_opts, function(err, toolbar) {
                if (err){
                    callback(err);
                } else {
                    var loc = get_injection_location(str);
                    if (loc === null) {
                        str += toolbar;
                    } else {
                        str = str.substring(0, loc) + toolbar + str.substring(loc);
                    }
                    callback(err, str);
                }
            });
        };

        var toolbar_callback = function(err, str){
            if (err) {
                req.next(err);

            // skip if this client req isn't expecting html
            } else if (accept.indexOf('html') === -1) {
                res.send(str);

            } else {
                render_toolbar(str, function(err, str) {
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
    return function(req, res, next) {
        res._EDT_original_render = res.render;
        res.render = debug_render;
        next();
    };
};
