"use strict";
var path = require('path');

module.exports = {
    name: 'locals',
    template: path.join(__dirname, 'template.jade'),
    standalone: true,

    process: function(params) {
        return {
            locals: {
                res_locals: params.locals,
                app_locals: params.app.locals
            }
        };
    }
};