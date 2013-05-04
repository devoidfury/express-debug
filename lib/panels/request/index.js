"use strict";
var path = require('path');

module.exports = {
    name: 'request',
    template: path.join(__dirname, 'template.jade'),

    process: function(params) {
        var req = params.req;
        return {
            locals: {
                req: {
                    params:        req.params,
                    body:          req.body,
                    rawBody:       req.rawBody,
                    query:         req.query,
                    files:         req.files,
                    ip:            req.ip,
                    route:         req.route,
                    cookies:       req.cookies,
                    signedCookies: req.signedCookies,
                    httpVersion:   req.httpVersion,
                    headers:       req.headers,
                    trailers:      req.trailers,
                    url:           req.url,
                    method:        req.method,
                    statusCode:    req.statusCode
                }
            }
        };
    }
};