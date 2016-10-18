'use strict';

var util = require('util');
var events = require('events');
var _ = require('lodash');
var table = require('text-table');
var chalk = require('chalk');
var logSymbols = require('log-symbols');

var step = '  ';
var padding = ' ';

var colors = {
  skip: 'yellow',
  force: 'yellow',
  create: 'green',
  invoke: 'bold',
  conflict: 'red',
  identical: 'cyan',
  info: 'gray'
};

function pad(status) {
  var max = 'identical'.length;
  var delta = max - status.length;
  return delta ? new Array(delta + 1).join(' ') + status : status;
}

function formatter(msg, ctx) {
  while (msg.indexOf('%') !== -1) {
    var start = msg.indexOf('%');
    var end = msg.indexOf(' ', start);

    if (end === -1) {
      end = msg.length;
    }

    msg = msg.slice(0, start) + ctx[msg.slice(start + 1, end)] + msg.slice(end);
  }

  return msg;
}

module.exports = function logger() {
  function log(msg, ctx) {
    msg = msg || '';

    if (typeof ctx === 'object' && !Array.isArray(ctx)) {
      console.error(formatter(msg, ctx));
    } else {
      console.error.apply(console, arguments);
    }

    return log;
  }

  _.extend(log, events.EventEmitter.prototype);

  log.write = function () {
    process.stderr.write(util.format.apply(util, arguments));
    return this;
  };

  log.writeln = function () {
    this.write.apply(this, arguments);
    this.write('\n');
    return this;
  };

  log.ok = function () {
    this.write(logSymbols.success + ' ' + util.format.apply(util, arguments) + '\n');
    return this;
  };

  log.error = function () {
    this.write(logSymbols.error + ' ' + util.format.apply(util, arguments) + '\n');
    return this;
  };

  log.on('up', function () {
    padding = padding + step;
  });

  log.on('down', function () {
    padding = padding.replace(step, '');
  });

  Object.keys(colors).forEach(function (status) {

    log[status] = function () {
      var color = colors[status];
      this.write(chalk[color](pad(status))).write(padding);
      this.write(util.format.apply(util, arguments) + '\n');
      return this;
    };
  });

  log.table = function (opts) {
    var tableData = [];

    opts = Array.isArray(opts) ? { rows: opts } : opts;
    opts.rows = opts.rows || [];

    opts.rows.forEach(function (row) {
      tableData.push(row);
    });

    return table(tableData);
  };

  return log;
};
