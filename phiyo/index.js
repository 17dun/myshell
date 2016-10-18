'use strict';
var util = require('util');
var fs = require('fs');
var path = require('path');
var events = require('events');
var chalk = require('chalk');
var _ = require('lodash');
var GroupedQueue = require('grouped-queue');
var escapeStrRe = require('escape-string-regexp');
var untildify = require('untildify');
var memFs = require('mem-fs');
var debug = require('debug')('yeoman:environment');
var Store = require('./store');
var resolver = require('./resolver');
var TerminalAdapter = require('./adapter');

var Environment = module.exports = function Environment(args, opts, adapter) {
  events.EventEmitter.call(this);

  args = args || [];
  this.arguments = Array.isArray(args) ? args : args.split(' ');
  this.options = opts || {};
  this.adapter = adapter || new TerminalAdapter();
  this.cwd = this.options.cwd || process.cwd();
  this.store = new Store();

  this.runLoop = new GroupedQueue(Environment.queues);
  this.sharedFs = memFs.create();

  this.runLoop.setMaxListeners(0);
  this.sharedFs.setMaxListeners(0);

  this.lookups = ['.', 'generators', 'lib/generators'];
  this.aliases = [];

  this.alias(/^([^:]+)$/, '$1:app');
};

util.inherits(Environment, events.EventEmitter);
_.extend(Environment.prototype, resolver);

Environment.queues = [
  'initializing',
  'prompting',
  'configuring',
  'default',
  'writing',
  'conflicts',
  'install',
  'end'
];

Environment.prototype.error = function error(err) {
  err = err instanceof Error ? err : new Error(err);

  if (!this.emit('error', err)) {
    throw err;
  }

  return err;
};


Environment.prototype.help = function help(name) {
  name = name || 'init';

  var out = [
    'Usage: :binary: GENERATOR [args] [options]',
    '',
    'General options:',
    '  --help       # Print generator\'s options and usage',
    '  -f, --force  # Overwrite files that already exist',
    '',
    'Please choose a generator below.',
    ''
  ];

  var ns = this.namespaces();

  var groups = {};
  ns.forEach(function (namespace) {
    var base = namespace.split(':')[0];

    if (!groups[base]) {
      groups[base] = [];
    }

    groups[base].push(namespace);
  });

  Object.keys(groups).sort().forEach(function (key) {
    var group = groups[key];

    if (group.length >= 1) {
      out.push('', key.charAt(0).toUpperCase() + key.slice(1));
    }

    groups[key].forEach(function (ns) {
      out.push('  ' + ns);
    });
  });

  return out.join('\n').replace(/:binary:/g, name);
};


Environment.prototype.register = function register(name, namespace) {
  if (!_.isString(name)) {
    return this.error(new Error('You must provide a generator name to register.'));
  }

  var modulePath = this.resolveModulePath(name);
  namespace = namespace || this.namespace(modulePath);

  if (!namespace) {
    return this.error(new Error('Unable to determine namespace.'));
  }

  this.store.add(namespace, modulePath);

  debug('Registered %s (%s)', namespace, modulePath);
  return this;
};


Environment.prototype.registerStub = function registerStub(Generator, namespace) {
  if (!_.isFunction(Generator)) {
    return this.error(new Error('You must provide a stub function to register.'));
  }

  if (!_.isString(namespace)) {
    return this.error(new Error('You must provide a namespace to register.'));
  }

  this.store.add(namespace, Generator);

  return this;
};



Environment.prototype.namespaces = function namespaces() {
  return this.store.namespaces();
};


Environment.prototype.getGeneratorsMeta = function getGeneratorsMeta() {
  return this.store.getGeneratorsMeta();
};


Environment.prototype.getGeneratorNames = function getGeneratorNames() {
  return _.uniq(Object.keys(this.getGeneratorsMeta()).map(Environment.namespaceToName));
};

Environment.prototype.get = function get(namespaceOrPath) {
  if (!namespaceOrPath) {
    return;
  }

  var namespace = namespaceOrPath;

  var parts = namespaceOrPath.split(':');
  var maybePath = _.last(parts);
  if (parts.length > 1 && /[\/\\]/.test(maybePath)) {
    parts.pop();

    if (maybePath.indexOf('\\') >= 0 && _.last(parts).length === 1) {
      parts.pop();
    }

    namespace = parts.join(':');
  }
  return this.store.get(namespace) ||
    this.store.get(this.alias(namespace)) ||
    this.getByPath(namespaceOrPath);
};

Environment.prototype.getByPath = function (path) {
  if (fs.existsSync(path)) {
    var namespace = this.namespace(path);
    this.register(path, namespace);

    return this.get(namespace);
  }
};


Environment.prototype.create = function create(namespace, options) {
  options = options || {};

  var Generator = this.get(namespace);

  if (!_.isFunction(Generator)) {
    return this.error(
      new Error(
        chalk.red('You don\’t seem to have a generator with the name “' + namespace + '” installed.') + '\n' +
        'But help is on the way:\n\n' +
        'You can see available generators via ' +
        chalk.yellow('npm search yeoman-generator') + ' or via ' + chalk.yellow('http://yeoman.io/generators/') + '. \n' +
        'Install them with ' + chalk.yellow('npm install generator-' + namespace) + '.\n\n' +
        'To see all your installed generators run ' + chalk.yellow('yo') + ' without any arguments. ' +
        'Adding the ' + chalk.yellow('--help') + ' option will also show subgenerators. \n\n' +
        'If ' + chalk.yellow('yo') + ' cannot find the generator, run ' + chalk.yellow('yo doctor') + ' to troubleshoot your system.'
      )
    );
  }
  return this.instantiate(Generator, options);
};


Environment.prototype.instantiate = function instantiate(Generator, options) {
  options = options || {};

  var args = options.arguments || options.args || _.clone(this.arguments);
  args = Array.isArray(args) ? args : args.split(' ');

  var opts = options.options || _.clone(this.options);

  opts.env = this;
  opts.resolved = Generator.resolved || 'unknown';
  opts.namespace = Generator.namespace;
  return new Generator(args, opts);
};


Environment.prototype.run = function run(args, options, done) {
  args = args || this.arguments;

  if (typeof options === 'function') {
    done = options;
    options = this.options;
  }

  if (typeof args === 'function') {
    done = args;
    options = this.options;
    args = this.arguments;
  }

  args = Array.isArray(args) ? args : args.split(' ');
  options = options || this.options;

  var name = args.shift();
  if (!name) {
    return this.error(new Error('Must provide at least one argument, the generator namespace to invoke.'));
  }

  var generator = this.create(name, {
    args: args,
    options: options
  });

  if (generator instanceof Error) {
    return generator;
  }

  if (options.help) {
    return console.log(generator.help());
  }

  return generator.run(done);
};


Environment.prototype.namespace = function namespace(filepath) {
  if (!filepath) {
    throw new Error('Missing namespace');
  }

  var ns = path.normalize(filepath.replace(new RegExp(escapeStrRe(path.extname(filepath)) + '$'), ''));

  var lookups = _(this.lookups.concat(['..'])).map(path.normalize).sortBy('length').value().reverse();

  ns = lookups.reduce(function (ns, lookup) {
    lookup = new RegExp('(?:\\\\|/|^)' + escapeStrRe(lookup) + '(?=\\\\|/)', 'g');
    return ns.replace(lookup, '');
  }, ns);
  var folders = ns.split(path.sep);
  var scope = _.findLast(folders, function (folder) {
    return folder.indexOf('@') === 0;
  });

  ns = ns
    .replace(/(.*generator-)/, '')
    .replace(/[\/\\](index|main)$/, '')
    .replace(/^[\/\\]+/, '')
    .replace(/[\/\\]+/g, ':');

  if (scope) {
    ns = scope + '/' + ns;
  }

  debug('Resolve namespaces for %s: %s', filepath, ns);

  return ns;
};

Environment.prototype.resolveModulePath = function resolveModulePath(moduleId) {
  if (moduleId[0] === '.') {
    moduleId = path.resolve(moduleId);
  }
  if (path.extname(moduleId) === '') {
    moduleId += path.sep;
  }

  return require.resolve(untildify(moduleId));
};

Environment.enforceUpdate = function (env) {
  if (!env.adapter) {
    env.adapter = new TerminalAdapter();
  }

  if (!env.runLoop) {
    env.runLoop = new GroupedQueue([
      'initializing',
      'prompting',
      'configuring',
      'default',
      'writing',
      'conflicts',
      'install',
      'end'
    ]);
  }

  if (!env.sharedFs) {
    env.sharedFs = memFs.create();
  }

  return env;
};


Environment.createEnv = function (args, opts, adapter) {
  return new Environment(args, opts, adapter);
};


Environment.namespaceToName = function (namespace) {
  return namespace.split(':')[0];
};


Environment.util = require('./util/util');
