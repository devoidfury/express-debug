"use strict";
var panels = module.exports,
    path = require('path'),
    jade = require('jade'),
    fs = require('fs'),
    loaded_panels = [],

    hooks = {
        handle: [], // need to run a request initializer per request (beginning of request, minimal functionality)
        request: [], // need to run a request initializer per request (EDT middleware time, more functionality)
        finalize: [], // need to run a request finalizer per request
        pre_render: [], // pre-render per request (after finalize)
        post_render: [] // post-render per request
    },

    // compiled jade templates
    cached_panels = {};

panels.use_requests = false;

panels.load = function(app, _panels, settings) {
    settings.mixin_path = path.resolve(path.join(__dirname, '..', 'templates', 'mixins.jade'));

    _panels.forEach(function (panel) {
        // builtins
        if (typeof panel === 'string') {
            try {
                var tmp = require('./' + panel);
                loaded_panels.push(tmp)
            } catch (e) {
                console.error('EDT: Error loading builtin panel ' + panel, e);
            }

        // custom panels
        } else if (typeof panel === 'object') {
            loaded_panels.push(panel);
        }
    });

    loaded_panels.forEach(function (panel) {
        // initialize panels if they need it
        panel.initialize && panel.initialize(app);

        // keep track of requests if we need to
        panels.use_requests = panels.use_requests || panel.use_requests;

        // compile the templates with mixins injected
        var tmpl = fs.readFileSync(panel.template, 'utf-8');
        tmpl = 'include ' + path.relative(path.dirname(panel.template), settings.mixin_path) + '\n\n' + tmpl;
        cached_panels[panel.template] = jade.compile(tmpl, {filename: panel.template});

        // prepare request hooks
        Object.keys(hooks).forEach(function (key) {
            panel[key] && hooks[key].push(panel);
        });
    });
};

// hook runner factory
var hook_handle = function(key) {
    var hook = hooks[key];
    return function(req) {
        for (var i = 0; i < hook.length; i++) {
            hook[i][key](req);
        }
    }
};

panels.handle = hook_handle('handle');
panels.request = hook_handle('request');
panels.finalize = hook_handle('finalize');
panels.pre_render = hook_handle('pre_render');
panels.post_render = hook_handle('post_render');

panels.render = function(locals, settings, standalone) {
    var rendered = [];

    for (var i = 0; i < loaded_panels.length; i++) {
        var panel = loaded_panels[i];

        // if standalone page, skip some irrelevant panels
        if (!standalone || panel.standalone === true) {

            // main panel function
            var result = panel.process(locals);

            // tack on settings for settings like object depth
            result.locals.EDTsettings = settings;

            rendered.push({
                html: cached_panels[panel.template](result.locals),
                name: panel.name
            });
        }
    }

    return rendered;
};
