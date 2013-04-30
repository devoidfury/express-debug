"use strict";
var path = require('path');

module.exports = {
    name: 'session',
    template: path.join(__dirname, 'template.jade'),

    process: function(params) {
        return {
            locals: {
                session: params.req.session || {}
            }
        };
    }
};