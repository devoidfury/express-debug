"use strict";
var panels = require('./panels'),
    requests = [],
    request = module.exports = {};

request.add = function(req, args) {
    panels.finalize(req);

    if (panels.use_requests) {
        var data = {
            body:        Object.keys(req.body).length ? req.body : req.rawBody,
            query:       Object.keys(req.query).length ? req.query : undefined,
            method:      req.method,
            path:        req.path,
            locals:      req.res.locals,
            send_args:   args,
            req_headers: req.headers,
            res_headers: req.res._headers,
            panels:      req.EDT
        };
        // break any references
        requests.push(JSON.parse(JSON.stringify(data)));
        data = null;
    }
};

request.list = function(index) {
    index = index || 0;

    return requests.slice(index, requests.length);
};

request.clear = function(index) {
    requests = requests.slice(index, requests.length)
};

request.rawBody = function (req, res, next) {
    var data = '';
    req.setEncoding('utf8');
    req.on('data', function (chunk) { data += chunk; });
    req.on('end', function () { req.rawBody = data || undefined; });
    next();
};
