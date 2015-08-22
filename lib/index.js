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
    path: '/express-debug',
    extra_attrs: '',
    sort: false
};


module.exports = function (app, settings) {
    // initialize settings
    settings = xtend(defaults, settings || {});


    response.init(app, settings);

    var handle = app.handle;
    app.handle = function (req) {
        req.EDT = {};
        panels.handle(req);
        handle.apply(this, arguments);
    };
    // we need to carefully insert EDT at the correct location in the
    // middleware stack to maintain all functionality

    // express 3
    var connectr;
    if (app.stack) {
        connectr = require('connectr')(app);

    } else {
        // express 4

        if (!app.lazyrouter) {
            throw new Error('this version of express is not supported. ' +
                'Please raise an issue on express-debug github page')
        }
        app.lazyrouter();

        if (!app._router) {
            throw new Error('this version of express is not supported. ' +
                'Please raise an issue on express-debug github page')
        }

        connectr = require('connectr')(app);
        connectr.stack = app._router.stack;
    }

    // load and initialize panels
    panels.load(app, settings.panels.concat(settings.extra_panels), settings);

    connectr.index(1).as('express');

    connectr.after('express').use(function EDT(req, res, next) {
        panels.request(req);
        response.patch(res);

        if (settings.path === req.path) {
            // standalone express-debug page
            res.render();
        } else {
            next();
        }
    }).as('express-debug');


    if (panels.use_requests) {
        // grab raw request body in case of non-JSON/form-data
        connectr.after('express-debug').use(request.rawBody);
    }
};
