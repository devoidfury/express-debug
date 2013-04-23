(function () {
    "use strict";
    var $EDT = document.getElementById('EDT'),
        $sidebar = document.getElementById('EDT-sb'),
        $close = document.getElementById('EDT-close'),
        $show = document.getElementById('EDT-show');

    var util = {
        getTarget: function(event) {
            return event.originalTarget || event.srcElement;
        },

        getHref: function (event) {
            var el = util.getTarget(event);

            return el && el.attributes && (el.attributes.hash || el.attributes.href);
        },

        hasClass: function(el, klass) {
            return el.className && el.className.indexOf(klass) !== -1;
        },

        nextSibling: function(el) {
            var next = el.nextSibling;
            while (next && next.nodeType != 1) {
                next = next.nextSibling
            }
            return next;
        },

        getParentWithClass: function(el, klass) {
            var next = el.parentNode;
            while (next && !util.hasClass(next, klass)) {
                next = next.parentNode
            }
            return next;
        }
    };

    $sidebar.addEventListener('click', function (e) {

        var tab_id = util.getHref(e);
        if (tab_id) {
            e.preventDefault();
            var $actives = document.querySelectorAll('#EDT .tab.active');
            for (var i = 0; i < $actives.length; i++) {
                $actives[i].className = 'tab';
            }

            tab_id = tab_id.value.substring(1);
            document.getElementById(tab_id).className = 'tab active';
        }
    });

    $close.addEventListener('click', function (e) {
        e.preventDefault();
        $EDT.style.display = 'none';
        $show.style.display = 'block';
    });

    $show.addEventListener('click', function (e) {
        e.preventDefault();
        $EDT.style.display = 'block';
        $show.style.display = 'none';
    });

    $EDT.addEventListener('click', function (e) {
        var el = util.getTarget(e),
            $fn;

        if (util.hasClass(el, 'showFn')) {
            $fn = util.nextSibling(el);
            if ($fn) {
                $fn.style.display = 'block';
            }
            el.className = 'hideFn';
            e.preventDefault();

        } else if (util.hasClass(el, 'hideFn')) {
            $fn = util.nextSibling(el);
            if ($fn) {
                $fn.style.display = 'none';
            }
            el.className = 'showFn';
            e.preventDefault();

        } else if (util.getParentWithClass(el, 'collapse')) {
            var $object = util.getParentWithClass(el, 'object');
            $object.children[1].style.display = 'none';
            util.getParentWithClass(el, 'collapse').className = 'expand';
            e.preventDefault();

        } else if (util.getParentWithClass(el, 'expand')) {
            var $object = util.getParentWithClass(el, 'object');
            $object.children[1].style.display = 'table-row-group';
            util.getParentWithClass(el, 'expand').className = 'collapse';
            e.preventDefault();
        }
    });
})();