"use strict";
var path = require('path');

module.exports = {
    name: 'nav',
    template: path.join(__dirname, 'template.jade'),
    standalone: true,

    process: function(params) {
        var links = [];

        if (params.app.routes) { // express 3.x
            params.app.routes.get.forEach(function(route) {
                links.push(route.path);
            });

        } else { // express 4.x
            var stack = params.app._router.stack;

            // TODO: this probably needs work for multiple routers
            stack.forEach(function(item) {
                var meths;
                if (item.route) {
                    meths = (item.route || {}).methods || {};

                    if (meths.get)
                        links.push(item.route.path);
                }
            });
        }

        return {
            locals: {
                nav: links
            }
        };
    }
};
