var panels = module.exports,
    path = require('path'),
    jade = require('jade'),
    fs = require('fs'),
    loaded_panels = [],

    // panels that need to run a request initializer per request
    request_panels = [],

    // panels that need to run a request finalizer per request
    finalize_panels = [],

    // compiled templates
    cached_panels = {};


panels.load = function(app, panels, settings) {
    settings.mixin_path = path.resolve(path.join(__dirname, '..', 'templates', 'mixins.jade'));

    panels.forEach(function (panel) {
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
        if (panel.initialize) {
            panel.initialize(app);
        }

        // compile the templates with mixins injected
        var tmpl = fs.readFileSync(panel.template, 'utf-8');
        tmpl = 'include ' + path.relative(path.dirname(panel.template), settings.mixin_path) + '\n\n' + tmpl;
        cached_panels[panel.template] = jade.compile(tmpl, {filename: panel.template});
    });


    loaded_panels.forEach(function (panel) {
        if (panel.request) {
            request_panels.push(panel);
        }
    });

    loaded_panels.forEach(function (panel) {
        if (panel.finalize) {
            finalize_panels.push(panel);
        }
    });
};

panels.request = function (req) {
    for (var i = 0; i < request_panels.length; i++) {
        request_panels[i].request(req);
    }
};

panels.finalize = function(req) {
    for (var i = 0; i < finalize_panels.length; i++) {
        finalize_panels[i].finalize(req);
    }
};

panels.render = function(locals, settings, standalone) {
    var rendered = [];

    for (var i = 0; i < loaded_panels.length; i++) {
        var panel = loaded_panels[i];


        if (!standalone || panel.standalone === true) {
            var result = panel.process(locals);

            result.locals.EDTsettings = settings;

            rendered.push({
                html: cached_panels[panel.template](result.locals),
                name: panel.name
            });
        }

    }

    return rendered;
};