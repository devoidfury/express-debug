#### Custom Panels
Each panel is an object, in the form:

```js
my_panel = {
    name: 'panel_name',
    template: '/absolute/path/to/template.jade',
    process: function(locals){
        // locals: {app, req, res, view, locals}

        // ... logic here ...
        return { locals: {/* my template locals */}};
    }
}
```
Optionally, panels supports the following additional properties:

standalone: set this property to `true` to display this panel on the standalone express-debug mount

initialize:
```js
my_panel.initialize = function(app) {
    // perform initialization here, when the application loads
}
```

request:
```js
my_panel.request = function(req) {
    // perform initialization here, for every request
}
```

finalize:
```js
my_panel.finalize = function(req) {
    // finish up here, as soon as render is called
}
```

pre_render:
```js
my_panel.pre_render = function(req) {
    // just before rendering
}

```
post_render:
```js
my_panel.post_render = function(req) {
    // just after rendering
}
```
