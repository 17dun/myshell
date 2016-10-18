'use strict';
var _ = require('lodash');


var Store = module.exports = function Store() {
  this._generators = {};
  this._meta = {};
};


Store.prototype.add = function add(namespace, generator) {
  if (_.isString(generator)) {
    this._storeAsPath(namespace, generator);
    return;
  }

  this._storeAsModule(namespace, generator);
};

Store.prototype._storeAsPath = function _storeAsPath(namespace, path) {
  this._meta[namespace] = {
    resolved: path,
    namespace: namespace
  };

  Object.defineProperty(this._generators, namespace, {
    get: function () {
      var Generator = require(path);
      return Generator;
    },
    enumerable: true,
    configurable: true
  });
};

Store.prototype._storeAsModule = function _storeAsModule(namespace, Generator) {
  this._meta[namespace] = {
    resolved: 'unknown',
    namespace: namespace
  };

  this._generators[namespace] = Generator;
};


Store.prototype.get = function get(namespace) {
  var Generator = this._generators[namespace];

  if (!Generator) {
    return;
  }

  return _.extend(Generator, this._meta[namespace]);
};


Store.prototype.namespaces = function namespaces() {
  return Object.keys(this._generators);
};

Store.prototype.getGeneratorsMeta = function getGeneratorsMeta() {
  return this._meta;
};
