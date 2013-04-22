module.exports = function(settings) {
    'use strict';
    var jade = require('jade'),
        path = require('path'),
        fs = require('fs'),
        template = path.join(__dirname, 'toolbar.jade');

    settings = settings || {};
    settings.depth = settings.depth || 4;


    var isAbsolute = function(path){
        return ('/' === path[0]) || (':' === path[1] && '\\' === path[2]);
    };
    var getPath = function(view, root, default_engine) {
        if (!isAbsolute(view)) {
            view = path.join(root, view);
        }

        var ext = path.extname(view);
        if (!ext) {
            view += (default_engine[0] !== '.' ? '.' : '') + default_engine;
        }
        return view;
    };

    var debug_render = function(view, options, fn){
        options = options || {};

        var self = this,
            req = this.req,
            app = req.app,

            accept = req.headers.accept || '';

        // support callback function as second arg
        if (typeof options === 'function') {
            fn = options;
            options = {};
        }

        // merge res.locals
        options._locals = self.locals;

        var render_toolbar = function(str, loc, callback) {


            // req contains a lot of circular references and functions
            // we don't need to see, so only grab relevant info for display
            var req_safe = {
                params: req.params,
                body: req.body,
                query: req.query,
                files: req.files,
                ip: req.ip,
                route: req.route,
                cookies: req.cookies,
                signedCookies: req.signedCookies,
                httpVersion: req.httpVersion,
                headers: req.headers,
                trailers: req.trailers,
                url: req.url,
                method: req.method,
                statusCode: req.statusCode
            };

            var view_template_path = getPath(
                view,
                app.locals.settings.views,
                app.locals.settings['view engine'] || ''
            );

            var view_template;

            try {
                view_template = fs.readFileSync(view_template_path, 'utf-8');
            } catch (e) {
                console.error('EDT: error loading ' + view + ' template: ', e);
                view_template = 'Could not load template.';
            }

            var opts = {
                res_locals: options,
                app_locals: app.locals,
                template_name: view,
                template: view_template,
                req: req,
                req_safe: req_safe,
                settings: settings
            };

            jade.renderFile(template, opts, function(err, toolbar) {
                if (err){
                    callback(err);
                } else {
                    str = (loc === undefined) ? str + toolbar :
                        str.substring(0, loc - 1) + toolbar + str.substring(loc);
                    callback(err, str);
                }
            });
        };

        var toolbar_callback = function(err, str){
            if (err) {
                req.next(err);

            // only continue if this looks like html
            } else if (accept.indexOf('html') !== -1) {

                var body_location = str.lastIndexOf('</body'),
                    html_location = str.lastIndexOf('</html'),
                    location;

                if (body_location !== -1) {
                    location = body_location;
                } else if (html_location !== -1) {
                    location = html_location;
                }

                render_toolbar(str, location, function(err, str) {
                    // keep existing callback if one was passed
                    if (typeof fn === 'function') {
                        fn(err, str);
                    } else if (err) {
                        req.next(err);
                    } else {
                        self.send(str);
                    }
                });

            } else {
                self.send(str);
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