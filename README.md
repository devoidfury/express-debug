# express-debug
express-debug is a development tool for [express](https://github.com/visionmedia/express). It's simple middleware that
injects useful debugging output into your html, in a non-obstructive way.

It adds an 'EDT' tab to the right side of pages that, when clicked, displays info
such as template variables (locals), current session, useful request data, and
current template.

If your application doesn't serve HTML, no worries, a standalone express-debug
panel is mounted at `/express-debug`. See settings section for more information.

express-debug should **NOT** be used in production environments.

**Compatible with express 3 and 4, node 0.8+**


**[Screenshot of the tool in action](http://i.imgur.com/rz3WgSp.png)**

### Usage

#### Install
`npm install express-debug --save-dev`

#### Use
```js
var express = require('express');
var app = express();

require('express-debug')(app, {/* settings */});

/* ... application logic ... */
```


### Settings

`depth` - How deep to recurse through printed objects.  This is the default unless the print_obj function is passed an options object with a 'depth' property.
(Default: `4`)

`theme` - Absolute path to a css file to include and override EDT's default css.

`extra_panels` - additional panels to show. [See docs for custom panels](https://github.com/devoidfury/express-debug/blob/master/docs/custom_panels.md) and
[included panels](https://github.com/devoidfury/express-debug/tree/master/lib/panels)
for proper structure, each panel is an object
(Default: `[]`)

`panels` - allows changing the default panels (ex: remove a panel)
(Default: `['locals', 'request', 'session', 'template', 'software_info', 'profile']`)

`path` - path to render standalone express-debug \[set to `null` or `false` to disable\]
(Default: `/express-debug`)

`extra_attrs` - If you need to add arbitrary attributes to the containing element of EDT, this allows you to. (For example, you may want to use "ng-non-bindable" if you're using angular)
(Default: `''`)

`sort` - Global option to determine sort order of printed object values. `false` for default order, `true` for basic default sort, or a function to use for sort. [See MDN Array sort](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/sort)
(Default: `false`)

### Panels

`locals` - app.locals, res.locals, and options passed to the template (merged into res.locals)

`request` - req info. ip, body, query, files, route info, cookies, headers

`session` - everything in req.session

`template` - view name, template file

`software_info` - shows current versions of node and libraries installed locally (not globally installed packages!)

`profile` - total req processing time. middleware, param, and route timings. (not a default panel; does not work with express 4.x yet)

`other_requests` - shows details on non-page requests made to the server (not a default panel, use extra_panels setting to invoke. `{extra_panels: ['other_requests']}`)

`nav` - links to every GET route in your app. (not a default panel)


### Future
* profile panel: express 4.x compatibility
* nav panel: express 4.x - check multiple router instances
* optional error page that prints better stacks
* save more information about non-injected requests
* improve styling
* show session panel on standalone mount


### Changelog
* **1.1.1**
  * add `extra_attrs` option to add html attributes to the rendered EDT container
  * add `sort` option (thanks to vaughan99)
  * fix an issue that caused the panel to be rendered multiple times in some circumstances

* **1.1.0**
  * basic express 4.x support
  * profile panel is no longer a default panel
  * update connectr

* **1.0.3**
  * usability fix: middleware order no longer matters, thanks to [connectr](https://github.com/olalonde/connectr)
  * style tweaks

* **1.0.2**
  * add basic nav panel (not a default panel)
  * style and usability improvements
  * bugfixes


* **1.0.1**
  * sidebar moved to top and fixed position for better UX
  * fix: render error no longer crashes application


* **1.0.0** API changes
  * no longer used as a regular middleware, invoke with `edt(app[, settings])` instead
  * profile panel now acts like a regular panel
  * add standalone express-debug page mounted at `path` setting
  * add `standalone` panel setting
  * add `pre-render` and `post-render` panel hooks
  * profile panel now additionally profiles rendering


* **0.2.4**
  * no longer breaks error handling middleware


* **0.2.3**
  * add software info panel
  * clean up


* **0.2.2**
  * finalize panel api


* **0.2.1**
  * add profiler panel
  * modified style


* **0.2.0**
  * pluggable panels
  * theme addition and bugfix by jaketrent


* **0.1.2**
  * objects can now be collapsed
  * functions are now collapsed by default, showing only # of formal args and name, but can be expanded
  * separated css and js from main toolbar template


* **0.1.1**
  * remove environment checks
  * fix "view engine" directive, make template reading safer


### License - MIT
Copyright (c) 2014 Tom Hunkapiller and contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
