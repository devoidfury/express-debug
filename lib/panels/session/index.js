"use strict";
var path = require('path'),
    xtend = require('xtend');

module.exports = {
    name: 'session',
    template: path.join(__dirname, 'template.jade'),

    process: function(params) {

        var sess = params.req.session || {},
            clean_sess = {};

        if (sess._ctx && sess._ctx._readableState) {
            clean_sess = xtend(sess);
            delete clean_sess._ctx;
        } else {
            clean_sess = sess;
        }

        return {
            locals: {
                session: clean_sess
            }
        };
    }
};