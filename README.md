# Introduction
QURAS BLOCKEXPLORER API SERVER

Copyright 2018 QURAS

MIT License

# Keyword
nodejs, expressjs, gulp, nodemon

# Installation

## Development Environment
<pre>
$ git clone http://192.168.2.1:8080/gitblit/r/QURAS/block-explorer-service.git quras-blockexplorer-service
$ cd quras-blockexplorer-service
$ yarn install (or npm install)
$ gulp dev
</pre>

Visit http://localhost:9080

## Production Environment
<pre>
$ cd quras-blockexplorer-service
$ npm start
</pre>

Visit http://localhost:3000

# Create workspace
1. Platform
    
    Windows 7 64bit

    <pre>
    $ node --version
    v10.13.0
    $ yarn --version
    1.12.3
</pre>

2. First generate app with express Generator like this.

    <pre>
    $ npm install express-generator -g
    $ express -h
    $ express quras-blockexplorer-service
</pre>

3. Add gulp task

# See Also
Express Generator

- https://expressjs.com/en/starter/generator.html
- https://stonesoupprogramming.com/2017/07/04/create-node-js-handlebars-express-js-project-from-command-line/

gulp-nodemon

- https://www.npmjs.com/package/gulp-nodemon