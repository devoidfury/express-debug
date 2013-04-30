"use strict";
var path = require('path'),
    xtend = require('xtend'),
    panels = require('./panels'),
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

    // set up response patch
    response.init(app, settings);

    // actual middleware function
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
};
