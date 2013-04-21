module.exports = function(settings) {
    var jade = require('jade'),
        path = require('path'),
        fs = require('fs'),
        template = path.join(__dirname, 'toolbar.jade');

    settings = settings || {};
    settings.depth = settings.depth || 4;
    settings.environments = settings.environments || ['development'];

    var debug_render = function(view, options, fn){
        options = options || {};

        var self = this,
            req = this.req,
            app = req.app;

        // support callback function as second arg
        if (typeof options === 'function') {
            fn = options;
            options = {};
        }

        // merge res.locals
        options._locals = self.locals;

        var render_toolbar = function(str, location, callback) {

            var view_dir = app.locals.settings.views;

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
            var opts = {
                res_locals: options,
                app_locals: app.locals,
                template_name: view,
                template: fs.readFileSync(path.join(view_dir, view), 'utf8'),
                req: req,
                req_safe: req_safe,
                settings: settings
            };

            jade.renderFile(template, opts, function(err, toolbar) {
                if (err)
                    return callback(err);

                if (location === undefined)
                    return callback(err, str + toolbar);

                callback(err, str.substring(0, location - 1) + toolbar + str.substring(location));
            });
        };

        var toolbar_callback = function(err, str){
            if (err) return req.next(err);

            // only continue if this looks like html
            if (req.headers['accept'].indexOf('html') === -1)
                return self.send(str);

            var body_location = str.lastIndexOf('</body'),
                html_location = str.lastIndexOf('</html'),
                location;

            if (body_location !== -1) location = body_location;
            else if (html_location !== -1) location = html_location;

            render_toolbar(str, location, function(err, str) {
                // keep existing callback if one was passed
                if (typeof fn === 'function') return fn(err, str);
                if (err) return req.next(err);
                self.send(str);
            });
        };

        // inject toolbar callback into render callback
        this._EDT_original_render.apply(this, [view, options, toolbar_callback]);
    };

    // actual middleware function
    return function(req, res, next) {
        if (settings.environments.indexOf(res.app.locals.settings.env) !== -1) {
            res._EDT_original_render = res.render;
            res.render = debug_render;
        }
        next();
    }
};