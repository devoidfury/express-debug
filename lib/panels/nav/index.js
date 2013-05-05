"use strict";
var path = require('path');

module.exports = {
    name: 'nav',
    template: path.join(__dirname, 'template.jade'),
    standalone: true,

    process: function(params) {
        var routes = params.app.routes.get,
            links = [];

        routes.forEach(function(route) {
            links.push(route.path);
        });
        return {
            locals: {
                nav:links
            }
        };
    }
};
