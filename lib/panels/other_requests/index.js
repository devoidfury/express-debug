"use strict";
var path = require('path'),
    requests = require('../../request.js');


module.exports = {
    name: 'other requests',
    template: path.join(__dirname, 'template.jade'),
    standalone: true,
    use_requests: true,

    process: function(params) {
        return {
            locals: {
                requests: requests.list()

            }
        };
    }
};