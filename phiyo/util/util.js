'use strict';

var GroupedQueue = require('grouped-queue');

exports.duplicateEnv = function (initialEnv) {
  var queues = require('../environment').queues;
  var env = Object.create(initialEnv);
  env.runLoop = new GroupedQueue(queues);
  return env;
};

exports.log = require('./log');
