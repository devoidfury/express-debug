"use strict";
var path = require('path'),
    xtend = require('xtend'),
    panels = require('./panels'),
    request = require('./request'),
    response = require('./response');

// default express-debug settings
var defaults = {
    panels: ['locals', 'request', 'session', 'template', 'software_info', 'profile'],
    depth: 4,
    extra_panels: [],
    path: '/express-debug'
};


module.exports = function (app, settings) {
    // initialize settings
    settings = xtend(defaults, settings || {});

    // load and initialize panels
    panels.load(app, settings.panels.concat(settings.extra_panels), settings);

    response.init(app, settings);


    var handle = app.handle;
    app.handle = function (req) {
        req.EDT = {};
        panels.handle(req);
        handle.apply(this, arguments);
    };

    app.use(function EDT(req, res, next) {
        panels.request(req);
        response.patch(res);

        if (settings.path === req.path) {
            // standalone express-debug page
            res.render();
        } else {
            next();
        }
    });


    if (panels.use_requests) {
        // grab raw request body in case of non-JSON/form-data
        app.use(request.rawBody);
    }
};
