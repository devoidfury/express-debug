"use strict";
var panels = require('./panels'),
    requests = [],
    request = module.exports = {};

request.add = function(req, args) {
    panels.finalize(req);

    var data = {
        body:  req.body,
        query: req.query,
        method: req.method,
        path: req.path,
        locals: req.res.locals,
        send_args: args,
        req_headers: req.headers,
        res_headers: req.res.headers
    };
    requests.push(JSON.stringify(data));
    data = null;
};

request.list = function(index) {
    index = index || 0;

    return requests.slice(index, requests.length);
};

request.clear = function(index) {
    requests = requests.slice(index, requests.length)
};