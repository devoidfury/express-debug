"use strict";
var path = require('path');

var EXCLUDE = ['_readableState', 'socket', 'connection', 'client', 'res',
    'session', 'sessionCookies', '_events', '_maxListeners', '_pendings',
    '_pendingIndex', '_consuming', '_dumped'];

module.exports = {
    name: 'request',
    template: path.join(__dirname, 'template.jade'),

    process: function(params) {
        var req = params.req;

        var clean_req = {};

        Object.keys(req).forEach(function(key) {
            if (EXCLUDE.indexOf(key) === -1 && typeof req[key] !== 'function')
                clean_req[key] = req[key];
        });

        return {
            locals: {
                req: clean_req
            }
        };
    }
};