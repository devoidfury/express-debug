"use strict";
var path = require('path'),
    fs = require('fs');

var isAbsolute = function(path) {
    return ('/' === path[0]) || (':' === path[1] && '\\' === path[2]);
};

// handle 'view engine' express directive
var getPath = function(view, root, default_engine) {
    if (Array.isArray(root)) {
        // iterate over array and fs stat the view
        for (var i = 0; i < root.length; i++) {
            var maybeView = path.join(root[i], view)
            if (!path.isAbsolute(maybeView)) {
                maybeView = path.join(root, maybeView)
            }
            try {
                var stat = fs.statSync(maybeView)
                view = maybeView;
                break;
            } catch (e) {
                // empty on purpose
            }
        }
    }

    var ext = path.extname(view);
    if (!ext) {
        view += (default_engine[0] !== '.' ? '.' : '') + default_engine;
    }
    return view;
};

module.exports = {
    name: 'template',
    template: path.join(__dirname, 'template.jade'),

    process: function(params) {
        var view_template;

        var view_template_path = getPath(
            params.view,
            params.app.locals.settings.views,
            params.app.locals.settings['view engine'] || ''
        );

        try {
            view_template = fs.readFileSync(view_template_path, 'utf-8');
        } catch (e) {
            console.error('EDT: error loading ' + params.view + ' template: ', e);
            view_template = 'Could not load template.';
        }

        return {
            locals: {
                template_name: params.view,
                template: view_template
            }
        };
    }
};
