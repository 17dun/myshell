'use strict';

var _ = require('lodash');
var inquirer = require('inquirer');
var diff = require('diff');
var chalk = require('chalk');
var logger = require('./util/log');


var TerminalAdapter = module.exports = function TerminalAdapter() {
  this.promptModule = inquirer.createPromptModule();
};

TerminalAdapter.prototype._colorDiffAdded = chalk.black.bgGreen;
TerminalAdapter.prototype._colorDiffRemoved = chalk.bgRed;
TerminalAdapter.prototype._colorLines = function colorLines(name, str) {
  return str.split('\n').map(function (line) {
    return this['_colorDiff' + name](line);
  }, this).join('\n');
};

TerminalAdapter.prototype.prompt = function () {};

TerminalAdapter.prototype.diff = function _diff(actual, expected) {
  var msg = diff.diffLines(actual, expected).map(function (str) {
    if (str.added) {
      return this._colorLines('Added', str.value);
    }

    if (str.removed) {
      return this._colorLines('Removed', str.value);
    }

    return str.value;
  }, this).join('');

  msg = '\n' +
    this._colorDiffRemoved('removed') +
    ' ' +
    this._colorDiffAdded('added') +
    '\n\n' +
    msg +
    '\n';

  console.log(msg);
  return msg;
};

TerminalAdapter.prototype.log = logger();

TerminalAdapter.prototype.prompt = function (questions, cb) {
  var promise = this.promptModule(questions);
  promise.then(cb || _.noop);
  return promise;
};
