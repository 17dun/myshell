'use strict'

var fs = require('fs');
var path = require('path');

const files = fs.readdirSync(__dirname + '/../actions/');
const actions = [];

function getActions() {
    files.forEach(function(file) {
        var stat  = fs.statSync(__dirname + '/../actions/' + file);
        if (!stat.isDirectory() && path.extname(file) === '.js') {
            var fileName = path.basename(file, '.js');
            if(fileName!=='index.js'){
                var action = require(__dirname + '/../actions/' + file);
                actions[fileName] = action;
            }
        }
    });
    return actions;
}

module.exports = getActions();