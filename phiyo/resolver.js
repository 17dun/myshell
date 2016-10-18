'use strict';
var path = require('path');
var fs = require('fs');
var _ = require('lodash');
var globby = require('globby');
var debug = require('debug')('yeoman:environment');

var win32 = process.platform === 'win32';


var resolver = module.exports;

resolver.lookup = function (cb) {
  var generatorsModules = this.findGeneratorsIn(this.getNpmPaths());
  var patterns = [];

  this.lookups.forEach(function (lookup) {
    generatorsModules.forEach(function (modulePath) {
      patterns.push(path.join(modulePath, lookup));
    });
  });

  patterns.forEach(function (pattern) {
    globby.sync('*/index.js', { cwd: pattern }).forEach(function (filename) {
      this._tryRegistering(path.join(pattern, filename));
    }, this);
  }, this);

  if (_.isFunction(cb)) {
    return cb(null);
  }
};


resolver.findGeneratorsIn = function (searchPaths) {
  var modules = [];
  searchPaths.forEach(function (root) {
    if (!root) {
      return;
    }

    modules = globby.sync([
      'generator-*',
      '@*/generator-*'
    ], { cwd: root }).map(function (match) {
      return path.join(root, match);
    }).concat(modules);
  });
  return modules;
};

resolver._tryRegistering = function (generatorReference) {
  var namespace;
  var realPath = fs.realpathSync(generatorReference);

  try {
    debug('found %s, trying to register', generatorReference);

    if (realPath !== generatorReference) {
      namespace = this.namespace(generatorReference);
    }

    this.register(realPath, namespace);
  } catch (e) {
    console.error('Unable to register %s (Error: %s)', generatorReference, e.message);
  }
};

resolver.getNpmPaths = function () {
  var paths = [];

  if (process.env.NVM_PATH) {
    paths.push(path.join(path.dirname(process.env.NVM_PATH), 'node_modules'));
  }

  if (process.env.NODE_PATH) {
    paths = _.compact(process.env.NODE_PATH.split(path.delimiter)).concat(paths);
  }

  paths.push(path.join(__dirname, '../../../..'));
  paths.push(path.join(__dirname, '../..'));

  if (process.argv[1]) {
    paths.push(path.join(path.dirname(process.argv[1]), '../..'));
  }

  if (win32) {
    paths.push(path.join(process.env.APPDATA, 'npm/node_modules'));
  } else {
    paths.push('/usr/lib/node_modules');
  }

  process.cwd().split(path.sep).forEach(function (part, i, parts) {
    var lookup = path.join.apply(path, parts.slice(0, i + 1).concat(['node_modules']));

    if (!win32) {
      lookup = '/' + lookup;
    }

    paths.push(lookup);
  });

  return paths.reverse();
};


resolver.alias = function alias(match, value) {
  if (match && value) {
    this.aliases.push({
      match: match instanceof RegExp ? match : new RegExp('^' + match + '$'),
      value: value
    });
    return this;
  }

  var aliases = this.aliases.slice(0).reverse();

  return aliases.reduce(function (res, alias) {
    if (!alias.match.test(res)) {
      return res;
    }

    return res.replace(alias.match, alias.value);
  }, match);
};
