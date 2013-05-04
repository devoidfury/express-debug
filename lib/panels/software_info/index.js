"use strict";
var path = require('path'),
    fs = require('fs'),

    version_info = {};

// get parent dir of express-debug (should be node_modules)
var node_modules = path.resolve(path.join(__dirname, '..', '..', '..', '..'));

fs.readdirSync(node_modules).forEach(function(dir) {
    try {
        var str = fs.readFileSync(path.join(node_modules, dir, 'package.json')),
            tmp = JSON.parse(str),
            info = { version: tmp.version };

        // doing this to keep undefined keys off of the list
        if (tmp.author) { info.author = tmp.author; }
        if (tmp.dependencies) { info.dependencies = tmp.dependencies }
        if (tmp.devDependencies) { info.devDependencies = tmp.devDependencies }
        if (tmp.repository) { info.repository = tmp.repository }
        if (tmp.homepage) { info.homepage = tmp.homepage }
        if (tmp.bugs) { info.bugs = tmp.bugs }
        if (tmp.license) { info.license = tmp.license }
        if (tmp.licenses) { info.licenses = tmp.licenses }
        if (tmp.bin) { info.bin = tmp.bin }

        version_info[dir] = info;
    } catch(e) {}
});

module.exports = {
    name: 'software info',
    template: path.join(__dirname, 'template.jade'),
    standalone: true,

    process: function() {
        return {
            locals: {
                version_info: version_info,
                node_info: process.versions
            }
        };
    }
};