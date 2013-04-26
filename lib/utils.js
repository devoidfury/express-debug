module.exports = {

    inject_toolbar: function(str, toolbar) {
        var location = str.lastIndexOf('</body');
        if (location === -1) {
            location = str.lastIndexOf('</html');

            if (location === -1) {
                location = null;
            }
        }

        if (location === null) {
            str += toolbar;
        } else {
            str = str.substring(0, location) + toolbar + str.substring(location);
        }
        return str;
    },

    get_ms_from_ns: function(ns) {
        return (ns / 10000 | 0) / 100;
    }
};