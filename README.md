clementine-remote-web
=====================

A web interface for Clementine powered by [Node.js](http://nodejs.org/), [Polymer](https://www.polymer-project.org) and [Browserify](http://browserify.org/).

![screenshot_2014-12-20-12-41-02](https://cloud.githubusercontent.com/assets/506932/5514676/a33fa1f4-8845-11e4-8eec-42819ea79755.png)

Install:
```shell
npm install
bower install
```

Run:
```shell
node .
```

Since Browserify is used, if you want to edit `client.js` run `grunt build` after (you will need `grunt` to be installed: `npm install -g grunt-cli`).

You can run `grunt watch` instead to recompile automagically the browserify bundle when a file is changed.
