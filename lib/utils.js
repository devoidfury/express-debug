"use strict";

var utils = module.exports = {
    // inject toolbar into html output in the semantically proper place
    inject_toolbar: function(str, toolbar) {
        var location = str.lastIndexOf('</body');

        if (location === -1) {
            location = str.lastIndexOf('</html');
        }

        if (location === -1) {
            str += toolbar;
        } else {
            str = str.substring(0, location) + toolbar + str.substring(location);
        }
        return str;
    },

    get_ms_from_ns: function(ns) {
        return (ns / 10000 | 0) / 100;
    },

    // flatten a multidimensional array, with references
    flatten: function(arr, out) {
        out = out || [];

        if (arr instanceof Array) {
            arr.forEach(function (item, i) {
                if (item instanceof Array) {
                    utils.flatten(item, out);
                } else {
                    item.EDT_parent = item.EDT_parent || arr;
                    item.EDT_index = i;
                    out.push(item)
                }
            });
        }

        return out;
    }
};