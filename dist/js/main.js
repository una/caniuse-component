(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":3}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

(function () {
  try {
    cachedSetTimeout = setTimeout;
  } catch (e) {
    cachedSetTimeout = function () {
      throw new Error('setTimeout is not defined');
    }
  }
  try {
    cachedClearTimeout = clearTimeout;
  } catch (e) {
    cachedClearTimeout = function () {
      throw new Error('clearTimeout is not defined');
    }
  }
} ())
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = cachedSetTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    cachedClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        cachedSetTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
(function (process){
var caniuse = require('caniuse-db/data.json').agents;
var path    = require('path');
var fs      = require('fs');

function uniq(array) {
    var filtered = [];
    for ( var i = 0; i < array.length; i++ ) {
        if ( filtered.indexOf(array[i]) === -1 ) filtered.push(array[i]);
    }
    return filtered;
}

function BrowserslistError(message) {
    this.name = 'BrowserslistError';
    this.message = message || '';
    if ( Error.captureStackTrace ) {
        Error.captureStackTrace(this, BrowserslistError);
    }
}
BrowserslistError.prototype = Error.prototype;

function error(name) {
    var obj = new BrowserslistError(name);
    obj.browserslist = true;
    throw obj;
}

// Helpers

var normalize = function (versions) {
    return versions.filter(function (version) {
        return typeof version === 'string';
    });
};

var fillUsage = function (result, name, data) {
    for ( var i in data ) {
        result[name + ' ' + i] = data[i];
    }
};

// Return array of browsers by selection queries:
//
//   browserslist('IE >= 10, IE 8') //=> ['ie 11', 'ie 10', 'ie 8']
var browserslist = function (selections, opts) {
    if ( typeof opts === 'undefined' ) opts = { };

    if ( typeof selections === 'undefined' || selections === null ) {

        if ( process.env.BROWSERSLIST ) {
            selections = process.env.BROWSERSLIST;
        } else if ( opts.config || process.env.BROWSERSLIST_CONFIG ) {
            var file = opts.config || process.env.BROWSERSLIST_CONFIG;
            if ( fs.existsSync(file) && fs.statSync(file).isFile() ) {
                selections = browserslist.parseConfig( fs.readFileSync(file) );
            } else {
                error('Can\'t read ' + file + ' config');
            }
        } else {
            var config = browserslist.readConfig(opts.path);
            if ( config !== false ) {
                selections = config;
            } else {
                selections = browserslist.defaults;
            }
        }
    }

    if ( typeof selections === 'string' ) {
        selections = selections.split(/,\s*/);
    }

    if ( opts.stats || process.env.BROWSERSLIST_STATS ) {
        browserslist.usage.custom = { };
        var stats = opts.stats || process.env.BROWSERSLIST_STATS;
        if ( typeof stats === 'string' ) {
            try {
                stats = JSON.parse(fs.readFileSync(stats));
            } catch (e) {
                error('Can\'t read ' + stats);
            }
        }
        if ( 'dataByBrowser' in stats ) {
            // Allow to use the data as-is from the caniuse.com website
            stats = stats.dataByBrowser;
        }
        for ( var browser in stats ) {
            fillUsage(browserslist.usage.custom, browser, stats[browser]);
        }
    }

    var result = [];

    var exclude, query, match, array, used;
    selections.forEach(function (selection) {
        if ( selection.trim() === '' ) return;
        exclude = false;
        used    = false;

        if ( selection.indexOf('not ') === 0 ) {
            selection = selection.slice(4);
            exclude   = true;
        }

        for ( var i in browserslist.queries ) {
            query = browserslist.queries[i];
            match = selection.match(query.regexp);
            if ( match ) {
                array = query.select.apply(browserslist, match.slice(1));
                if ( exclude ) {
                    result = result.filter(function (j) {
                        return array.indexOf(j) === -1;
                    });
                } else {
                    result = result.concat(array);
                }
                used   = true;
                break;
            }
        }

        if ( !used ) {
            error('Unknown browser query `' + selection + '`');
        }
    });

    result = uniq(result);

    return result.filter(function (i) {
        var version = i.split(' ')[1];
        if ( version === '0' ) {
            var name = i.split(' ')[0];
            return !result.some(function (j) {
                return j !== i && j.split(' ')[0] === name;
            });
        } else {
            return true;
        }
    }).sort(function (name1, name2) {
        name1 = name1.split(' ');
        name2 = name2.split(' ');
        if ( name1[0] === name2[0] ) {
            var d = parseFloat(name2[1]) - parseFloat(name1[1]);
            if ( d > 0 ) {
                return 1;
            } else if ( d < 0 ) {
                return -1;
            } else {
                return 0;
            }
        } else {
            return name1[0].localeCompare(name2[0]);
        }
    });
};

var normalizeVersion = function (data, version) {
    if ( data.versions.indexOf(version) !== -1 ) {
        return version;
    } else {
        return browserslist.versionAliases[data.name][version];
    }
};

var loadCountryStatistics = function (country) {
    if (!browserslist.usage[country]) {
        var usage = { };
        var data = require(
            'caniuse-db/region-usage-json/' + country + '.json');
        for ( var i in data.data ) {
            fillUsage(usage, i, data.data[i]);
        }
        browserslist.usage[country] = usage;
    }
};

// Will be filled by Can I Use data below
browserslist.data  = { };
browserslist.usage = {
    global: { },
    custom: null
};

// Default browsers query
browserslist.defaults = [
    '> 1%',
    'last 2 versions',
    'Firefox ESR'
];

// What browsers will be used in `last n version` query
browserslist.major = ['safari', 'opera', 'ios_saf', 'ie_mob', 'ie',
                      'edge', 'firefox', 'chrome'];

// Browser names aliases
browserslist.aliases = {
    fx:             'firefox',
    ff:             'firefox',
    ios:            'ios_saf',
    explorer:       'ie',
    blackberry:     'bb',
    explorermobile: 'ie_mob',
    operamini:      'op_mini',
    operamobile:    'op_mob',
    chromeandroid:  'and_chr',
    firefoxandroid: 'and_ff'
};

// Aliases ot work with joined versions like `ios_saf 7.0-7.1`
browserslist.versionAliases = { };

// Get browser data by alias or case insensitive name
browserslist.byName = function (name) {
    name = name.toLowerCase();
    name = browserslist.aliases[name] || name;
    return browserslist.data[name];
};

// Get browser data by alias or case insensitive name and throw error
// on unknown browser
browserslist.checkName = function (name) {
    var data = browserslist.byName(name);
    if ( !data ) error('Unknown browser ' + name);
    return data;
};

// Find config, read file and parse it
browserslist.readConfig = function (from) {
    if ( from === false )   return false;
    if ( !fs.readFileSync || !fs.existsSync || !fs.statSync ) return false;
    if ( typeof from === 'undefined' ) from = '.';

    var dirs = path.resolve(from).split(path.sep);
    var config;
    while ( dirs.length ) {
        config = dirs.concat(['browserslist']).join(path.sep);

        if ( fs.existsSync(config) && fs.statSync(config).isFile() ) {
            return browserslist.parseConfig( fs.readFileSync(config) );
        }

        dirs.pop();
    }

    return false;
};

// Return browsers market coverage
browserslist.coverage = function (browsers, country) {
    if (country && country !== 'global') {
        country = country.toUpperCase();
        loadCountryStatistics(country);
    } else {
        country = 'global'; // Default value
    }

    return browsers.reduce(function (all, i) {
        var usage = browserslist.usage[country][i];
        if (usage === undefined) {
            // Sometimes, Caniuse consolidates country usage data into a single
            // "version 0" entry. This is usually when there is only 1 version.
            usage = browserslist.usage[country][i.replace(/ [\d.]+$/, ' 0')];
        }
        return all + (usage || 0);
    }, 0);
};

// Return array of queries from config content
browserslist.parseConfig = function (string) {
    return string.toString()
            .replace(/#[^\n]*/g, '')
            .split(/\n/)
            .map(function (i) {
                return i.trim();
            }).filter(function (i) {
                return i !== '';
            });
};

browserslist.queries = {

    lastVersions: {
        regexp: /^last\s+(\d+)\s+versions?$/i,
        select: function (versions) {
            var selected = [];
            browserslist.major.forEach(function (name) {
                var data  = browserslist.byName(name);
                if ( !data ) return;
                var array = data.released.slice(-versions);

                array = array.map(function (v) {
                    return data.name + ' ' + v;
                });
                selected = selected.concat(array);
            });
            return selected;
        }
    },

    lastByBrowser: {
        regexp: /^last\s+(\d+)\s+(\w+)\s+versions?$/i,
        select: function (versions, name) {
            var data = browserslist.checkName(name);
            return data.released.slice(-versions).map(function (v) {
                return data.name + ' ' + v;
            });
        }
    },

    globalStatistics: {
        regexp: /^>\s*(\d*\.?\d+)%$/,
        select: function (popularity) {
            popularity = parseFloat(popularity);
            var result = [];

            for ( var version in browserslist.usage.global ) {
                if ( browserslist.usage.global[version] > popularity ) {
                    result.push(version);
                }
            }

            return result;
        }
    },

    customStatistics: {
        regexp: /^>\s*(\d*\.?\d+)%\s+in\s+my\s+stats$/,
        select: function (popularity) {
            popularity = parseFloat(popularity);
            var result = [];

            var usage = browserslist.usage.custom;
            if ( !usage ) {
                error('Custom usage statistics was not provided');
            }

            for ( var version in usage ) {
                if ( usage[version] > popularity ) {
                    result.push(version);
                }
            }

            return result;
        }
    },

    countryStatistics: {
        regexp: /^>\s*(\d*\.?\d+)%\s+in\s+(\w\w)$/,
        select: function (popularity, country) {
            popularity = parseFloat(popularity);
            country    = country.toUpperCase();
            var result = [];

            loadCountryStatistics(country);
            var usage = browserslist.usage[country];

            for ( var version in usage ) {
                if ( usage[version] > popularity ) {
                    result.push(version);
                }
            }

            return result;
        }
    },

    range: {
        regexp: /^(\w+)\s+([\d\.]+)\s*-\s*([\d\.]+)$/i,
        select: function (name, from, to) {
            var data = browserslist.checkName(name);
            from = parseFloat(normalizeVersion(data, from) || from);
            to = parseFloat(normalizeVersion(data, to) || to);

            var filter = function (v) {
                var parsed = parseFloat(v);
                return parsed >= from && parsed <= to;
            };

            return data.released.filter(filter).map(function (v) {
                return data.name + ' ' + v;
            });
        }
    },

    versions: {
        regexp: /^(\w+)\s*(>=?|<=?)\s*([\d\.]+)$/,
        select: function (name, sign, version) {
            var data = browserslist.checkName(name);
            var alias = normalizeVersion(data, version);
            if ( alias ) {
                version = alias;
            }
            version = parseFloat(version);

            var filter;
            if ( sign === '>' ) {
                filter = function (v) {
                    return parseFloat(v) > version;
                };
            } else if ( sign === '>=' ) {
                filter = function (v) {
                    return parseFloat(v) >= version;
                };
            } else if ( sign === '<' ) {
                filter = function (v) {
                    return parseFloat(v) < version;
                };
            } else if ( sign === '<=' ) {
                filter = function (v) {
                    return parseFloat(v) <= version;
                };
            }
            return data.released.filter(filter).map(function (v) {
                return data.name + ' ' + v;
            });
        }
    },

    esr: {
        regexp: /^(firefox|ff|fx)\s+esr$/i,
        select: function () {
            return ['firefox 45'];
        }
    },

    direct: {
        regexp: /^(\w+)\s+(tp|[\d\.]+)$/i,
        select: function (name, version) {
            if ( /tp/i.test(version) ) version = 'TP';
            var data  = browserslist.checkName(name);
            var alias = normalizeVersion(data, version);
            if ( alias ) {
                version = alias;
            } else {
                if ( version.indexOf('.') === -1 ) {
                    alias = version + '.0';
                } else if ( /\.0$/.test(version) ) {
                    alias = version.replace(/\.0$/, '');
                }
                alias = normalizeVersion(data, alias);
                if ( alias ) {
                    version = alias;
                } else {
                    error('Unknown version ' + version + ' of ' + name);
                }
            }
            return [data.name + ' ' + version];
        }
    }

};

// Get and convert Can I Use data

(function () {
    for ( var name in caniuse ) {
        browserslist.data[name] = {
            name:     name,
            versions: normalize(caniuse[name].versions),
            released: normalize(caniuse[name].versions.slice(0, -3))
        };
        fillUsage(browserslist.usage.global, name, caniuse[name].usage_global);

        browserslist.versionAliases[name] = { };
        for ( var i = 0; i < caniuse[name].versions.length; i++ ) {
            if ( !caniuse[name].versions[i] ) continue;
            var full = caniuse[name].versions[i];

            if ( full.indexOf('-') !== -1 ) {
                var interval = full.split('-');
                for ( var j = 0; j < interval.length; j++ ) {
                    browserslist.versionAliases[name][interval[j]] = full;
                }
            }
        }
    }
}());

module.exports = browserslist;

}).call(this,require('_process'))
},{"_process":3,"caniuse-db/data.json":8,"fs":1,"path":2}],5:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

Object.defineProperty(exports, "__esModule", {
  value: true
});

var memoize = _interopRequire(require("lodash.memoize"));

var browserslist = _interopRequire(require("browserslist"));

var _utils = require("./utils");

var contains = _utils.contains;
var parseCaniuseData = _utils.parseCaniuseData;
var cleanBrowsersList = _utils.cleanBrowsersList;

var features = _interopRequire(require("../features"));

var featuresList = Object.keys(features);

var browsers;
function setBrowserScope(browserList) {
  browsers = cleanBrowsersList(browserList);
}

function getBrowserScope() {
  return browsers;
}

var parse = memoize(parseCaniuseData, function (feature, browsers) {
  return feature.title + browsers;
});

function getSupport(_x) {
  var _again = true;

  _function: while (_again) {
    _again = false;
    var query = _x;
    feature = res = undefined;

    var feature = undefined;
    try {
      feature = features[query]();
    } catch (e) {
      var res = find(query);
      if (res.length === 1) {
        _x = res[0];
        _again = true;
        continue _function;
      }
      throw new ReferenceError("Please provide a proper feature name. Cannot find " + query);
    }
    return parse(feature, browsers);
  }
}

function isSupported(feature, browsers) {
  var data = undefined;
  try {
    data = features[feature]();
  } catch (e) {
    var res = find(feature);
    if (res.length === 1) {
      data = features[res[0]]();
    } else {
      throw new ReferenceError("Please provide a proper feature name. Cannot find " + feature);
    }
  }

  return browserslist(browsers).map(function (browser) {
    return browser.split(" ");
  }).every(function (browser) {
    return data.stats[browser[0]][browser[1]] === "y";
  });
}

function find(query) {
  if (typeof query !== "string") {
    throw new TypeError("The `query` parameter should be a string.");
  }

  if (~featuresList.indexOf(query)) {
    // exact match
    return query;
  }

  return featuresList.filter(function (file) {
    return contains(file, query);
  });
}

function getLatestStableBrowsers() {
  return browserslist.queries.lastVersions.select(1);
}

setBrowserScope();

exports.getSupport = getSupport;
exports.isSupported = isSupported;
exports.find = find;
exports.getLatestStableBrowsers = getLatestStableBrowsers;
exports.setBrowserScope = setBrowserScope;
exports.getBrowserScope = getBrowserScope;
},{"../features":7,"./utils":6,"browserslist":4,"lodash.memoize":378}],6:[function(require,module,exports){
"use strict";

var _interopRequire = function (obj) { return obj && obj.__esModule ? obj["default"] : obj; };

exports.contains = contains;
exports.parseCaniuseData = parseCaniuseData;
exports.cleanBrowsersList = cleanBrowsersList;
Object.defineProperty(exports, "__esModule", {
  value: true
});

var uniq = _interopRequire(require("lodash.uniq"));

var browserslist = _interopRequire(require("browserslist"));

function contains(str, substr) {
  return !! ~str.indexOf(substr);
}

function parseCaniuseData(feature, browsers) {
  var support = {};
  var letters;
  var letter;

  browsers.forEach(function (browser) {
    support[browser] = {};
    for (var info in feature.stats[browser]) {
      letters = feature.stats[browser][info].split(" ");
      info = parseFloat(info.split("-")[0]); //if info is a range, take the left
      if (isNaN(info)) continue;
      for (var i = 0; i < letters.length; i++) {
        letter = letters[i];
        if (letter === "y") {
          // min support asked, need to find the min value
          if (typeof support[browser][letter] === "undefined" || info < support[browser][letter]) {
            support[browser][letter] = info;
          }
        } else {
          // any other support, need to find the max value
          if (typeof support[browser][letter] === "undefined" || info > support[browser][letter]) {
            support[browser][letter] = info;
          }
        }
      }
    }
  });

  return support;
}

function cleanBrowsersList(browserList) {
  return uniq(browserslist(browserList).map(function (browser) {
    return browser.split(" ")[0];
  }));
}
},{"browserslist":4,"lodash.uniq":379}],7:[function(require,module,exports){
module.exports = {"aac": function() { return require("caniuse-db/features-json/aac.json")},
"ac3-ec3": function() { return require("caniuse-db/features-json/ac3-ec3.json")},
"addeventlistener": function() { return require("caniuse-db/features-json/addeventlistener.json")},
"ambient-light": function() { return require("caniuse-db/features-json/ambient-light.json")},
"apng": function() { return require("caniuse-db/features-json/apng.json")},
"arrow-functions": function() { return require("caniuse-db/features-json/arrow-functions.json")},
"asmjs": function() { return require("caniuse-db/features-json/asmjs.json")},
"atob-btoa": function() { return require("caniuse-db/features-json/atob-btoa.json")},
"audio-api": function() { return require("caniuse-db/features-json/audio-api.json")},
"audio": function() { return require("caniuse-db/features-json/audio.json")},
"audiotracks": function() { return require("caniuse-db/features-json/audiotracks.json")},
"autofocus": function() { return require("caniuse-db/features-json/autofocus.json")},
"background-attachment": function() { return require("caniuse-db/features-json/background-attachment.json")},
"background-img-opts": function() { return require("caniuse-db/features-json/background-img-opts.json")},
"background-position-x-y": function() { return require("caniuse-db/features-json/background-position-x-y.json")},
"battery-status": function() { return require("caniuse-db/features-json/battery-status.json")},
"beacon": function() { return require("caniuse-db/features-json/beacon.json")},
"blobbuilder": function() { return require("caniuse-db/features-json/blobbuilder.json")},
"bloburls": function() { return require("caniuse-db/features-json/bloburls.json")},
"border-image": function() { return require("caniuse-db/features-json/border-image.json")},
"border-radius": function() { return require("caniuse-db/features-json/border-radius.json")},
"broadcastchannel": function() { return require("caniuse-db/features-json/broadcastchannel.json")},
"brotli": function() { return require("caniuse-db/features-json/brotli.json")},
"calc": function() { return require("caniuse-db/features-json/calc.json")},
"canvas-blending": function() { return require("caniuse-db/features-json/canvas-blending.json")},
"canvas-text": function() { return require("caniuse-db/features-json/canvas-text.json")},
"canvas": function() { return require("caniuse-db/features-json/canvas.json")},
"ch-unit": function() { return require("caniuse-db/features-json/ch-unit.json")},
"chacha20-poly1305": function() { return require("caniuse-db/features-json/chacha20-poly1305.json")},
"channel-messaging": function() { return require("caniuse-db/features-json/channel-messaging.json")},
"classlist": function() { return require("caniuse-db/features-json/classlist.json")},
"client-hints-dpr-width-viewport": function() { return require("caniuse-db/features-json/client-hints-dpr-width-viewport.json")},
"clipboard": function() { return require("caniuse-db/features-json/clipboard.json")},
"console-basic": function() { return require("caniuse-db/features-json/console-basic.json")},
"const": function() { return require("caniuse-db/features-json/const.json")},
"contenteditable": function() { return require("caniuse-db/features-json/contenteditable.json")},
"contentsecuritypolicy": function() { return require("caniuse-db/features-json/contentsecuritypolicy.json")},
"contentsecuritypolicy2": function() { return require("caniuse-db/features-json/contentsecuritypolicy2.json")},
"cors": function() { return require("caniuse-db/features-json/cors.json")},
"credential-management": function() { return require("caniuse-db/features-json/credential-management.json")},
"cryptography": function() { return require("caniuse-db/features-json/cryptography.json")},
"css-all": function() { return require("caniuse-db/features-json/css-all.json")},
"css-animation": function() { return require("caniuse-db/features-json/css-animation.json")},
"css-appearance": function() { return require("caniuse-db/features-json/css-appearance.json")},
"css-at-counter-style": function() { return require("caniuse-db/features-json/css-at-counter-style.json")},
"css-backdrop-filter": function() { return require("caniuse-db/features-json/css-backdrop-filter.json")},
"css-background-offsets": function() { return require("caniuse-db/features-json/css-background-offsets.json")},
"css-backgroundblendmode": function() { return require("caniuse-db/features-json/css-backgroundblendmode.json")},
"css-boxdecorationbreak": function() { return require("caniuse-db/features-json/css-boxdecorationbreak.json")},
"css-boxshadow": function() { return require("caniuse-db/features-json/css-boxshadow.json")},
"css-canvas": function() { return require("caniuse-db/features-json/css-canvas.json")},
"css-case-insensitive": function() { return require("caniuse-db/features-json/css-case-insensitive.json")},
"css-clip-path": function() { return require("caniuse-db/features-json/css-clip-path.json")},
"css-containment": function() { return require("caniuse-db/features-json/css-containment.json")},
"css-counters": function() { return require("caniuse-db/features-json/css-counters.json")},
"css-crisp-edges": function() { return require("caniuse-db/features-json/css-crisp-edges.json")},
"css-cross-fade": function() { return require("caniuse-db/features-json/css-cross-fade.json")},
"css-default-pseudo": function() { return require("caniuse-db/features-json/css-default-pseudo.json")},
"css-descendant-gtgt": function() { return require("caniuse-db/features-json/css-descendant-gtgt.json")},
"css-deviceadaptation": function() { return require("caniuse-db/features-json/css-deviceadaptation.json")},
"css-dir-pseudo": function() { return require("caniuse-db/features-json/css-dir-pseudo.json")},
"css-element-function": function() { return require("caniuse-db/features-json/css-element-function.json")},
"css-exclusions": function() { return require("caniuse-db/features-json/css-exclusions.json")},
"css-featurequeries": function() { return require("caniuse-db/features-json/css-featurequeries.json")},
"css-filter-function": function() { return require("caniuse-db/features-json/css-filter-function.json")},
"css-filters": function() { return require("caniuse-db/features-json/css-filters.json")},
"css-first-letter": function() { return require("caniuse-db/features-json/css-first-letter.json")},
"css-fixed": function() { return require("caniuse-db/features-json/css-fixed.json")},
"css-focus-within": function() { return require("caniuse-db/features-json/css-focus-within.json")},
"css-font-stretch": function() { return require("caniuse-db/features-json/css-font-stretch.json")},
"css-gencontent": function() { return require("caniuse-db/features-json/css-gencontent.json")},
"css-gradients": function() { return require("caniuse-db/features-json/css-gradients.json")},
"css-grid": function() { return require("caniuse-db/features-json/css-grid.json")},
"css-has": function() { return require("caniuse-db/features-json/css-has.json")},
"css-hyphens": function() { return require("caniuse-db/features-json/css-hyphens.json")},
"css-image-orientation": function() { return require("caniuse-db/features-json/css-image-orientation.json")},
"css-image-set": function() { return require("caniuse-db/features-json/css-image-set.json")},
"css-in-out-of-range": function() { return require("caniuse-db/features-json/css-in-out-of-range.json")},
"css-indeterminate-pseudo": function() { return require("caniuse-db/features-json/css-indeterminate-pseudo.json")},
"css-initial-value": function() { return require("caniuse-db/features-json/css-initial-value.json")},
"css-letter-spacing": function() { return require("caniuse-db/features-json/css-letter-spacing.json")},
"css-line-clamp": function() { return require("caniuse-db/features-json/css-line-clamp.json")},
"css-logical-props": function() { return require("caniuse-db/features-json/css-logical-props.json")},
"css-masks": function() { return require("caniuse-db/features-json/css-masks.json")},
"css-matches-pseudo": function() { return require("caniuse-db/features-json/css-matches-pseudo.json")},
"css-media-interaction": function() { return require("caniuse-db/features-json/css-media-interaction.json")},
"css-media-resolution": function() { return require("caniuse-db/features-json/css-media-resolution.json")},
"css-media-scripting": function() { return require("caniuse-db/features-json/css-media-scripting.json")},
"css-mediaqueries": function() { return require("caniuse-db/features-json/css-mediaqueries.json")},
"css-mixblendmode": function() { return require("caniuse-db/features-json/css-mixblendmode.json")},
"css-motion-paths": function() { return require("caniuse-db/features-json/css-motion-paths.json")},
"css-not-sel-list": function() { return require("caniuse-db/features-json/css-not-sel-list.json")},
"css-nth-child-of": function() { return require("caniuse-db/features-json/css-nth-child-of.json")},
"css-opacity": function() { return require("caniuse-db/features-json/css-opacity.json")},
"css-optional-pseudo": function() { return require("caniuse-db/features-json/css-optional-pseudo.json")},
"css-page-break": function() { return require("caniuse-db/features-json/css-page-break.json")},
"css-placeholder-shown": function() { return require("caniuse-db/features-json/css-placeholder-shown.json")},
"css-placeholder": function() { return require("caniuse-db/features-json/css-placeholder.json")},
"css-read-only-write": function() { return require("caniuse-db/features-json/css-read-only-write.json")},
"css-reflections": function() { return require("caniuse-db/features-json/css-reflections.json")},
"css-regions": function() { return require("caniuse-db/features-json/css-regions.json")},
"css-repeating-gradients": function() { return require("caniuse-db/features-json/css-repeating-gradients.json")},
"css-resize": function() { return require("caniuse-db/features-json/css-resize.json")},
"css-revert-value": function() { return require("caniuse-db/features-json/css-revert-value.json")},
"css-scroll-behavior": function() { return require("caniuse-db/features-json/css-scroll-behavior.json")},
"css-scrollbar": function() { return require("caniuse-db/features-json/css-scrollbar.json")},
"css-sel2": function() { return require("caniuse-db/features-json/css-sel2.json")},
"css-sel3": function() { return require("caniuse-db/features-json/css-sel3.json")},
"css-selection": function() { return require("caniuse-db/features-json/css-selection.json")},
"css-shapes": function() { return require("caniuse-db/features-json/css-shapes.json")},
"css-snappoints": function() { return require("caniuse-db/features-json/css-snappoints.json")},
"css-sticky": function() { return require("caniuse-db/features-json/css-sticky.json")},
"css-supports-api": function() { return require("caniuse-db/features-json/css-supports-api.json")},
"css-table": function() { return require("caniuse-db/features-json/css-table.json")},
"css-text-align-last": function() { return require("caniuse-db/features-json/css-text-align-last.json")},
"css-text-justify": function() { return require("caniuse-db/features-json/css-text-justify.json")},
"css-text-spacing": function() { return require("caniuse-db/features-json/css-text-spacing.json")},
"css-textshadow": function() { return require("caniuse-db/features-json/css-textshadow.json")},
"css-touch-action": function() { return require("caniuse-db/features-json/css-touch-action.json")},
"css-transitions": function() { return require("caniuse-db/features-json/css-transitions.json")},
"css-unset-value": function() { return require("caniuse-db/features-json/css-unset-value.json")},
"css-variables": function() { return require("caniuse-db/features-json/css-variables.json")},
"css-widows-orphans": function() { return require("caniuse-db/features-json/css-widows-orphans.json")},
"css-writing-mode": function() { return require("caniuse-db/features-json/css-writing-mode.json")},
"css-zoom": function() { return require("caniuse-db/features-json/css-zoom.json")},
"css3-attr": function() { return require("caniuse-db/features-json/css3-attr.json")},
"css3-boxsizing": function() { return require("caniuse-db/features-json/css3-boxsizing.json")},
"css3-colors": function() { return require("caniuse-db/features-json/css3-colors.json")},
"css3-cursors-grab": function() { return require("caniuse-db/features-json/css3-cursors-grab.json")},
"css3-cursors-newer": function() { return require("caniuse-db/features-json/css3-cursors-newer.json")},
"css3-cursors": function() { return require("caniuse-db/features-json/css3-cursors.json")},
"css3-tabsize": function() { return require("caniuse-db/features-json/css3-tabsize.json")},
"currentcolor": function() { return require("caniuse-db/features-json/currentcolor.json")},
"custom-elements": function() { return require("caniuse-db/features-json/custom-elements.json")},
"customevent": function() { return require("caniuse-db/features-json/customevent.json")},
"datalist": function() { return require("caniuse-db/features-json/datalist.json")},
"dataset": function() { return require("caniuse-db/features-json/dataset.json")},
"datauri": function() { return require("caniuse-db/features-json/datauri.json")},
"details": function() { return require("caniuse-db/features-json/details.json")},
"deviceorientation": function() { return require("caniuse-db/features-json/deviceorientation.json")},
"devicepixelratio": function() { return require("caniuse-db/features-json/devicepixelratio.json")},
"dialog": function() { return require("caniuse-db/features-json/dialog.json")},
"dispatchevent": function() { return require("caniuse-db/features-json/dispatchevent.json")},
"document-currentscript": function() { return require("caniuse-db/features-json/document-currentscript.json")},
"document-execcommand": function() { return require("caniuse-db/features-json/document-execcommand.json")},
"documenthead": function() { return require("caniuse-db/features-json/documenthead.json")},
"dom-manip-convenience": function() { return require("caniuse-db/features-json/dom-manip-convenience.json")},
"dom-range": function() { return require("caniuse-db/features-json/dom-range.json")},
"domcontentloaded": function() { return require("caniuse-db/features-json/domcontentloaded.json")},
"domfocusin-domfocusout-events": function() { return require("caniuse-db/features-json/domfocusin-domfocusout-events.json")},
"download": function() { return require("caniuse-db/features-json/download.json")},
"dragndrop": function() { return require("caniuse-db/features-json/dragndrop.json")},
"element-closest": function() { return require("caniuse-db/features-json/element-closest.json")},
"eot": function() { return require("caniuse-db/features-json/eot.json")},
"es5": function() { return require("caniuse-db/features-json/es5.json")},
"es6-number": function() { return require("caniuse-db/features-json/es6-number.json")},
"eventsource": function() { return require("caniuse-db/features-json/eventsource.json")},
"fetch": function() { return require("caniuse-db/features-json/fetch.json")},
"fieldset-disabled": function() { return require("caniuse-db/features-json/fieldset-disabled.json")},
"fileapi": function() { return require("caniuse-db/features-json/fileapi.json")},
"filereader": function() { return require("caniuse-db/features-json/filereader.json")},
"filesystem": function() { return require("caniuse-db/features-json/filesystem.json")},
"flac": function() { return require("caniuse-db/features-json/flac.json")},
"flexbox": function() { return require("caniuse-db/features-json/flexbox.json")},
"focusin-focusout-events": function() { return require("caniuse-db/features-json/focusin-focusout-events.json")},
"font-feature": function() { return require("caniuse-db/features-json/font-feature.json")},
"font-kerning": function() { return require("caniuse-db/features-json/font-kerning.json")},
"font-loading": function() { return require("caniuse-db/features-json/font-loading.json")},
"font-size-adjust": function() { return require("caniuse-db/features-json/font-size-adjust.json")},
"font-smooth": function() { return require("caniuse-db/features-json/font-smooth.json")},
"font-unicode-range": function() { return require("caniuse-db/features-json/font-unicode-range.json")},
"font-variant-alternates": function() { return require("caniuse-db/features-json/font-variant-alternates.json")},
"fontface": function() { return require("caniuse-db/features-json/fontface.json")},
"form-attribute": function() { return require("caniuse-db/features-json/form-attribute.json")},
"form-validation": function() { return require("caniuse-db/features-json/form-validation.json")},
"forms": function() { return require("caniuse-db/features-json/forms.json")},
"fullscreen": function() { return require("caniuse-db/features-json/fullscreen.json")},
"gamepad": function() { return require("caniuse-db/features-json/gamepad.json")},
"geolocation": function() { return require("caniuse-db/features-json/geolocation.json")},
"getboundingclientrect": function() { return require("caniuse-db/features-json/getboundingclientrect.json")},
"getcomputedstyle": function() { return require("caniuse-db/features-json/getcomputedstyle.json")},
"getelementsbyclassname": function() { return require("caniuse-db/features-json/getelementsbyclassname.json")},
"getrandomvalues": function() { return require("caniuse-db/features-json/getrandomvalues.json")},
"hashchange": function() { return require("caniuse-db/features-json/hashchange.json")},
"hidden": function() { return require("caniuse-db/features-json/hidden.json")},
"high-resolution-time": function() { return require("caniuse-db/features-json/high-resolution-time.json")},
"history": function() { return require("caniuse-db/features-json/history.json")},
"html5semantic": function() { return require("caniuse-db/features-json/html5semantic.json")},
"http2": function() { return require("caniuse-db/features-json/http2.json")},
"iframe-sandbox": function() { return require("caniuse-db/features-json/iframe-sandbox.json")},
"iframe-seamless": function() { return require("caniuse-db/features-json/iframe-seamless.json")},
"iframe-srcdoc": function() { return require("caniuse-db/features-json/iframe-srcdoc.json")},
"ime": function() { return require("caniuse-db/features-json/ime.json")},
"img-naturalwidth-naturalheight": function() { return require("caniuse-db/features-json/img-naturalwidth-naturalheight.json")},
"imports": function() { return require("caniuse-db/features-json/imports.json")},
"indexeddb": function() { return require("caniuse-db/features-json/indexeddb.json")},
"inline-block": function() { return require("caniuse-db/features-json/inline-block.json")},
"innertext": function() { return require("caniuse-db/features-json/innertext.json")},
"input-autocomplete-onoff": function() { return require("caniuse-db/features-json/input-autocomplete-onoff.json")},
"input-color": function() { return require("caniuse-db/features-json/input-color.json")},
"input-datetime": function() { return require("caniuse-db/features-json/input-datetime.json")},
"input-email-tel-url": function() { return require("caniuse-db/features-json/input-email-tel-url.json")},
"input-event": function() { return require("caniuse-db/features-json/input-event.json")},
"input-file-accept": function() { return require("caniuse-db/features-json/input-file-accept.json")},
"input-file-multiple": function() { return require("caniuse-db/features-json/input-file-multiple.json")},
"input-inputmode": function() { return require("caniuse-db/features-json/input-inputmode.json")},
"input-minlength": function() { return require("caniuse-db/features-json/input-minlength.json")},
"input-number": function() { return require("caniuse-db/features-json/input-number.json")},
"input-pattern": function() { return require("caniuse-db/features-json/input-pattern.json")},
"input-placeholder": function() { return require("caniuse-db/features-json/input-placeholder.json")},
"input-range": function() { return require("caniuse-db/features-json/input-range.json")},
"input-search": function() { return require("caniuse-db/features-json/input-search.json")},
"insertadjacenthtml": function() { return require("caniuse-db/features-json/insertadjacenthtml.json")},
"internationalization": function() { return require("caniuse-db/features-json/internationalization.json")},
"intrinsic-width": function() { return require("caniuse-db/features-json/intrinsic-width.json")},
"jpeg2000": function() { return require("caniuse-db/features-json/jpeg2000.json")},
"jpegxr": function() { return require("caniuse-db/features-json/jpegxr.json")},
"json": function() { return require("caniuse-db/features-json/json.json")},
"kerning-pairs-ligatures": function() { return require("caniuse-db/features-json/kerning-pairs-ligatures.json")},
"keyboardevent-charcode": function() { return require("caniuse-db/features-json/keyboardevent-charcode.json")},
"keyboardevent-code": function() { return require("caniuse-db/features-json/keyboardevent-code.json")},
"keyboardevent-getmodifierstate": function() { return require("caniuse-db/features-json/keyboardevent-getmodifierstate.json")},
"keyboardevent-key": function() { return require("caniuse-db/features-json/keyboardevent-key.json")},
"keyboardevent-location": function() { return require("caniuse-db/features-json/keyboardevent-location.json")},
"keyboardevent-which": function() { return require("caniuse-db/features-json/keyboardevent-which.json")},
"lazyload": function() { return require("caniuse-db/features-json/lazyload.json")},
"let": function() { return require("caniuse-db/features-json/let.json")},
"link-icon-png": function() { return require("caniuse-db/features-json/link-icon-png.json")},
"link-icon-svg": function() { return require("caniuse-db/features-json/link-icon-svg.json")},
"link-rel-dns-prefetch": function() { return require("caniuse-db/features-json/link-rel-dns-prefetch.json")},
"link-rel-preconnect": function() { return require("caniuse-db/features-json/link-rel-preconnect.json")},
"link-rel-prefetch": function() { return require("caniuse-db/features-json/link-rel-prefetch.json")},
"link-rel-preload": function() { return require("caniuse-db/features-json/link-rel-preload.json")},
"link-rel-prerender": function() { return require("caniuse-db/features-json/link-rel-prerender.json")},
"matchesselector": function() { return require("caniuse-db/features-json/matchesselector.json")},
"matchmedia": function() { return require("caniuse-db/features-json/matchmedia.json")},
"mathml": function() { return require("caniuse-db/features-json/mathml.json")},
"maxlength": function() { return require("caniuse-db/features-json/maxlength.json")},
"media-attribute": function() { return require("caniuse-db/features-json/media-attribute.json")},
"mediasource": function() { return require("caniuse-db/features-json/mediasource.json")},
"menu": function() { return require("caniuse-db/features-json/menu.json")},
"meter": function() { return require("caniuse-db/features-json/meter.json")},
"midi": function() { return require("caniuse-db/features-json/midi.json")},
"minmaxwh": function() { return require("caniuse-db/features-json/minmaxwh.json")},
"mp3": function() { return require("caniuse-db/features-json/mp3.json")},
"mpeg4": function() { return require("caniuse-db/features-json/mpeg4.json")},
"multibackgrounds": function() { return require("caniuse-db/features-json/multibackgrounds.json")},
"multicolumn": function() { return require("caniuse-db/features-json/multicolumn.json")},
"mutationobserver": function() { return require("caniuse-db/features-json/mutationobserver.json")},
"namevalue-storage": function() { return require("caniuse-db/features-json/namevalue-storage.json")},
"nav-timing": function() { return require("caniuse-db/features-json/nav-timing.json")},
"netinfo": function() { return require("caniuse-db/features-json/netinfo.json")},
"notifications": function() { return require("caniuse-db/features-json/notifications.json")},
"object-fit": function() { return require("caniuse-db/features-json/object-fit.json")},
"object-observe": function() { return require("caniuse-db/features-json/object-observe.json")},
"objectrtc": function() { return require("caniuse-db/features-json/objectrtc.json")},
"offline-apps": function() { return require("caniuse-db/features-json/offline-apps.json")},
"ogg-vorbis": function() { return require("caniuse-db/features-json/ogg-vorbis.json")},
"ogv": function() { return require("caniuse-db/features-json/ogv.json")},
"ol-reversed": function() { return require("caniuse-db/features-json/ol-reversed.json")},
"online-status": function() { return require("caniuse-db/features-json/online-status.json")},
"opus": function() { return require("caniuse-db/features-json/opus.json")},
"outline": function() { return require("caniuse-db/features-json/outline.json")},
"page-transition-events": function() { return require("caniuse-db/features-json/page-transition-events.json")},
"pagevisibility": function() { return require("caniuse-db/features-json/pagevisibility.json")},
"permissions-api": function() { return require("caniuse-db/features-json/permissions-api.json")},
"picture": function() { return require("caniuse-db/features-json/picture.json")},
"png-alpha": function() { return require("caniuse-db/features-json/png-alpha.json")},
"pointer-events": function() { return require("caniuse-db/features-json/pointer-events.json")},
"pointer": function() { return require("caniuse-db/features-json/pointer.json")},
"pointerlock": function() { return require("caniuse-db/features-json/pointerlock.json")},
"progress": function() { return require("caniuse-db/features-json/progress.json")},
"promises": function() { return require("caniuse-db/features-json/promises.json")},
"proximity": function() { return require("caniuse-db/features-json/proximity.json")},
"proxy": function() { return require("caniuse-db/features-json/proxy.json")},
"publickeypinning": function() { return require("caniuse-db/features-json/publickeypinning.json")},
"push-api": function() { return require("caniuse-db/features-json/push-api.json")},
"queryselector": function() { return require("caniuse-db/features-json/queryselector.json")},
"referrer-policy": function() { return require("caniuse-db/features-json/referrer-policy.json")},
"registerprotocolhandler": function() { return require("caniuse-db/features-json/registerprotocolhandler.json")},
"rel-noopener": function() { return require("caniuse-db/features-json/rel-noopener.json")},
"rellist": function() { return require("caniuse-db/features-json/rellist.json")},
"rem": function() { return require("caniuse-db/features-json/rem.json")},
"requestanimationframe": function() { return require("caniuse-db/features-json/requestanimationframe.json")},
"requestidlecallback": function() { return require("caniuse-db/features-json/requestidlecallback.json")},
"resource-timing": function() { return require("caniuse-db/features-json/resource-timing.json")},
"rest-parameters": function() { return require("caniuse-db/features-json/rest-parameters.json")},
"rtcpeerconnection": function() { return require("caniuse-db/features-json/rtcpeerconnection.json")},
"ruby": function() { return require("caniuse-db/features-json/ruby.json")},
"same-site-cookie-attribute": function() { return require("caniuse-db/features-json/same-site-cookie-attribute.json")},
"screen-orientation": function() { return require("caniuse-db/features-json/screen-orientation.json")},
"script-async": function() { return require("caniuse-db/features-json/script-async.json")},
"script-defer": function() { return require("caniuse-db/features-json/script-defer.json")},
"scrollintoview": function() { return require("caniuse-db/features-json/scrollintoview.json")},
"scrollintoviewifneeded": function() { return require("caniuse-db/features-json/scrollintoviewifneeded.json")},
"sdch": function() { return require("caniuse-db/features-json/sdch.json")},
"serviceworkers": function() { return require("caniuse-db/features-json/serviceworkers.json")},
"setimmediate": function() { return require("caniuse-db/features-json/setimmediate.json")},
"shadowdom": function() { return require("caniuse-db/features-json/shadowdom.json")},
"sharedworkers": function() { return require("caniuse-db/features-json/sharedworkers.json")},
"sni": function() { return require("caniuse-db/features-json/sni.json")},
"spdy": function() { return require("caniuse-db/features-json/spdy.json")},
"speech-recognition": function() { return require("caniuse-db/features-json/speech-recognition.json")},
"speech-synthesis": function() { return require("caniuse-db/features-json/speech-synthesis.json")},
"spellcheck-attribute": function() { return require("caniuse-db/features-json/spellcheck-attribute.json")},
"sql-storage": function() { return require("caniuse-db/features-json/sql-storage.json")},
"srcset": function() { return require("caniuse-db/features-json/srcset.json")},
"stream": function() { return require("caniuse-db/features-json/stream.json")},
"stricttransportsecurity": function() { return require("caniuse-db/features-json/stricttransportsecurity.json")},
"style-scoped": function() { return require("caniuse-db/features-json/style-scoped.json")},
"subresource-integrity": function() { return require("caniuse-db/features-json/subresource-integrity.json")},
"svg-css": function() { return require("caniuse-db/features-json/svg-css.json")},
"svg-filters": function() { return require("caniuse-db/features-json/svg-filters.json")},
"svg-fonts": function() { return require("caniuse-db/features-json/svg-fonts.json")},
"svg-fragment": function() { return require("caniuse-db/features-json/svg-fragment.json")},
"svg-html": function() { return require("caniuse-db/features-json/svg-html.json")},
"svg-html5": function() { return require("caniuse-db/features-json/svg-html5.json")},
"svg-img": function() { return require("caniuse-db/features-json/svg-img.json")},
"svg-smil": function() { return require("caniuse-db/features-json/svg-smil.json")},
"svg": function() { return require("caniuse-db/features-json/svg.json")},
"template": function() { return require("caniuse-db/features-json/template.json")},
"testfeat": function() { return require("caniuse-db/features-json/testfeat.json")},
"text-decoration": function() { return require("caniuse-db/features-json/text-decoration.json")},
"text-emphasis": function() { return require("caniuse-db/features-json/text-emphasis.json")},
"text-overflow": function() { return require("caniuse-db/features-json/text-overflow.json")},
"text-size-adjust": function() { return require("caniuse-db/features-json/text-size-adjust.json")},
"text-stroke": function() { return require("caniuse-db/features-json/text-stroke.json")},
"textcontent": function() { return require("caniuse-db/features-json/textcontent.json")},
"tls1-1": function() { return require("caniuse-db/features-json/tls1-1.json")},
"tls1-2": function() { return require("caniuse-db/features-json/tls1-2.json")},
"touch": function() { return require("caniuse-db/features-json/touch.json")},
"transforms2d": function() { return require("caniuse-db/features-json/transforms2d.json")},
"transforms3d": function() { return require("caniuse-db/features-json/transforms3d.json")},
"ttf": function() { return require("caniuse-db/features-json/ttf.json")},
"typedarrays": function() { return require("caniuse-db/features-json/typedarrays.json")},
"u2f": function() { return require("caniuse-db/features-json/u2f.json")},
"upgradeinsecurerequests": function() { return require("caniuse-db/features-json/upgradeinsecurerequests.json")},
"use-strict": function() { return require("caniuse-db/features-json/use-strict.json")},
"user-select-none": function() { return require("caniuse-db/features-json/user-select-none.json")},
"user-timing": function() { return require("caniuse-db/features-json/user-timing.json")},
"vibration": function() { return require("caniuse-db/features-json/vibration.json")},
"video": function() { return require("caniuse-db/features-json/video.json")},
"videotracks": function() { return require("caniuse-db/features-json/videotracks.json")},
"viewport-units": function() { return require("caniuse-db/features-json/viewport-units.json")},
"wai-aria": function() { return require("caniuse-db/features-json/wai-aria.json")},
"wav": function() { return require("caniuse-db/features-json/wav.json")},
"wbr-element": function() { return require("caniuse-db/features-json/wbr-element.json")},
"web-animation": function() { return require("caniuse-db/features-json/web-animation.json")},
"web-bluetooth": function() { return require("caniuse-db/features-json/web-bluetooth.json")},
"webgl": function() { return require("caniuse-db/features-json/webgl.json")},
"webgl2": function() { return require("caniuse-db/features-json/webgl2.json")},
"webm": function() { return require("caniuse-db/features-json/webm.json")},
"webp": function() { return require("caniuse-db/features-json/webp.json")},
"websockets": function() { return require("caniuse-db/features-json/websockets.json")},
"webvtt": function() { return require("caniuse-db/features-json/webvtt.json")},
"webworkers": function() { return require("caniuse-db/features-json/webworkers.json")},
"will-change": function() { return require("caniuse-db/features-json/will-change.json")},
"woff": function() { return require("caniuse-db/features-json/woff.json")},
"woff2": function() { return require("caniuse-db/features-json/woff2.json")},
"word-break": function() { return require("caniuse-db/features-json/word-break.json")},
"wordwrap": function() { return require("caniuse-db/features-json/wordwrap.json")},
"x-doc-messaging": function() { return require("caniuse-db/features-json/x-doc-messaging.json")},
"xhr2": function() { return require("caniuse-db/features-json/xhr2.json")},
"xhtml": function() { return require("caniuse-db/features-json/xhtml.json")},
"xhtmlsmil": function() { return require("caniuse-db/features-json/xhtmlsmil.json")},
"xml-serializer": function() { return require("caniuse-db/features-json/xml-serializer.json")}}
},{"caniuse-db/features-json/aac.json":9,"caniuse-db/features-json/ac3-ec3.json":10,"caniuse-db/features-json/addeventlistener.json":11,"caniuse-db/features-json/ambient-light.json":12,"caniuse-db/features-json/apng.json":13,"caniuse-db/features-json/arrow-functions.json":14,"caniuse-db/features-json/asmjs.json":15,"caniuse-db/features-json/atob-btoa.json":16,"caniuse-db/features-json/audio-api.json":17,"caniuse-db/features-json/audio.json":18,"caniuse-db/features-json/audiotracks.json":19,"caniuse-db/features-json/autofocus.json":20,"caniuse-db/features-json/background-attachment.json":21,"caniuse-db/features-json/background-img-opts.json":22,"caniuse-db/features-json/background-position-x-y.json":23,"caniuse-db/features-json/battery-status.json":24,"caniuse-db/features-json/beacon.json":25,"caniuse-db/features-json/blobbuilder.json":26,"caniuse-db/features-json/bloburls.json":27,"caniuse-db/features-json/border-image.json":28,"caniuse-db/features-json/border-radius.json":29,"caniuse-db/features-json/broadcastchannel.json":30,"caniuse-db/features-json/brotli.json":31,"caniuse-db/features-json/calc.json":32,"caniuse-db/features-json/canvas-blending.json":33,"caniuse-db/features-json/canvas-text.json":34,"caniuse-db/features-json/canvas.json":35,"caniuse-db/features-json/ch-unit.json":36,"caniuse-db/features-json/chacha20-poly1305.json":37,"caniuse-db/features-json/channel-messaging.json":38,"caniuse-db/features-json/classlist.json":39,"caniuse-db/features-json/client-hints-dpr-width-viewport.json":40,"caniuse-db/features-json/clipboard.json":41,"caniuse-db/features-json/console-basic.json":42,"caniuse-db/features-json/const.json":43,"caniuse-db/features-json/contenteditable.json":44,"caniuse-db/features-json/contentsecuritypolicy.json":45,"caniuse-db/features-json/contentsecuritypolicy2.json":46,"caniuse-db/features-json/cors.json":47,"caniuse-db/features-json/credential-management.json":48,"caniuse-db/features-json/cryptography.json":49,"caniuse-db/features-json/css-all.json":50,"caniuse-db/features-json/css-animation.json":51,"caniuse-db/features-json/css-appearance.json":52,"caniuse-db/features-json/css-at-counter-style.json":53,"caniuse-db/features-json/css-backdrop-filter.json":54,"caniuse-db/features-json/css-background-offsets.json":55,"caniuse-db/features-json/css-backgroundblendmode.json":56,"caniuse-db/features-json/css-boxdecorationbreak.json":57,"caniuse-db/features-json/css-boxshadow.json":58,"caniuse-db/features-json/css-canvas.json":59,"caniuse-db/features-json/css-case-insensitive.json":60,"caniuse-db/features-json/css-clip-path.json":61,"caniuse-db/features-json/css-containment.json":62,"caniuse-db/features-json/css-counters.json":63,"caniuse-db/features-json/css-crisp-edges.json":64,"caniuse-db/features-json/css-cross-fade.json":65,"caniuse-db/features-json/css-default-pseudo.json":66,"caniuse-db/features-json/css-descendant-gtgt.json":67,"caniuse-db/features-json/css-deviceadaptation.json":68,"caniuse-db/features-json/css-dir-pseudo.json":69,"caniuse-db/features-json/css-element-function.json":70,"caniuse-db/features-json/css-exclusions.json":71,"caniuse-db/features-json/css-featurequeries.json":72,"caniuse-db/features-json/css-filter-function.json":73,"caniuse-db/features-json/css-filters.json":74,"caniuse-db/features-json/css-first-letter.json":75,"caniuse-db/features-json/css-fixed.json":76,"caniuse-db/features-json/css-focus-within.json":77,"caniuse-db/features-json/css-font-stretch.json":78,"caniuse-db/features-json/css-gencontent.json":79,"caniuse-db/features-json/css-gradients.json":80,"caniuse-db/features-json/css-grid.json":81,"caniuse-db/features-json/css-has.json":82,"caniuse-db/features-json/css-hyphens.json":83,"caniuse-db/features-json/css-image-orientation.json":84,"caniuse-db/features-json/css-image-set.json":85,"caniuse-db/features-json/css-in-out-of-range.json":86,"caniuse-db/features-json/css-indeterminate-pseudo.json":87,"caniuse-db/features-json/css-initial-value.json":88,"caniuse-db/features-json/css-letter-spacing.json":89,"caniuse-db/features-json/css-line-clamp.json":90,"caniuse-db/features-json/css-logical-props.json":91,"caniuse-db/features-json/css-masks.json":92,"caniuse-db/features-json/css-matches-pseudo.json":93,"caniuse-db/features-json/css-media-interaction.json":94,"caniuse-db/features-json/css-media-resolution.json":95,"caniuse-db/features-json/css-media-scripting.json":96,"caniuse-db/features-json/css-mediaqueries.json":97,"caniuse-db/features-json/css-mixblendmode.json":98,"caniuse-db/features-json/css-motion-paths.json":99,"caniuse-db/features-json/css-not-sel-list.json":100,"caniuse-db/features-json/css-nth-child-of.json":101,"caniuse-db/features-json/css-opacity.json":102,"caniuse-db/features-json/css-optional-pseudo.json":103,"caniuse-db/features-json/css-page-break.json":104,"caniuse-db/features-json/css-placeholder-shown.json":105,"caniuse-db/features-json/css-placeholder.json":106,"caniuse-db/features-json/css-read-only-write.json":107,"caniuse-db/features-json/css-reflections.json":108,"caniuse-db/features-json/css-regions.json":109,"caniuse-db/features-json/css-repeating-gradients.json":110,"caniuse-db/features-json/css-resize.json":111,"caniuse-db/features-json/css-revert-value.json":112,"caniuse-db/features-json/css-scroll-behavior.json":113,"caniuse-db/features-json/css-scrollbar.json":114,"caniuse-db/features-json/css-sel2.json":115,"caniuse-db/features-json/css-sel3.json":116,"caniuse-db/features-json/css-selection.json":117,"caniuse-db/features-json/css-shapes.json":118,"caniuse-db/features-json/css-snappoints.json":119,"caniuse-db/features-json/css-sticky.json":120,"caniuse-db/features-json/css-supports-api.json":121,"caniuse-db/features-json/css-table.json":122,"caniuse-db/features-json/css-text-align-last.json":123,"caniuse-db/features-json/css-text-justify.json":124,"caniuse-db/features-json/css-text-spacing.json":125,"caniuse-db/features-json/css-textshadow.json":126,"caniuse-db/features-json/css-touch-action.json":127,"caniuse-db/features-json/css-transitions.json":128,"caniuse-db/features-json/css-unset-value.json":129,"caniuse-db/features-json/css-variables.json":130,"caniuse-db/features-json/css-widows-orphans.json":131,"caniuse-db/features-json/css-writing-mode.json":132,"caniuse-db/features-json/css-zoom.json":133,"caniuse-db/features-json/css3-attr.json":134,"caniuse-db/features-json/css3-boxsizing.json":135,"caniuse-db/features-json/css3-colors.json":136,"caniuse-db/features-json/css3-cursors-grab.json":137,"caniuse-db/features-json/css3-cursors-newer.json":138,"caniuse-db/features-json/css3-cursors.json":139,"caniuse-db/features-json/css3-tabsize.json":140,"caniuse-db/features-json/currentcolor.json":141,"caniuse-db/features-json/custom-elements.json":142,"caniuse-db/features-json/customevent.json":143,"caniuse-db/features-json/datalist.json":144,"caniuse-db/features-json/dataset.json":145,"caniuse-db/features-json/datauri.json":146,"caniuse-db/features-json/details.json":147,"caniuse-db/features-json/deviceorientation.json":148,"caniuse-db/features-json/devicepixelratio.json":149,"caniuse-db/features-json/dialog.json":150,"caniuse-db/features-json/dispatchevent.json":151,"caniuse-db/features-json/document-currentscript.json":152,"caniuse-db/features-json/document-execcommand.json":153,"caniuse-db/features-json/documenthead.json":154,"caniuse-db/features-json/dom-manip-convenience.json":155,"caniuse-db/features-json/dom-range.json":156,"caniuse-db/features-json/domcontentloaded.json":157,"caniuse-db/features-json/domfocusin-domfocusout-events.json":158,"caniuse-db/features-json/download.json":159,"caniuse-db/features-json/dragndrop.json":160,"caniuse-db/features-json/element-closest.json":161,"caniuse-db/features-json/eot.json":162,"caniuse-db/features-json/es5.json":163,"caniuse-db/features-json/es6-number.json":164,"caniuse-db/features-json/eventsource.json":165,"caniuse-db/features-json/fetch.json":166,"caniuse-db/features-json/fieldset-disabled.json":167,"caniuse-db/features-json/fileapi.json":168,"caniuse-db/features-json/filereader.json":169,"caniuse-db/features-json/filesystem.json":170,"caniuse-db/features-json/flac.json":171,"caniuse-db/features-json/flexbox.json":172,"caniuse-db/features-json/focusin-focusout-events.json":173,"caniuse-db/features-json/font-feature.json":174,"caniuse-db/features-json/font-kerning.json":175,"caniuse-db/features-json/font-loading.json":176,"caniuse-db/features-json/font-size-adjust.json":177,"caniuse-db/features-json/font-smooth.json":178,"caniuse-db/features-json/font-unicode-range.json":179,"caniuse-db/features-json/font-variant-alternates.json":180,"caniuse-db/features-json/fontface.json":181,"caniuse-db/features-json/form-attribute.json":182,"caniuse-db/features-json/form-validation.json":183,"caniuse-db/features-json/forms.json":184,"caniuse-db/features-json/fullscreen.json":185,"caniuse-db/features-json/gamepad.json":186,"caniuse-db/features-json/geolocation.json":187,"caniuse-db/features-json/getboundingclientrect.json":188,"caniuse-db/features-json/getcomputedstyle.json":189,"caniuse-db/features-json/getelementsbyclassname.json":190,"caniuse-db/features-json/getrandomvalues.json":191,"caniuse-db/features-json/hashchange.json":192,"caniuse-db/features-json/hidden.json":193,"caniuse-db/features-json/high-resolution-time.json":194,"caniuse-db/features-json/history.json":195,"caniuse-db/features-json/html5semantic.json":196,"caniuse-db/features-json/http2.json":197,"caniuse-db/features-json/iframe-sandbox.json":198,"caniuse-db/features-json/iframe-seamless.json":199,"caniuse-db/features-json/iframe-srcdoc.json":200,"caniuse-db/features-json/ime.json":201,"caniuse-db/features-json/img-naturalwidth-naturalheight.json":202,"caniuse-db/features-json/imports.json":203,"caniuse-db/features-json/indexeddb.json":204,"caniuse-db/features-json/inline-block.json":205,"caniuse-db/features-json/innertext.json":206,"caniuse-db/features-json/input-autocomplete-onoff.json":207,"caniuse-db/features-json/input-color.json":208,"caniuse-db/features-json/input-datetime.json":209,"caniuse-db/features-json/input-email-tel-url.json":210,"caniuse-db/features-json/input-event.json":211,"caniuse-db/features-json/input-file-accept.json":212,"caniuse-db/features-json/input-file-multiple.json":213,"caniuse-db/features-json/input-inputmode.json":214,"caniuse-db/features-json/input-minlength.json":215,"caniuse-db/features-json/input-number.json":216,"caniuse-db/features-json/input-pattern.json":217,"caniuse-db/features-json/input-placeholder.json":218,"caniuse-db/features-json/input-range.json":219,"caniuse-db/features-json/input-search.json":220,"caniuse-db/features-json/insertadjacenthtml.json":221,"caniuse-db/features-json/internationalization.json":222,"caniuse-db/features-json/intrinsic-width.json":223,"caniuse-db/features-json/jpeg2000.json":224,"caniuse-db/features-json/jpegxr.json":225,"caniuse-db/features-json/json.json":226,"caniuse-db/features-json/kerning-pairs-ligatures.json":227,"caniuse-db/features-json/keyboardevent-charcode.json":228,"caniuse-db/features-json/keyboardevent-code.json":229,"caniuse-db/features-json/keyboardevent-getmodifierstate.json":230,"caniuse-db/features-json/keyboardevent-key.json":231,"caniuse-db/features-json/keyboardevent-location.json":232,"caniuse-db/features-json/keyboardevent-which.json":233,"caniuse-db/features-json/lazyload.json":234,"caniuse-db/features-json/let.json":235,"caniuse-db/features-json/link-icon-png.json":236,"caniuse-db/features-json/link-icon-svg.json":237,"caniuse-db/features-json/link-rel-dns-prefetch.json":238,"caniuse-db/features-json/link-rel-preconnect.json":239,"caniuse-db/features-json/link-rel-prefetch.json":240,"caniuse-db/features-json/link-rel-preload.json":241,"caniuse-db/features-json/link-rel-prerender.json":242,"caniuse-db/features-json/matchesselector.json":243,"caniuse-db/features-json/matchmedia.json":244,"caniuse-db/features-json/mathml.json":245,"caniuse-db/features-json/maxlength.json":246,"caniuse-db/features-json/media-attribute.json":247,"caniuse-db/features-json/mediasource.json":248,"caniuse-db/features-json/menu.json":249,"caniuse-db/features-json/meter.json":250,"caniuse-db/features-json/midi.json":251,"caniuse-db/features-json/minmaxwh.json":252,"caniuse-db/features-json/mp3.json":253,"caniuse-db/features-json/mpeg4.json":254,"caniuse-db/features-json/multibackgrounds.json":255,"caniuse-db/features-json/multicolumn.json":256,"caniuse-db/features-json/mutationobserver.json":257,"caniuse-db/features-json/namevalue-storage.json":258,"caniuse-db/features-json/nav-timing.json":259,"caniuse-db/features-json/netinfo.json":260,"caniuse-db/features-json/notifications.json":261,"caniuse-db/features-json/object-fit.json":262,"caniuse-db/features-json/object-observe.json":263,"caniuse-db/features-json/objectrtc.json":264,"caniuse-db/features-json/offline-apps.json":265,"caniuse-db/features-json/ogg-vorbis.json":266,"caniuse-db/features-json/ogv.json":267,"caniuse-db/features-json/ol-reversed.json":268,"caniuse-db/features-json/online-status.json":269,"caniuse-db/features-json/opus.json":270,"caniuse-db/features-json/outline.json":271,"caniuse-db/features-json/page-transition-events.json":272,"caniuse-db/features-json/pagevisibility.json":273,"caniuse-db/features-json/permissions-api.json":274,"caniuse-db/features-json/picture.json":275,"caniuse-db/features-json/png-alpha.json":276,"caniuse-db/features-json/pointer-events.json":277,"caniuse-db/features-json/pointer.json":278,"caniuse-db/features-json/pointerlock.json":279,"caniuse-db/features-json/progress.json":280,"caniuse-db/features-json/promises.json":281,"caniuse-db/features-json/proximity.json":282,"caniuse-db/features-json/proxy.json":283,"caniuse-db/features-json/publickeypinning.json":284,"caniuse-db/features-json/push-api.json":285,"caniuse-db/features-json/queryselector.json":286,"caniuse-db/features-json/referrer-policy.json":287,"caniuse-db/features-json/registerprotocolhandler.json":288,"caniuse-db/features-json/rel-noopener.json":289,"caniuse-db/features-json/rellist.json":290,"caniuse-db/features-json/rem.json":291,"caniuse-db/features-json/requestanimationframe.json":292,"caniuse-db/features-json/requestidlecallback.json":293,"caniuse-db/features-json/resource-timing.json":294,"caniuse-db/features-json/rest-parameters.json":295,"caniuse-db/features-json/rtcpeerconnection.json":296,"caniuse-db/features-json/ruby.json":297,"caniuse-db/features-json/same-site-cookie-attribute.json":298,"caniuse-db/features-json/screen-orientation.json":299,"caniuse-db/features-json/script-async.json":300,"caniuse-db/features-json/script-defer.json":301,"caniuse-db/features-json/scrollintoview.json":302,"caniuse-db/features-json/scrollintoviewifneeded.json":303,"caniuse-db/features-json/sdch.json":304,"caniuse-db/features-json/serviceworkers.json":305,"caniuse-db/features-json/setimmediate.json":306,"caniuse-db/features-json/shadowdom.json":307,"caniuse-db/features-json/sharedworkers.json":308,"caniuse-db/features-json/sni.json":309,"caniuse-db/features-json/spdy.json":310,"caniuse-db/features-json/speech-recognition.json":311,"caniuse-db/features-json/speech-synthesis.json":312,"caniuse-db/features-json/spellcheck-attribute.json":313,"caniuse-db/features-json/sql-storage.json":314,"caniuse-db/features-json/srcset.json":315,"caniuse-db/features-json/stream.json":316,"caniuse-db/features-json/stricttransportsecurity.json":317,"caniuse-db/features-json/style-scoped.json":318,"caniuse-db/features-json/subresource-integrity.json":319,"caniuse-db/features-json/svg-css.json":320,"caniuse-db/features-json/svg-filters.json":321,"caniuse-db/features-json/svg-fonts.json":322,"caniuse-db/features-json/svg-fragment.json":323,"caniuse-db/features-json/svg-html.json":324,"caniuse-db/features-json/svg-html5.json":325,"caniuse-db/features-json/svg-img.json":326,"caniuse-db/features-json/svg-smil.json":327,"caniuse-db/features-json/svg.json":328,"caniuse-db/features-json/template.json":329,"caniuse-db/features-json/testfeat.json":330,"caniuse-db/features-json/text-decoration.json":331,"caniuse-db/features-json/text-emphasis.json":332,"caniuse-db/features-json/text-overflow.json":333,"caniuse-db/features-json/text-size-adjust.json":334,"caniuse-db/features-json/text-stroke.json":335,"caniuse-db/features-json/textcontent.json":336,"caniuse-db/features-json/tls1-1.json":337,"caniuse-db/features-json/tls1-2.json":338,"caniuse-db/features-json/touch.json":339,"caniuse-db/features-json/transforms2d.json":340,"caniuse-db/features-json/transforms3d.json":341,"caniuse-db/features-json/ttf.json":342,"caniuse-db/features-json/typedarrays.json":343,"caniuse-db/features-json/u2f.json":344,"caniuse-db/features-json/upgradeinsecurerequests.json":345,"caniuse-db/features-json/use-strict.json":346,"caniuse-db/features-json/user-select-none.json":347,"caniuse-db/features-json/user-timing.json":348,"caniuse-db/features-json/vibration.json":349,"caniuse-db/features-json/video.json":350,"caniuse-db/features-json/videotracks.json":351,"caniuse-db/features-json/viewport-units.json":352,"caniuse-db/features-json/wai-aria.json":353,"caniuse-db/features-json/wav.json":354,"caniuse-db/features-json/wbr-element.json":355,"caniuse-db/features-json/web-animation.json":356,"caniuse-db/features-json/web-bluetooth.json":357,"caniuse-db/features-json/webgl.json":358,"caniuse-db/features-json/webgl2.json":359,"caniuse-db/features-json/webm.json":360,"caniuse-db/features-json/webp.json":361,"caniuse-db/features-json/websockets.json":362,"caniuse-db/features-json/webvtt.json":363,"caniuse-db/features-json/webworkers.json":364,"caniuse-db/features-json/will-change.json":365,"caniuse-db/features-json/woff.json":366,"caniuse-db/features-json/woff2.json":367,"caniuse-db/features-json/word-break.json":368,"caniuse-db/features-json/wordwrap.json":369,"caniuse-db/features-json/x-doc-messaging.json":370,"caniuse-db/features-json/xhr2.json":371,"caniuse-db/features-json/xhtml.json":372,"caniuse-db/features-json/xhtmlsmil.json":373,"caniuse-db/features-json/xml-serializer.json":374}],8:[function(require,module,exports){
},{}],9:[function(require,module,exports){
module.exports={
  "title":"AAC audio file format",
  "description":"Advanced Audio Coding format, designed to be the successor format to MP3, with generally better sound quality.",
  "spec":"http://www.digitalpreservation.gov/formats/fdd/fdd000114.shtml",
  "status":"other",
  "links":[
    {
      "url":"https://en.wikipedia.org/wiki/Advanced_Audio_Coding",
      "title":"Wikipedia article"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "Other"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"a #1",
      "23":"a #1",
      "24":"a #1",
      "25":"a #1",
      "26":"a #1",
      "27":"a #1",
      "28":"a #1",
      "29":"a #1",
      "30":"a #1",
      "31":"a #1",
      "32":"a #1",
      "33":"a #1",
      "34":"a #1",
      "35":"a #1",
      "36":"a #1",
      "37":"a #1",
      "38":"a #1",
      "39":"a #1",
      "40":"a #1",
      "41":"a #1",
      "42":"a #1",
      "43":"a #1",
      "44":"a #1",
      "45":"a #1",
      "46":"a #1",
      "47":"a #1",
      "48":"a #1",
      "49":"a #1",
      "50":"a #1"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"u",
      "11":"u",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"y",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"u",
      "4.0-4.1":"y",
      "4.2-4.3":"y",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"y"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"a #1"
    },
    "ie_mob":{
      "10":"y",
      "11":"n"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"Support refers to using the `audio` element, not other conditions.",
  "notes_by_num":{
    "1":"Partial support in Firefox refers to only supporting AAC in an MP4 container and only when the operating system already has the codecs installed."
  },
  "usage_perc_y":83.41,
  "usage_perc_a":7.89,
  "ucprefix":false,
  "parent":"audio",
  "keywords":"audio/aac",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],10:[function(require,module,exports){
module.exports={
  "title":"AC-3 (Dolby Digital) and EC-3 (Dolby Digital Plus) codecs",
  "description":"AC-3 and EC-3 are multi-channel lossy audio codecs, commonly used in movies. AC-3 supports 5.1 channels. Its successor EC-3 (or E-AC-3) supports 15.1 channels and bit rates up to 6144kbit/s. They're standardised as A/52:2012.",
  "spec":"http://atsc.org/standard/a522012-digital-audio-compression-ac-3-e-ac-3-standard-12172012/",
  "status":"other",
  "links":[
    {
      "url":"http://blogs.windows.com/msedgedev/2015/05/26/announcing-dolby-audio-for-high-performance-audio-in-microsoft-edge/",
      "title":"Announcing Dolby Audio for high performance audio in Microsoft Edge"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "Other"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n",
      "51":"n",
      "52":"n",
      "53":"n",
      "54":"n"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n",
      "TP":"n"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"a #1",
      "9.3":"a #1"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"a #1"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"a #1",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"a #1"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Claims \"probably\" support, actual playback is untested"
  },
  "usage_perc_y":1.49,
  "usage_perc_a":14.81,
  "ucprefix":false,
  "parent":"",
  "keywords":"Dolby,AC-3,EC-3,E-AC-3,DD+,Digital Plus,A/52,multi-channel,codec,audio",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":false
}

},{}],11:[function(require,module,exports){
module.exports={
  "title":"EventTarget.addEventListener()",
  "description":"The modern standard API for adding DOM event handlers. Introduced in the DOM Level 2 Events spec. Also implies support for the [capture phase](https://dom.spec.whatwg.org/#dom-event-capturing_phase) of DOM event dispatch and `preventDefault()`.",
  "spec":"https://dom.spec.whatwg.org/#dom-eventtarget-addeventlistener",
  "status":"ls",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/addEventListener",
      "title":"Mozilla Developer Network"
    },
    {
      "url":"https://github.com/Financial-Times/polyfill-service/blob/master/polyfills/Event/polyfill-ie8.js",
      "title":"Financial Times IE8 polyfill"
    },
    {
      "url":"https://github.com/WebReflection/ie8",
      "title":"WebReflection ie8 polyfill"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "DOM"
  ],
  "stats":{
    "ie":{
      "5.5":"n #1",
      "6":"n #1",
      "7":"n #1",
      "8":"n #1",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"y #2",
      "3":"y #2",
      "3.5":"y #2",
      "3.6":"y #2",
      "4":"y #2",
      "5":"y #2",
      "6":"y #2",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"y",
      "3.2":"y",
      "4":"y",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"y",
      "9.5-9.6":"y",
      "10.0-10.1":"y",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"y",
      "4.0-4.1":"y",
      "4.2-4.3":"y",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"y"
    },
    "android":{
      "2.1":"y",
      "2.2":"y",
      "2.3":"y",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"IE<=8 instead only supports the [proprietary `.attachEvent()` method](https://msdn.microsoft.com/en-us/library/ms536343%28VS.85%29.aspx). It also does not support the [capture phase](http://www.w3.org/TR/DOM-Level-3-Events/#event-flow) of DOM event dispatch; it only supports event bubbling.",
    "2":"The `useCapture` parameter is non-optional and must be provided. Future versions made it optional, with a default value of `false`."
  },
  "usage_perc_y":97.33,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"event,target,add,remove,listener,capture,capturing,phase",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],12:[function(require,module,exports){
module.exports={
  "title":"Ambient Light API",
  "description":"Defines events that provide information about the ambient light level, as measured by a device's light sensor.",
  "spec":"http://www.w3.org/TR/ambient-light/",
  "status":"cr",
  "links":[
    {
      "url":"http://aurelio.audero.it/demo/ambient-light-api-demo.html",
      "title":"Demo"
    },
    {
      "url":"http://modernweb.com/2014/05/27/introduction-to-the-ambient-light-api/",
      "title":"Article"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "JS API"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"a #1",
      "23":"a #1",
      "24":"a #1",
      "25":"a #1",
      "26":"a #1",
      "27":"a #1",
      "28":"a #1",
      "29":"a #1",
      "30":"a #1",
      "31":"a #1",
      "32":"a #1",
      "33":"a #1",
      "34":"a #1",
      "35":"a #1",
      "36":"a #1",
      "37":"a #1",
      "38":"a #1",
      "39":"a #1",
      "40":"a #1",
      "41":"a #1",
      "42":"a #1",
      "43":"a #1",
      "44":"a #1",
      "45":"a #1",
      "46":"a #1",
      "47":"a #1",
      "48":"a #1",
      "49":"a #1",
      "50":"a #1"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n",
      "51":"n",
      "52":"n",
      "53":"n",
      "54":"n"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n",
      "TP":"n"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Partial support in desktop Firefox refers to support being limited to Mac OS X. [Support for Windows 7 is in progress](https://bugzilla.mozilla.org/show_bug.cgi?id=754199)"
  },
  "usage_perc_y":0.06,
  "usage_perc_a":7.84,
  "ucprefix":false,
  "parent":"",
  "keywords":"",
  "ie_id":"ambientlightevents",
  "chrome_id":"5298357018820608",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],13:[function(require,module,exports){
module.exports={
  "title":"Animated PNG (APNG)",
  "description":"Like animated GIFs, but allowing 24-bit colors and alpha transparency",
  "spec":"https://wiki.mozilla.org/APNG_Specification",
  "status":"unoff",
  "links":[
    {
      "url":"http://en.wikipedia.org/wiki/APNG",
      "title":"Wikipedia"
    },
    {
      "url":"https://github.com/davidmz/apng-canvas",
      "title":"Polyfill using canvas"
    },
    {
      "url":"https://chrome.google.com/webstore/detail/ehkepjiconegkhpodgoaeamnpckdbblp",
      "title":"Chrome extension providing support"
    },
    {
      "url":"https://wpdev.uservoice.com/forums/257854-microsoft-edge-developer/suggestions/6513393-apng-animated-png-images-support-firefox-and-sa",
      "title":"Microsoft Edge feature request on UserVoice"
    },
    {
      "url":"https://addons.opera.com/en/extensions/details/apng/?display=en",
      "title":"Opera extension providing support"
    },
    {
      "url":"https://code.google.com/p/chromium/issues/detail?id=437662",
      "title":"Chromium issue"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "PNG"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"y",
      "3.5":"y",
      "3.6":"y",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n",
      "51":"n",
      "52":"n",
      "53":"n",
      "54":"n"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"y",
      "10.0-10.1":"y",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"Where support for APNG is missing, only the first frame is displayed",
  "notes_by_num":{
    
  },
  "usage_perc_y":19.19,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],14:[function(require,module,exports){
module.exports={
  "title":"Arrow functions",
  "description":"Function shorthand using `=>` syntax and lexical `this` binding.",
  "spec":"http://www.ecma-international.org/ecma-262/6.0/#sec-arrow-function-definitions",
  "status":"other",
  "links":[
    {
      "url":"https://github.com/lukehoban/es6features#arrows",
      "title":"ECMAScript 6 features: Arrows"
    },
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/Arrow_functions",
      "title":"Arrow Functions (MDN)"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "JS API"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":57.93,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"ES6,JavaScript,fat,arrow,function,lexical,this",
  "ie_id":"arrowfunctiones6",
  "chrome_id":"5047308127305728",
  "firefox_id":"",
  "webkit_id":"feature-arrow-functions",
  "shown":true
}

},{}],15:[function(require,module,exports){
module.exports={
  "title":"asm.js",
  "description":"an extraordinarily optimizable, low-level subset of JavaScript, indended to be a compile target from languages like C++.",
  "spec":"http://asmjs.org/spec/latest/",
  "status":"other",
  "links":[
    {
      "url":"http://asmjs.org/",
      "title":"Homepage"
    },
    {
      "url":"https://github.com/dherman/asm.js/",
      "title":"Source for spec and tools"
    },
    {
      "url":"http://blogs.windows.com/msedgedev/2015/05/07/bringing-asm-js-to-chakra-microsoft-edge/",
      "title":"Bringing Asm.js to Chakra and Microsoft Edge"
    },
    {
      "url":"https://dev.modern.ie/platform/changelog/10532-pc/",
      "title":"Microsoft Edge support announcement"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "JS API",
    "Other"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n d #2",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"a #1",
      "29":"a #1",
      "30":"a #1",
      "31":"a #1",
      "32":"a #1",
      "33":"a #1",
      "34":"a #1",
      "35":"a #1",
      "36":"a #1",
      "37":"a #1",
      "38":"a #1",
      "39":"a #1",
      "40":"a #1",
      "41":"a #1",
      "42":"a #1",
      "43":"a #1",
      "44":"a #1",
      "45":"a #1",
      "46":"a #1",
      "47":"a #1",
      "48":"a #1",
      "49":"a #1",
      "50":"a #1",
      "51":"a #1",
      "52":"a #1",
      "53":"a #1",
      "54":"a #1"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n",
      "TP":"n"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"a #1",
      "16":"a #1",
      "17":"a #1",
      "18":"a #1",
      "19":"a #1",
      "20":"a #1",
      "21":"a #1",
      "22":"a #1",
      "23":"a #1",
      "24":"a #1",
      "25":"a #1",
      "26":"a #1",
      "27":"a #1",
      "28":"a #1",
      "29":"a #1",
      "30":"a #1",
      "31":"a #1",
      "32":"a #1",
      "33":"a #1",
      "34":"a #1",
      "35":"a #1",
      "36":"a #1",
      "37":"a #1",
      "38":"a #1",
      "39":"a #1",
      "40":"a #1"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"a #1"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"a #1"
    },
    "and_chr":{
      "50":"a #1"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Chrome does not support Ahead-Of-Time compilation but performance doubled in Chrome 28: https://en.wikipedia.org/wiki/Asm.js#Implementations",
    "2":"Supported in MS Edge under the \"Enable experimental Javascript features\" flag."
  },
  "usage_perc_y":9.25,
  "usage_perc_a":51.2,
  "ucprefix":false,
  "parent":"",
  "keywords":"asm,asm.js,asmjs,WebAssembly",
  "ie_id":"asmjs",
  "chrome_id":"",
  "firefox_id":"asmjs",
  "webkit_id":"feature-asm.js",
  "shown":true
}

},{}],16:[function(require,module,exports){
module.exports={
  "title":"Base64 encoding and decoding",
  "description":"Utility functions for of encoding and decoding strings to and from base 64: window.atob() and window.btoa().",
  "spec":"https://html.spec.whatwg.org/multipage/webappapis.html#atob",
  "status":"ls",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/API/Window.btoa",
      "title":"MDN article on btoa()"
    },
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/API/Window.atob",
      "title":"MDN article on atob()"
    },
    {
      "url":"https://github.com/davidchambers/Base64.js",
      "title":"Polyfill"
    }
  ],
  "bugs":[
    {
      "description":"To avoid \"Character out of range\" exceptions on Unicode strings, [this workaround](http://stackoverflow.com/questions/30106476/using-javascripts-atob-to-decode-base64-doesnt-properly-decode-utf-8-strings) is necessary"
    }
  ],
  "categories":[
    "JS API"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"y",
      "3":"y",
      "3.5":"y",
      "3.6":"y",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"y",
      "3.2":"y",
      "4":"y",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"u",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"y",
      "4.0-4.1":"y",
      "4.2-4.3":"y",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"y"
    },
    "android":{
      "2.1":"y",
      "2.2":"y",
      "2.3":"y",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"u",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":96.87,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"atob,btoa",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],17:[function(require,module,exports){
module.exports={
  "title":"Web Audio API",
  "description":"High-level JavaScript API for processing and synthesizing audio",
  "spec":"http://www.w3.org/TR/webaudio/",
  "status":"wd",
  "links":[
    {
      "url":"https://github.com/corbanbrook/audionode.js",
      "title":"Polyfill to support Web Audio API in Firefox"
    },
    {
      "url":"http://docs.webplatform.org/wiki/apis/webaudio",
      "title":"WebPlatform Docs"
    },
    {
      "url":"http://www.doboism.com/projects/webaudio-compatibility/",
      "title":"Additional browser compatibility tests for specific features"
    },
    {
      "url":"https://github.com/g200kg/WAAPISim",
      "title":"Polyfill to enable Web Audio API through Firefox Audio Data api or flash"
    }
  ],
  "bugs":[
    {
      "description":"Safari does not appear to support `createMediaElementSource`"
    }
  ],
  "categories":[
    "JS API"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"y x",
      "11":"y x",
      "12":"y x",
      "13":"y x",
      "14":"y x",
      "15":"y x",
      "16":"y x",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y x",
      "27":"y x",
      "28":"y x",
      "29":"y x",
      "30":"y x",
      "31":"y x",
      "32":"y x",
      "33":"y x",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"y x",
      "6.1":"y x",
      "7":"y x",
      "7.1":"y x",
      "8":"y x",
      "9":"y x",
      "9.1":"y x",
      "10":"y x",
      "TP":"y x"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"y x",
      "16":"y x",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"y x",
      "7.0-7.1":"y x",
      "8":"y x",
      "8.1-8.4":"y x",
      "9.0-9.2":"y x",
      "9.3":"y x"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"Not all browsers with support for the Audio API also support media streams (e.g. microphone input). See the [getUserMedia/Streams API](/#feat=stream) data for support for that feature.\r\n\r\nFirefox versions < 25 support an alternative, deprecated audio API.\r\n\r\nChrome support [went through some changes](http://updates.html5rocks.com/2014/07/Web-Audio-Changes-in-m36) as of version 36.",
  "notes_by_num":{
    
  },
  "usage_perc_y":74.91,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"web-audio,webaudio,AudioContext,AudioBuffer,AudioNode",
  "ie_id":"webaudioapi",
  "chrome_id":"6261718720184320",
  "firefox_id":"webaudio",
  "webkit_id":"",
  "shown":true
}

},{}],18:[function(require,module,exports){
module.exports={
  "title":"Audio element",
  "description":"Method of playing sound on webpages (without requiring a plug-in).",
  "spec":"https://html.spec.whatwg.org/multipage/embedded-content.html#the-audio-element",
  "status":"ls",
  "links":[
    {
      "url":"http://html5doctor.com/native-audio-in-the-browser/",
      "title":"HTML5 Doctor article"
    },
    {
      "url":"https://dev.opera.com/articles/view/everything-you-need-to-know-about-html5-video-and-audio/",
      "title":"Detailed article on video/audio elements"
    },
    {
      "url":"http://www.jplayer.org/latest/demos/",
      "title":"Demos of audio player that uses the audio element"
    },
    {
      "url":"http://24ways.org/2010/the-state-of-html5-audio",
      "title":"Detailed article on support"
    },
    {
      "url":"http://textopia.org/androidsoundformats.html",
      "title":"File format test page"
    },
    {
      "url":"http://www.phoboslab.org/log/2011/03/the-state-of-html5-audio",
      "title":"The State of HTML5 Audio"
    },
    {
      "url":"https://raw.github.com/phiggins42/has.js/master/detect/audio.js#audio",
      "title":"has.js test"
    },
    {
      "url":"http://docs.webplatform.org/wiki/html/elements/audio",
      "title":"WebPlatform Docs"
    }
  ],
  "bugs":[
    {
      "description":"Volume is read-only on iOS."
    },
    {
      "description":"Chrome on Android does [not support autoplay](https://code.google.com/p/chromium/issues/detail?id=178297) as advised by the specification."
    },
    {
      "description":"Chrome on Android does [not support changing playbackrate](https://developer.mozilla.org/en-US/Apps/Build/Audio_and_video_delivery/WebAudio_playbackRate_explained) as advised by the specification."
    }
  ],
  "categories":[
    "HTML5"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"y",
      "3.6":"y",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"y",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"a",
      "10.0-10.1":"a",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"y",
      "4.2-4.3":"y",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"y",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"n",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":92.54,
  "usage_perc_a":0.02,
  "ucprefix":false,
  "parent":"",
  "keywords":"<audio>",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],19:[function(require,module,exports){
module.exports={
  "title":"Audio Tracks",
  "description":"Method of specifying and selecting between multiple audio tracks. Useful for providing audio descriptions, director's commentary, additional languages, alternative takes, etc.",
  "spec":"https://html.spec.whatwg.org/multipage/embedded-content.html#audiotracklist-and-videotracklist-objects",
  "status":"ls",
  "links":[
    {
      "url":"https://msdn.microsoft.com/en-US/library/hh772483%28v=vs.85%29.aspx",
      "title":"MSDN article"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "HTML5"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n d #1",
      "34":"n d #1",
      "35":"n d #1",
      "36":"n d #1",
      "37":"n d #1",
      "38":"n d #1",
      "39":"n d #1",
      "40":"n d #1",
      "41":"n d #1",
      "42":"n d #1",
      "43":"n d #1",
      "44":"n d #1",
      "45":"n d #1",
      "46":"n d #1",
      "47":"n d #1",
      "48":"n d #1",
      "49":"n d #1",
      "50":"n d #1"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n",
      "51":"n",
      "52":"n",
      "53":"n",
      "54":"n"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Supported in Firefox by enabling \"media.track.enabled\" in about:config"
  },
  "usage_perc_y":18.62,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"AudioTrack,AudioTrackList,media,multiple,selection",
  "ie_id":"audiotracks",
  "chrome_id":"5748496434987008",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],20:[function(require,module,exports){
module.exports={
  "title":"Autofocus attribute",
  "description":"Allows a form field to be immediately focused on page load.",
  "spec":"https://html.spec.whatwg.org/multipage/forms.html#autofocusing-a-form-control:-the-autofocus-attribute",
  "status":"ls",
  "links":[
    {
      "url":"http://davidwalsh.name/autofocus",
      "title":"Article on autofocus"
    }
  ],
  "bugs":[
    {
      "description":"Firefox [has a bug](https://bugzilla.mozilla.org/show_bug.cgi?id=712130) where `autofocus` doesn't always scroll to the correct part of the page."
    }
  ],
  "categories":[
    "HTML5"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"y",
      "10.0-10.1":"y",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"While not supported in iOS Safari, it does work in iOS WebViews.",
  "notes_by_num":{
    
  },
  "usage_perc_y":76.55,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],21:[function(require,module,exports){
module.exports={
  "title":"CSS background-attachment",
  "description":"Method of defining how a background image is attached to a scrollable element. Values include `scroll` (default), `fixed` and `local`.",
  "spec":"http://www.w3.org/TR/css3-background/#the-background-attachment",
  "status":"cr",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/background-attachment",
      "title":"MDN article"
    }
  ],
  "bugs":[
    {
      "description":"iOS has an issue preventing `background-position: fixed` from being used with `background-size: cover` - [see details](http://stackoverflow.com/questions/21476380/background-size-on-ios)"
    },
    {
      "description":"Chrome has an issue that occurs when using the will-change property on a selector which also has `background-attachment: fixed` defined. It causes the image to get cut off and gain whitespace around it. "
    }
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"a #1",
      "6":"a #1",
      "7":"a #1",
      "8":"a #1",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"a #1",
      "3":"a #1",
      "3.5":"a #1",
      "3.6":"a #1",
      "4":"a #1",
      "5":"a #1",
      "6":"a #1",
      "7":"a #1",
      "8":"a #1",
      "9":"a #1",
      "10":"a #1",
      "11":"a #1",
      "12":"a #1",
      "13":"a #1",
      "14":"a #1",
      "15":"a #1",
      "16":"a #1",
      "17":"a #1",
      "18":"a #1",
      "19":"a #1",
      "20":"a #1",
      "21":"a #1",
      "22":"a #1",
      "23":"a #1",
      "24":"a #1",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"a #1",
      "3.2":"a #1",
      "4":"a #1",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"a #1",
      "9.5-9.6":"a #1",
      "10.0-10.1":"a #1",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"a #2 #3",
      "6.0-6.1":"a #2 #3",
      "7.0-7.1":"a #2 #3",
      "8":"a #2 #3",
      "8.1-8.4":"a #2 #3",
      "9.0-9.2":"a #2 #3",
      "9.3":"a #2 #3"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"a #1",
      "4.2-4.3":"a #1",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"a #2",
      "10":"a #2"
    },
    "op_mob":{
      "10":"a #1",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"a #2"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"a #1"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"Most mobile devices have a delay in updating the background position after scrolling a page with `fixed` backgrounds.",
  "notes_by_num":{
    "1":"Partial support refers to supporting `fixed` but not `local`",
    "2":"Only supports `local` when `-webkit-overflow-scrolling: touch` is _not_ used"
  },
  "usage_perc_y":50.47,
  "usage_perc_a":37.2,
  "ucprefix":false,
  "parent":"",
  "keywords":"",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],22:[function(require,module,exports){
module.exports={
  "title":"CSS3 Background-image options",
  "description":"New properties to affect background images, including background-clip, background-origin and background-size",
  "spec":"http://www.w3.org/TR/css3-background/#backgrounds",
  "status":"cr",
  "links":[
    {
      "url":"http://www.standardista.com/css3/css3-background-properties",
      "title":"Detailed compatibility tables and demos"
    },
    {
      "url":"http://www.css3files.com/background/",
      "title":"Information page"
    },
    {
      "url":"https://github.com/louisremi/background-size-polyfill",
      "title":"Polyfill for IE7-8"
    }
  ],
  "bugs":[
    {
      "description":"iOS Safari has buggy behavior with `background-size: cover;` on a page's body."
    },
    {
      "description":"iOS Safari has buggy behavior with `background-size: cover;` + `background-attachment: fixed;`"
    },
    {
      "description":"Safari (OS X and iOS) and Chrome do not support background-size: 100% <height>px; in combination with SVG images, it leaves them at the original size while other browsers stretch the vector image correctly while leaving the height at the specified number of pixels."
    },
    {
      "description":"Android 4.3 browser and below are reported to not support percentages in `background-size`"
    }
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"a x",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"a #3",
      "5":"a #3",
      "6":"a #3",
      "7":"a #3",
      "8":"a #3",
      "9":"a #3",
      "10":"a #3",
      "11":"a #3",
      "12":"a #3",
      "13":"a #3",
      "14":"a #3",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"a #2 #3",
      "3.2":"a #2 #3",
      "4":"a #2 #3",
      "5":"a #2 #3",
      "5.1":"a #2 #3",
      "6":"a #2 #3",
      "6.1":"a #2 #3",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"a x",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"a",
      "4.0-4.1":"a",
      "4.2-4.3":"a",
      "5.0-5.1":"a #3",
      "6.0-6.1":"a",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"a #1"
    },
    "android":{
      "2.1":"a x",
      "2.2":"a x #3",
      "2.3":"a x #3",
      "3":"a #3",
      "4":"a #3",
      "4.1":"a #3",
      "4.2-4.3":"a #3",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"Safari also supports the unofficial `-webkit-background-clip: text` (only with prefix)",
  "notes_by_num":{
    "1":"Partial support in Opera Mini refers to not supporting background sizing or background attachments. However Opera Mini 7.5 supports background sizing (including cover and contain values).",
    "2":"Partial support in Safari 6 refers to not supporting background sizing offset from edges syntax.",
    "3":"Does not support `background-size` values in the `background` shorthand"
  },
  "usage_perc_y":91.12,
  "usage_perc_a":6.13,
  "ucprefix":false,
  "parent":"",
  "keywords":"",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],23:[function(require,module,exports){
module.exports={
  "title":"background-position-x & background-position-y",
  "description":"CSS longhand properties to define x or y positions separately.",
  "spec":"https://drafts.csswg.org/css-backgrounds-4/#background-position-longhands",
  "status":"unoff",
  "links":[
    {
      "url":"https://msdn.microsoft.com/en-us/library/ms530719%28v=vs.85%29.aspx",
      "title":"MSDN article"
    },
    {
      "url":"https://bugzilla.mozilla.org/show_bug.cgi?id=550426",
      "title":"Firefox implementation bug"
    },
    {
      "url":"http://snook.ca/archives/html_and_css/background-position-x-y",
      "title":"Blog post on background-position-x & y properties"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"y",
      "3.2":"y",
      "4":"y",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"y",
      "4.0-4.1":"y",
      "4.2-4.3":"y",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"y",
      "2.2":"y",
      "2.3":"y",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"A workaround for the lack of support in Firefox 31 - Firefox 48 is to use [CSS variables](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_variables). See [this Stack Overflow answer](http://stackoverflow.com/a/29282573/94197) for an example.",
  "notes_by_num":{
    
  },
  "usage_perc_y":84.85,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],24:[function(require,module,exports){
module.exports={
  "title":"Battery Status API",
  "description":"Method to provide information about the battery status of the hosting device.",
  "spec":"http://www.w3.org/TR/battery-status/",
  "status":"cr",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/WebAPI/Battery_Status",
      "title":"MDN Docs"
    },
    {
      "url":"http://www.smartjava.org/examples/webapi-battery/",
      "title":"Simple demo"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "JS API"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"a x #1",
      "11":"a x #1",
      "12":"a x #1",
      "13":"a x #1",
      "14":"a x #1",
      "15":"a x #1",
      "16":"a #1",
      "17":"a #1",
      "18":"a #1",
      "19":"a #1",
      "20":"a #1",
      "21":"a #1",
      "22":"a #1",
      "23":"a #1",
      "24":"a #1",
      "25":"a #1",
      "26":"a #1",
      "27":"a #1",
      "28":"a #1",
      "29":"a #1",
      "30":"a #1",
      "31":"a #1",
      "32":"a #1",
      "33":"a #1",
      "34":"a #1",
      "35":"a #1",
      "36":"a #1",
      "37":"a #1",
      "38":"a #1",
      "39":"a #1",
      "40":"a #1",
      "41":"a #1",
      "42":"a #1",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n d",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n",
      "TP":"n"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"a #1"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Partial support refers to support for the older specification's `navigator.battery` rather than `navigator.getBattery()` to access the `BatteryManager`."
  },
  "usage_perc_y":59.37,
  "usage_perc_a":7.85,
  "ucprefix":false,
  "parent":"",
  "keywords":"navigator.battery,navigator.getbattery,batterymanager",
  "ie_id":"batterystatusapi",
  "chrome_id":"4537134732017664",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],25:[function(require,module,exports){
module.exports={
  "title":"Beacon API",
  "description":"Allows data to be sent asynchronously to a server with `navigator.sendBeacon`, even after a page was closed. Useful for posting analytics data the moment a user was finished using the page.",
  "spec":"http://www.w3.org/TR/beacon/",
  "status":"wd",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/API/Navigator/sendBeacon",
      "title":"MDN article"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "JS API"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n",
      "TP":"n"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":60.05,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"",
  "ie_id":"beacon",
  "chrome_id":"5517433905348608",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],26:[function(require,module,exports){
module.exports={
  "title":"Blob constructing",
  "description":"Construct Blobs (binary large objects) either using the BlobBuilder API (deprecated) or the Blob constructor.",
  "spec":"http://www.w3.org/TR/FileAPI/#constructorBlob",
  "status":"wd",
  "links":[
    {
      "url":"https://developer.mozilla.org/en/DOM/BlobBuilder",
      "title":"MDN article on BlobBuilder"
    },
    {
      "url":"https://developer.mozilla.org/en-US/docs/DOM/Blob",
      "title":"MDN article on Blobs"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "JS API"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"a x",
      "7":"a x",
      "8":"a x",
      "9":"a x",
      "10":"a x",
      "11":"a x",
      "12":"a x",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"a x",
      "9":"a x",
      "10":"a x",
      "11":"a x",
      "12":"a x",
      "13":"a x",
      "14":"a x",
      "15":"a x",
      "16":"a x",
      "17":"a x",
      "18":"a x",
      "19":"a x",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"a x",
      "4":"a x",
      "4.1":"a x",
      "4.2-4.3":"a x",
      "4.4":"a x",
      "4.4.3-4.4.4":"a x",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"y"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"a x"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"Partial support refers to only supporting the now deprecated BlobBuilder to create blobs.",
  "notes_by_num":{
    
  },
  "usage_perc_y":81.16,
  "usage_perc_a":10.55,
  "ucprefix":true,
  "parent":"fileapi",
  "keywords":"",
  "ie_id":"blob",
  "chrome_id":"5328783104016384",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],27:[function(require,module,exports){
module.exports={
  "title":"Blob URLs",
  "description":"Method of creating URL handles to the specified File or Blob object.",
  "spec":"http://www.w3.org/TR/FileAPI/#url",
  "status":"wd",
  "links":[
    {
      "url":"https://developer.mozilla.org/en/DOM/window.URL.createObjectURL",
      "title":"MDN article"
    }
  ],
  "bugs":[
    {
      "description":"Safari has [a serious issue](http://jsfiddle.net/24FhL/) with blobs that are of the type `application/octet-stream`"
    },
    {
      "description":"Chrome on iOS appears to have an issue when opening Blob URLs in another tab [see workaround](http://stackoverflow.com/questions/24485077/how-to-open-blob-url-on-chrome-ios)"
    }
  ],
  "categories":[
    "JS API"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"y x",
      "9":"y x",
      "10":"y x",
      "11":"y x",
      "12":"y x",
      "13":"y x",
      "14":"y x",
      "15":"y x",
      "16":"y x",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"y x",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"y x",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"y x",
      "4.1":"y x",
      "4.2-4.3":"y x",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"y"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y x"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":91.42,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"fileapi",
  "keywords":"createobjecturl,revokeobjecturl",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],28:[function(require,module,exports){
module.exports={
  "title":"CSS3 Border images",
  "description":"Method of using images for borders",
  "spec":"http://www.w3.org/TR/css3-background/#the-border-image",
  "status":"cr",
  "links":[
    {
      "url":"http://www.css3files.com/border/",
      "title":"Information page"
    },
    {
      "url":"http://docs.webplatform.org/wiki/css/properties/border-image",
      "title":"WebPlatform Docs"
    }
  ],
  "bugs":[
    {
      "description":"Firefox is not able to stretch svg images across an element - [bug report](https://bugzilla.mozilla.org/show_bug.cgi?id=619500)."
    },
    {
      "description":"WebKit browsers have a different rendering with the `round` value from other browsers, stretching the border rather than repeating it in certain cases [see bug](https://bugs.webkit.org/show_bug.cgi?id=155955)."
    }
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"y"
    },
    "edge":{
      "12":"y #1",
      "13":"y #1",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"a x #2 #3",
      "3.6":"a x #2 #3",
      "4":"a x #2 #3",
      "5":"a x #2 #3",
      "6":"a x #2 #3",
      "7":"a x #2 #3",
      "8":"a x #2 #3",
      "9":"a x #2 #3",
      "10":"a x #2 #3",
      "11":"a x #2 #3",
      "12":"a x #2 #3",
      "13":"a x #2 #3",
      "14":"a x #2 #3",
      "15":"a #2",
      "16":"a #2",
      "17":"a #2",
      "18":"a #2",
      "19":"a #2",
      "20":"a #2",
      "21":"a #2",
      "22":"a #2",
      "23":"a #2",
      "24":"a #2",
      "25":"a #2",
      "26":"a #2",
      "27":"a #2",
      "28":"a #2",
      "29":"a #2",
      "30":"a #2",
      "31":"a #2",
      "32":"a #2",
      "33":"a #2",
      "34":"a #2",
      "35":"a #2",
      "36":"a #2",
      "37":"a #2",
      "38":"a #2",
      "39":"a #2",
      "40":"a #2",
      "41":"a #2",
      "42":"a #2",
      "43":"a #2",
      "44":"a #2",
      "45":"a #2",
      "46":"a #2",
      "47":"a #2",
      "48":"a #2",
      "49":"a #2",
      "50":"a #2"
    },
    "chrome":{
      "4":"a x #1 #2 #3 #4",
      "5":"a x #1 #2 #3 #4",
      "6":"a x #1 #2 #3 #4",
      "7":"a x #1 #2 #3 #4",
      "8":"a x #1 #2 #3 #4",
      "9":"a x #1 #2 #3 #4",
      "10":"a x #1 #2 #3 #4",
      "11":"a x #1 #2 #3 #4",
      "12":"a x #1 #2 #3 #4",
      "13":"a x #1 #2 #3 #4",
      "14":"a x #1 #2 #3 #4",
      "15":"a #1 #2 #4",
      "16":"a #1 #2 #4",
      "17":"a #1 #2 #4",
      "18":"a #1 #2 #4",
      "19":"a #1 #2 #4",
      "20":"a #1 #2 #4",
      "21":"a #1 #2 #4",
      "22":"a #1 #2 #4",
      "23":"a #1 #2 #4",
      "24":"a #1 #2 #4",
      "25":"a #1 #2 #4",
      "26":"a #1 #2 #4",
      "27":"a #1 #2 #4",
      "28":"a #1 #2 #4",
      "29":"a #1 #2 #4",
      "30":"a #1 #2",
      "31":"a #1 #2",
      "32":"a #1 #2",
      "33":"a #1 #2",
      "34":"a #1 #2",
      "35":"a #1 #2",
      "36":"a #1 #2",
      "37":"a #1 #2",
      "38":"a #1 #2",
      "39":"a #1 #2",
      "40":"a #1 #2",
      "41":"a #1 #2",
      "42":"a #1 #2",
      "43":"a #1 #2",
      "44":"a #1 #2",
      "45":"a #1 #2",
      "46":"a #1 #2",
      "47":"a #1 #2",
      "48":"a #1 #2",
      "49":"a #1 #2",
      "50":"a #1 #2",
      "51":"a #2",
      "52":"a #2",
      "53":"a #2",
      "54":"a #2"
    },
    "safari":{
      "3.1":"a x #1 #2 #3 #4",
      "3.2":"a x #1 #2 #3 #4",
      "4":"a x #1 #2 #3 #4",
      "5":"a x #1 #2 #3 #4",
      "5.1":"a x #1 #2 #3 #4",
      "6":"a #1 #2 #4",
      "6.1":"a #1 #2 #4",
      "7":"a #1 #2 #4",
      "7.1":"a #1 #2 #4",
      "8":"a #1 #2 #4",
      "9":"a #1 #2 #4",
      "9.1":"y #1",
      "10":"y #1",
      "TP":"y #1"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"a #2 #3 #4",
      "10.6":"a #2 #3 #4",
      "11":"a x #2 #3 #4",
      "11.1":"a x #2 #3 #4",
      "11.5":"a x #2 #3 #4",
      "11.6":"a x #2 #3 #4",
      "12":"a x #2 #3 #4",
      "12.1":"a x #2 #3 #4",
      "15":"a #1 #2",
      "16":"a #1 #2",
      "17":"a #1 #2",
      "18":"a #1 #2",
      "19":"a #1 #2",
      "20":"a #1 #2",
      "21":"a #1 #2",
      "22":"a #1 #2",
      "23":"a #1 #2",
      "24":"a #1 #2",
      "25":"a #1 #2",
      "26":"a #1 #2",
      "27":"a #1 #2",
      "28":"a #1 #2",
      "29":"a #1 #2",
      "30":"a #1 #2",
      "31":"a #1 #2",
      "32":"a #1 #2",
      "33":"a #1 #2",
      "34":"a #1 #2",
      "35":"a #1 #2",
      "36":"a #1 #2",
      "37":"a #1 #2",
      "38":"a #2",
      "39":"a #2",
      "40":"a #2"
    },
    "ios_saf":{
      "3.2":"a x #1 #2 #3 #4",
      "4.0-4.1":"a x #1 #2 #3 #4",
      "4.2-4.3":"a x #1 #2 #3 #4",
      "5.0-5.1":"a x #1 #2 #3 #4",
      "6.0-6.1":"a #1 #2 #4",
      "7.0-7.1":"a #1 #2 #4",
      "8":"a #1 #2 #4",
      "8.1-8.4":"a #1 #2 #4",
      "9.0-9.2":"a #1 #2 #4",
      "9.3":"y #1"
    },
    "op_mini":{
      "all":"a x #2 #3 #4"
    },
    "android":{
      "2.1":"a #1 #2 #3 #4",
      "2.2":"a #1 #2 #3 #4",
      "2.3":"a #1 #2 #3 #4",
      "3":"a #1 #2 #3 #4",
      "4":"a #1 #2 #3 #4",
      "4.1":"a #1 #2 #3 #4",
      "4.2-4.3":"a #1 #2 #3 #4",
      "4.4":"a #1 #2",
      "4.4.3-4.4.4":"a #1 #2",
      "50":"a #1 #2"
    },
    "bb":{
      "7":"a #1 #2 #3 #4",
      "10":"a #1 #2 #4"
    },
    "op_mob":{
      "10":"n",
      "11":"a x #2 #3 #4",
      "11.1":"a x #2 #3 #4",
      "11.5":"a x #2 #3 #4",
      "12":"a x #2 #3 #4",
      "12.1":"a x #2 #3 #4",
      "37":"a #1 #2"
    },
    "and_chr":{
      "50":"a #1 #2"
    },
    "and_ff":{
      "46":"a #2"
    },
    "ie_mob":{
      "10":"n",
      "11":"y"
    },
    "and_uc":{
      "9.9":"a #1 #2"
    },
    "samsung":{
      "4":"a #1 #2"
    }
  },
  "notes":"Note that both the `border-style` and `border-width` must be specified (not set to `none` or 0) for border-images to work.",
  "notes_by_num":{
    "1":"Has a bug where `border-image` incorrectly overrides `border-style`. See [test case](http://codepen.io/Savago/pen/yYrgyK), [WebKit bug](https://bugs.webkit.org/show_bug.cgi?id=99922), [discussion](https://github.com/whatwg/compat/issues/17)",
    "2":"Partial support refers to not supporting `border-image-repeat: space`",
    "3":"Partial support refers to supporting the shorthand syntax, but not the individual properties (`border-image-source`, `border-image-slice`, etc). ",
    "4":"Partial support refers to not supporting `border-image-repeat: round`"
  },
  "usage_perc_y":15.6,
  "usage_perc_a":80.61,
  "ucprefix":false,
  "parent":"",
  "keywords":"border-image-source,border-image-slice,border-image-repeat,border-image-width,,border-image-outset",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],29:[function(require,module,exports){
module.exports={
  "title":"CSS3 Border-radius (rounded corners)",
  "description":"Method of making the border corners round. Covers support for the shorthand `border-radius` as well as the long-hand properties (e.g. `border-top-left-radius`)",
  "spec":"http://www.w3.org/TR/css3-background/#the-border-radius",
  "status":"cr",
  "links":[
    {
      "url":"http://border-radius.com",
      "title":"Border-radius CSS Generator"
    },
    {
      "url":"http://muddledramblings.com/table-of-css3-border-radius-compliance",
      "title":"Detailed compliance table"
    },
    {
      "url":"http://www.css3files.com/border/#borderradius",
      "title":"Information page"
    },
    {
      "url":"http://css3pie.com/",
      "title":"Polyfill which includes border-radius"
    },
    {
      "url":"http://docs.webplatform.org/wiki/css/properties/border-radius",
      "title":"WebPlatform Docs"
    }
  ],
  "bugs":[
    {
      "description":"Safari does not apply `border-radius` correctly to image borders: http://stackoverflow.com/q/17202128"
    },
    {
      "description":"Android Browser 2.3 does not support % value for `border-radius`."
    },
    {
      "description":"Border-radius does not work on fieldset elements in IE9."
    },
    {
      "description":"The stock browser on the Samsung Galaxy S4 with Android 4.2 does not support the `border-radius` shorthand property but does support the long-hand properties for each corner like `border-top-left-radius`."
    },
    {
      "description":"Older versions of Safari [had a bug](https://bugs.webkit.org/show_bug.cgi?id=50072) where background images would bleed out of the border-radius."
    },
    {
      "description":"Dotted and dashed rounded border corners are rendered as solid in Firefox. [see bug](https://bugzilla.mozilla.org/show_bug.cgi?id=382721)"
    }
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"a x",
      "3":"y x",
      "3.5":"y x",
      "3.6":"y x",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y x",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"y x",
      "3.2":"y x",
      "4":"y x",
      "5":"y",
      "5.1":"y #1",
      "6":"y #1",
      "6.1":"y #1",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"y x",
      "4.0-4.1":"y",
      "4.2-4.3":"y",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"y x",
      "2.2":"y",
      "2.3":"y",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"n",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Safari 6.1 and earlier did not apply `border-radius` correctly to image borders: http://stackoverflow.com/q/17202128"
  },
  "usage_perc_y":92.59,
  "usage_perc_a":0.02,
  "ucprefix":false,
  "parent":"",
  "keywords":"roundedcorners, border radius,-moz-border-radius",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],30:[function(require,module,exports){
module.exports={
  "title":"BroadcastChannel",
  "description":"BroadcastChannel allows scripts from the same origin but other browsing contexts (windows, workers) to send each other messages.",
  "spec":"https://html.spec.whatwg.org/multipage/comms.html#broadcasting-to-other-browsing-contexts",
  "status":"ls",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/API/BroadcastChannel",
      "title":"MDN article"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "JS API"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n",
      "51":"n",
      "52":"n",
      "53":"n",
      "54":"n"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n",
      "TP":"n"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":7.34,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"broadcast,channel,messaging",
  "ie_id":"",
  "chrome_id":"4585496197988352",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],31:[function(require,module,exports){
module.exports={
  "title":"Brotli Accept-Encoding/Content-Encoding",
  "description":"More effective lossless compression algorithm than gzip and deflate.",
  "spec":"https://github.com/google/brotli",
  "status":"other",
  "links":[
    {
      "url":"http://google-opensource.blogspot.com/2015/09/introducing-brotli-new-compression.html",
      "title":"Introducing Brotli"
    },
    {
      "url":"https://groups.google.com/a/chromium.org/forum/m/#!msg/blink-dev/JufzX024oy0/WEOGbN43AwAJ",
      "title":"Blink's intent to ship"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "Other"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n d #1",
      "50":"y #2",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n",
      "TP":"n"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n d #1",
      "37":"n d #1",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"y #2"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"y #2"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Supported in Chrome and Opera behind the 'Brotli Content-Encoding' flag",
    "2":"Enabled since 27 May 2016"
  },
  "usage_perc_y":50.74,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"http,compression,accept,content,encoding",
  "ie_id":"brotlicompresseddataformat",
  "chrome_id":"5420797577396224",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],32:[function(require,module,exports){
module.exports={
  "title":"calc() as CSS unit value",
  "description":"Method of allowing calculated values for length units, i.e. `width: calc(100% - 3em)`",
  "spec":"http://www.w3.org/TR/css3-values/#calc",
  "status":"cr",
  "links":[
    {
      "url":"http://hacks.mozilla.org/2010/06/css3-calc/",
      "title":"Mozilla Hacks article"
    },
    {
      "url":"https://developer.mozilla.org/en/docs/Web/CSS/calc",
      "title":"MDN article"
    },
    {
      "url":"http://docs.webplatform.org/wiki/css/functions/calc",
      "title":"WebPlatform Docs"
    }
  ],
  "bugs":[
    {
      "description":"IE10 crashes when a div with a property using `calc()` has a child with [same property with inherit](http://stackoverflow.com/questions/19423384/css-less-calc-method-is-crashing-my-ie10)."
    },
    {
      "description":"IE 9 - 11 don't render `box-shadow` when `calc()` is used for any of the values"
    },
    {
      "description":"IE10 and IE11 don't support using `calc()` inside a `transform`. [Bug report](https://connect.microsoft.com/IE/feedback/details/814380/)"
    },
    {
      "description":"Safari & iOS Safari (both 6 and 7) does not support viewport units (`vw`, `vh`, etc) in `calc()`."
    },
    {
      "description":"IE & Edge are reported to not support calc inside a 'flex'. (Not tested on older versions)\r\nThis example does not work: `flex: 1 1 calc(50% - 20px);`"
    },
    {
      "description":"Firefox does not support `calc()` inside the `line-height`, `stroke-width`, `stroke-dashoffset`, and `stroke-dasharray` properties. [Bug report](https://bugzilla.mozilla.org/show_bug.cgi?id=594933)"
    },
    {
      "description":"IE11 is reported to have trouble with `calc()` with nested expressions, e.g. `width: calc((100% - 10px) / 3);` (i.e. it rounds differently)"
    },
    {
      "description":"IE11 is reported to not support `calc()` correctly in [generated content](http://stackoverflow.com/questions/31323915/internet-explorer-incorrectly-calculates-percentage-height-for-generated-content)"
    },
    {
      "description":"IE11 does not support transitioning values set with `calc()`"
    }
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"a #2",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"y x",
      "5":"y x",
      "6":"y x",
      "7":"y x",
      "8":"y x",
      "9":"y x",
      "10":"y x",
      "11":"y x",
      "12":"y x",
      "13":"y x",
      "14":"y x",
      "15":"y x",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"y x",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"y x",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"a #1",
      "4.4.3-4.4.4":"a #1",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"y"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"Support can be somewhat emulated in older versions of IE using the non-standard `expression()` syntax.\r\n\r\nDue to the way browsers handle [sub-pixel rounding](http://ejohn.org/blog/sub-pixel-problems-in-css/) differently, layouts using `calc()` expressions may have unexpected results.",
  "notes_by_num":{
    "1":"Partial support in Android Browser 4.4 refers to the browser lacking the ability to multiply and divide values.",
    "2":"Partial support in IE9 refers to the browser crashing when used as a `background-position` value."
  },
  "usage_perc_y":81.2,
  "usage_perc_a":3.06,
  "ucprefix":false,
  "parent":"",
  "keywords":"",
  "ie_id":"csscalc",
  "chrome_id":"5765241438732288",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],33:[function(require,module,exports){
module.exports={
  "title":"Canvas blend modes",
  "description":"Method of defining the effect resulting from overlaying two layers on a Canvas element.",
  "spec":"http://www.w3.org/TR/compositing-1/#blending",
  "status":"cr",
  "links":[
    {
      "url":"http://blogs.adobe.com/webplatform/2013/01/28/blending-features-in-canvas/",
      "title":"Blog post"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "Canvas"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":76.12,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"canvas",
  "keywords":"",
  "ie_id":"compositingandblendingincanvas2d",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],34:[function(require,module,exports){
module.exports={
  "title":"Text API for Canvas",
  "description":"Method of displaying text on Canvas elements",
  "spec":"https://html.spec.whatwg.org/multipage/scripting.html#drawing-text-to-the-bitmap",
  "status":"ls",
  "links":[
    {
      "url":"https://developer.mozilla.org/en/Drawing_text_using_a_canvas#Additional_examples",
      "title":"Examples by Mozilla"
    },
    {
      "url":"http://code.google.com/p/canvas-text/",
      "title":"Support library"
    },
    {
      "url":"https://raw.github.com/phiggins42/has.js/master/detect/graphics.js#canvas-text",
      "title":"has.js test"
    },
    {
      "url":"http://docs.webplatform.org/wiki/apis/canvas/CanvasRenderingContext2D/fillText",
      "title":"WebPlatform Docs"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "Canvas",
    "HTML5"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"p",
      "7":"p",
      "8":"p",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"p",
      "3":"p",
      "3.5":"y",
      "3.6":"y",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"p",
      "3.2":"p",
      "4":"y",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"p",
      "9.5-9.6":"p",
      "10.0-10.1":"p",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"y",
      "4.0-4.1":"y",
      "4.2-4.3":"y",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"y",
      "2.2":"y",
      "2.3":"y",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"p",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":92.54,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"canvas",
  "keywords":"",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],35:[function(require,module,exports){
module.exports={
  "title":"Canvas (basic support)",
  "description":"Method of generating fast, dynamic graphics using JavaScript.",
  "spec":"https://html.spec.whatwg.org/multipage/scripting.html#the-canvas-element",
  "status":"ls",
  "links":[
    {
      "url":"https://developer.mozilla.org/en/Canvas_tutorial",
      "title":"Tutorial by Mozilla"
    },
    {
      "url":"http://www.canvasdemos.com/",
      "title":"Showcase site"
    },
    {
      "url":"http://glimr.rubyforge.org/cake/canvas.html",
      "title":"Animation kit"
    },
    {
      "url":"http://diveintohtml5.info/canvas.html",
      "title":"Another tutorial"
    },
    {
      "url":"http://explorercanvas.googlecode.com/",
      "title":"Implementation for Internet Explorer"
    },
    {
      "url":"https://raw.github.com/phiggins42/has.js/master/detect/graphics.js#canvas",
      "title":"has.js test"
    }
  ],
  "bugs":[
    {
      "description":"The Android browser does not support clipping on HTML5 canvas. See the bug filed here: http://code.google.com/p/android/issues/detail?id=21099"
    },
    {
      "description":"Older versions of iOS did not support video as a source for the canvas `drawImage()`, though it does appear to work as of iOS 8 [test case](http://jsfiddle.net/zL8KC/)"
    },
    {
      "description":"Limits of `toDataURL()` for iOS:\r\n- The maximum size for decoded GIF, PNG, and TIFF images is 3 megapixels for devices with less than 256 MB RAM and 5 megapixels for devices with greater or equal than 256 MB RAM.\r\n- The maximum size for a canvas element is 3 megapixels for devices with less than 256 MB RAM and 5 megapixels for devices with greater or equal than 256 MB RAM.\r\n- JavaScript execution time is limited to 10 seconds for each top-level entry point."
    },
    {
      "description":"In IE 11 `canvas.toDataURL()` does not work if the canvas has images with data URI sources [see bug](https://connect.microsoft.com/IE/Feedback/Details/828416)"
    },
    {
      "description":"IE 10 canvas doesn't support `setLineDash` or `lineDashOffset` [see bug](https://social.msdn.microsoft.com/Forums/en-US/85007e72-90ad-4bd9-affd-9a24702219e6/canvasrenderingcontext2dsetlinedash-and-linedashoffset-missing?forum=winappswithhtml5) "
    },
    {
      "description":"IE and Edge does not support globalAlpha for drawImage of SVG graphics. [see bug](https://connect.microsoft.com/IE/feedback/details/1847897/globalalpha-ignored-when-drawing-svg-to-canvas) [see testcase](http://jsfiddle.net/p7b0wmcu/)"
    }
  ],
  "categories":[
    "Canvas",
    "HTML5"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"p",
      "7":"p",
      "8":"p",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"a #1",
      "3":"a #1",
      "3.5":"a #1",
      "3.6":"y",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"a #1",
      "3.2":"a #1",
      "4":"y",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"y",
      "9.5-9.6":"y",
      "10.0-10.1":"y",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"y",
      "4.0-4.1":"y",
      "4.2-4.3":"y",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"a #2"
    },
    "android":{
      "2.1":"a #1",
      "2.2":"a #1",
      "2.3":"a #1",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"For screen readers, IE, Chrome & Firefox support the [accessible canvas element sub-DOM](http://www.paciellogroup.com/blog/2012/06/html5-canvas-accessibility-in-firefox-13/).\r\nFirefox & Chrome also support the drawfocus ring.",
  "notes_by_num":{
    "1":"Does not support `toDataURL()`",
    "2":"Opera Mini supports the canvas element, but is unable to play animations or run other more complex applications."
  },
  "usage_perc_y":92.55,
  "usage_perc_a":4.78,
  "ucprefix":false,
  "parent":"",
  "keywords":"toDataURL()",
  "ie_id":"canvas",
  "chrome_id":"5100084685438976",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],36:[function(require,module,exports){
module.exports={
  "title":"ch (character) unit",
  "description":"Unit representing the width of the character \"0\" in the current font, of particular use in combination with monospace fonts.",
  "spec":"https://www.w3.org/TR/css3-values/#ch",
  "status":"cr",
  "links":[
    {
      "url":"https://johndjameson.com/blog/making-sense-of-ch-units/",
      "title":"Blog post on using ch units"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"a #1",
      "10":"a #1",
      "11":"a #1"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"y",
      "3":"y",
      "3.5":"y",
      "3.6":"y",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"y"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"IE supports the `ch` unit, but unlike other browsers its width is that specifically of the \"0\" glyph, not its surrounding space. As a result, 3ch for example is shorter in than the width of the string \"000\" in IE."
  },
  "usage_perc_y":78.35,
  "usage_perc_a":5.71,
  "ucprefix":false,
  "parent":"",
  "keywords":"ch unit,character unit",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],37:[function(require,module,exports){
module.exports={
  "title":"ChaCha20-Poly1305 cipher suites for TLS",
  "description":"A set of cipher suites used in Transport Layer Security (TLS) protocol, using ChaCha20 for symmetric encryption and Poly1305 for authentication.",
  "spec":"https://tools.ietf.org/html/rfc7905",
  "status":"other",
  "links":[
    {
      "url":"https://security.googleblog.com/2014/04/speeding-up-and-strengthening-https.html",
      "title":"Chrome article"
    },
    {
      "url":"https://www.ssllabs.com/ssltest/viewMyClient.html",
      "title":"SSL/TLS Capabilities of Your Browser by Qualys SSL Labs"
    },
    {
      "url":"https://wpdev.uservoice.com/forums/257854-microsoft-edge-developer/suggestions/12300414-support-chacha20-poly1305-cipher-suites-in-edge-sc",
      "title":"Microsoft Edge feature request on UserVoice"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "Other"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"y #1",
      "34":"y #1",
      "35":"y #1",
      "36":"y #1",
      "37":"y #1",
      "38":"y #1",
      "39":"y #1",
      "40":"y #1",
      "41":"y #1",
      "42":"y #1",
      "43":"y #1",
      "44":"y #1",
      "45":"y #1",
      "46":"y #1",
      "47":"y #1",
      "48":"y #1",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"u",
      "TP":"n"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"u",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Old versions of Chrome use non-standard code points for ChaCha20-Poly1305 cipher suites."
  },
  "usage_perc_y":56.66,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"chacha20,poly1305,tls,cipher",
  "ie_id":"",
  "chrome_id":"5355238106071040",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],38:[function(require,module,exports){
module.exports={
  "title":"Channel messaging",
  "description":"Method for having two-way communication between browsing contexts (using MessageChannel)",
  "spec":"https://html.spec.whatwg.org/multipage/comms.html#channel-messaging",
  "status":"ls",
  "links":[
    {
      "url":"https://dev.opera.com/articles/view/window-postmessage-messagechannel/#channel",
      "title":"An Introduction to HTML5 web messaging"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "JS API"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n d #1",
      "27":"n d #1",
      "28":"n d #1",
      "29":"n d #1",
      "30":"n d #1",
      "31":"n d #1",
      "32":"n d #1",
      "33":"n d #1",
      "34":"n d #1",
      "35":"n d #1",
      "36":"n d #1",
      "37":"n d #1",
      "38":"n d #1",
      "39":"n d #1",
      "40":"n d #1",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"u",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"n",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Supported in Firefox behind the `dom.messageChannel.enabled` flag. Reported to not work in web workers before version 41."
  },
  "usage_perc_y":89.92,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"x-doc-messaging",
  "keywords":"",
  "ie_id":"messagechannels",
  "chrome_id":"6710044586409984",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],39:[function(require,module,exports){
module.exports={
  "title":"classList (DOMTokenList)",
  "description":"Method of easily manipulating classes on elements, using the DOMTokenList object.",
  "spec":"https://dom.spec.whatwg.org/#dom-element-classlist",
  "status":"ls",
  "links":[
    {
      "url":"http://hacks.mozilla.org/2010/01/classlist-in-firefox-3-6/",
      "title":"Mozilla Hacks article"
    },
    {
      "url":"https://github.com/eligrey/classList.js",
      "title":"Polyfill script"
    },
    {
      "url":"http://docs.webplatform.org/wiki/dom/Element/classList",
      "title":"WebPlatform Docs"
    },
    {
      "url":"http://www.sitepoint.com/exploring-classlist-api/",
      "title":"SitePoint article"
    },
    {
      "url":"http://aurelio.audero.it/demo/classlist-api-demo.html",
      "title":"Demo using classList"
    },
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/API/Element.classList",
      "title":"MDN article"
    }
  ],
  "bugs":[
    {
      "description":"Opera (Presto) has `classList` support on SVG elements, but not on MathML elements."
    }
  ],
  "categories":[
    "DOM",
    "HTML5"
  ],
  "stats":{
    "ie":{
      "5.5":"p",
      "6":"p",
      "7":"p",
      "8":"p",
      "9":"p",
      "10":"a #1 #2 #3",
      "11":"a #1 #2 #3"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"p",
      "3":"p",
      "3.5":"p",
      "3.6":"a #2 #3",
      "4":"a #2 #3",
      "5":"a #2 #3",
      "6":"a #2 #3",
      "7":"a #2 #3",
      "8":"a #2 #3",
      "9":"a #2 #3",
      "10":"a #2 #3",
      "11":"a #2 #3",
      "12":"a #2 #3",
      "13":"a #2 #3",
      "14":"a #2 #3",
      "15":"a #2 #3",
      "16":"a #2 #3",
      "17":"a #2 #3",
      "18":"a #2 #3",
      "19":"a #2 #3",
      "20":"a #2 #3",
      "21":"a #2 #3",
      "22":"a #2 #3",
      "23":"a #2 #3",
      "24":"a #3",
      "25":"a #3",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"p",
      "5":"p",
      "6":"p",
      "7":"p",
      "8":"a #1 #2 #3",
      "9":"a #1 #2 #3",
      "10":"a #1 #2 #3",
      "11":"a #1 #2 #3",
      "12":"a #1 #2 #3",
      "13":"a #1 #2 #3",
      "14":"a #1 #2 #3",
      "15":"a #1 #2 #3",
      "16":"a #1 #2 #3",
      "17":"a #1 #2 #3",
      "18":"a #1 #2 #3",
      "19":"a #1 #2 #3",
      "20":"a #1 #2 #3",
      "21":"a #1 #2 #3",
      "22":"a #1 #2 #3",
      "23":"a #2 #3",
      "24":"a #3",
      "25":"a #3",
      "26":"a #3",
      "27":"a #3",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"p",
      "3.2":"p",
      "4":"p",
      "5":"p",
      "5.1":"a #1 #2 #3",
      "6":"a #1 #2 #3",
      "6.1":"a #1 #2 #3",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"p",
      "9.5-9.6":"p",
      "10.0-10.1":"p",
      "10.5":"p",
      "10.6":"p",
      "11":"p",
      "11.1":"p",
      "11.5":"a #1 #2 #3",
      "11.6":"a #1 #2 #3",
      "12":"a #1 #2 #3",
      "12.1":"a #1 #2 #3",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"p",
      "4.0-4.1":"p",
      "4.2-4.3":"p",
      "5.0-5.1":"a #1 #2 #3",
      "6.0-6.1":"a #1 #2 #3",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"p"
    },
    "android":{
      "2.1":"p",
      "2.2":"p",
      "2.3":"p",
      "3":"a #1 #2 #3",
      "4":"a #1 #2 #3",
      "4.1":"a #1 #2 #3",
      "4.2-4.3":"a #1 #2 #3",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"a #1 #2 #3",
      "10":"y"
    },
    "op_mob":{
      "10":"p",
      "11":"p",
      "11.1":"a #1 #2 #3",
      "11.5":"a #1 #2 #3",
      "12":"a #1 #2 #3",
      "12.1":"a #1 #2 #3",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"a #1 #2 #3",
      "11":"a #1 #2 #3"
    },
    "and_uc":{
      "9.9":"a #1 #2 #3"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Does not have support for `classList` on SVG or MathML elements.",
    "2":"Does not support the second parameter for the `toggle` method",
    "3":"Does not support multiple parameters for the `add()` & `remove()` methods"
  },
  "usage_perc_y":77.05,
  "usage_perc_a":14.92,
  "ucprefix":false,
  "parent":"",
  "keywords":"",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],40:[function(require,module,exports){
module.exports={
  "title":"Client Hints: DPR, Width, Viewport-Width",
  "description":"DPR, Width, and Viewport-Width hints enable proactive content negotiation between client and server, enabling automated delivery of optimized assets - e.g. auto-negotiating image DPR resolution.",
  "spec":"https://tools.ietf.org/html/draft-grigorik-http-client-hints",
  "status":"other",
  "links":[
    {
      "url":"https://developers.google.com/web/updates/2015/09/automating-resource-selection-with-client-hints",
      "title":"Automating resource selection with Client Hints"
    },
    {
      "url":"https://bugzilla.mozilla.org/show_bug.cgi?id=935216",
      "title":"Mozilla Bug 935216 - Implement Client-Hints HTTP header"
    },
    {
      "url":"https://bugs.webkit.org/show_bug.cgi?id=145380",
      "title":"WebKit Bug 145380 - Add Content-DPR header support"
    },
    {
      "url":"https://wpdev.uservoice.com/forums/257854-microsoft-edge-developer/suggestions/6261321-http-client-hints",
      "title":"Microsoft Edge feature request on UserVoice"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "DOM"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n",
      "TP":"n"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":48.03,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"client hints, client-hints, dpr, viewport, content-dpr",
  "ie_id":"httpclienthints",
  "chrome_id":"5504430086553600",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],41:[function(require,module,exports){
module.exports={
  "title":"Clipboard API",
  "description":"API to provide copy, cut and paste events as well as provide access to the OS clipboard.",
  "spec":"http://www.w3.org/TR/clipboard-apis/",
  "status":"wd",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/API/ClipboardEvent",
      "title":"MDN page on ClipboardEvent"
    },
    {
      "url":"https://www.lucidchart.com/techblog/2014/12/02/definitive-guide-copying-pasting-javascript/",
      "title":"Guide on cross-platform clipboard access"
    }
  ],
  "bugs":[
    {
      "description":"Before Firefox 41, `queryCommandEnabled` and `execCommand` with arguments `cut`, `copy` or `paste` would throw errors instead of return `false`."
    }
  ],
  "categories":[
    "JS API"
  ],
  "stats":{
    "ie":{
      "5.5":"a #1 #2 #5",
      "6":"a #1 #2 #5",
      "7":"a #1 #2 #5",
      "8":"a #1 #2 #5",
      "9":"a #1 #2 #5",
      "10":"a #1 #2 #5",
      "11":"a #1 #2 #5"
    },
    "edge":{
      "12":"a #1 #2 #5",
      "13":"a #1 #2 #5",
      "14":"a #1 #2 #5"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"a #2 #3",
      "23":"a #2 #3",
      "24":"a #2 #3",
      "25":"a #2 #3",
      "26":"a #2 #3",
      "27":"a #2 #3",
      "28":"a #2 #3",
      "29":"a #2 #3",
      "30":"a #2 #3",
      "31":"a #2 #3",
      "32":"a #2 #3",
      "33":"a #2 #3",
      "34":"a #2 #3",
      "35":"a #2 #3",
      "36":"a #2 #3",
      "37":"a #2 #3",
      "38":"a #2 #3",
      "39":"a #2 #3",
      "40":"a #2 #3",
      "41":"a #6",
      "42":"a #6",
      "43":"a #6",
      "44":"a #6",
      "45":"a #6",
      "46":"a #6",
      "47":"a #6",
      "48":"a #6",
      "49":"a #6",
      "50":"a #6"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"a #3 #5",
      "14":"a #3 #5",
      "15":"a #3 #5",
      "16":"a #3 #5",
      "17":"a #3 #5",
      "18":"a #3 #5",
      "19":"a #3 #5",
      "20":"a #3 #5",
      "21":"a #3 #5",
      "22":"a #3 #5",
      "23":"a #3 #5",
      "24":"a #3 #5",
      "25":"a #3 #5",
      "26":"a #3 #5",
      "27":"a #3 #5",
      "28":"a #3 #5",
      "29":"a #3 #5",
      "30":"a #3 #5",
      "31":"a #3 #5",
      "32":"a #3 #5",
      "33":"a #3 #5",
      "34":"a #3 #5",
      "35":"a #3 #5",
      "36":"a #3 #5",
      "37":"a #3 #5",
      "38":"a #3 #5",
      "39":"a #3 #5",
      "40":"a #3 #5",
      "41":"a #3 #5",
      "42":"a #3 #5",
      "43":"a #5 #7",
      "44":"a #5 #7",
      "45":"a #5 #7",
      "46":"a #5 #7",
      "47":"a #5 #7",
      "48":"a #5 #7",
      "49":"a #5 #7",
      "50":"a #5 #7",
      "51":"a #5 #7",
      "52":"a #5 #7",
      "53":"a #5 #7",
      "54":"a #5 #7"
    },
    "safari":{
      "3.1":"u",
      "3.2":"u",
      "4":"a #2 #3 #5",
      "5":"a #2 #3 #5",
      "5.1":"a #2 #3 #5",
      "6":"a #2 #3 #5",
      "6.1":"a #2 #3 #5",
      "7":"a #2 #3 #5",
      "7.1":"a #2 #3 #5",
      "8":"a #2 #3 #5",
      "9":"a #2 #3 #5",
      "9.1":"a #2 #3 #5",
      "10":"a #2 #5",
      "TP":"a #2 #5"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"u",
      "12.1":"a #3",
      "15":"a #3 #5",
      "16":"a #3 #5",
      "17":"a #3 #5",
      "18":"a #3 #5",
      "19":"a #3 #5",
      "20":"a #3 #5",
      "21":"a #3 #5",
      "22":"a #3 #5",
      "23":"a #3 #5",
      "24":"a #3 #5",
      "25":"a #3 #5",
      "26":"a #3 #5",
      "27":"a #3 #5",
      "28":"a #3 #5",
      "29":"a #3 #5",
      "30":"a #5 #7",
      "31":"a #5 #7",
      "32":"a #5 #7",
      "33":"a #5 #7",
      "34":"a #5 #7",
      "35":"a #5 #7",
      "36":"a #5 #7",
      "37":"a #5 #7",
      "38":"a #5 #7",
      "39":"a #5 #7",
      "40":"a #5 #7"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"a #2 #3 #5",
      "6.0-6.1":"a #2 #3 #5",
      "7.0-7.1":"a #2 #3 #5",
      "8":"a #2 #3 #5",
      "8.1-8.4":"a #2 #3 #5",
      "9.0-9.2":"a #2 #3 #5",
      "9.3":"a #2 #3 #5"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"a #2 #5",
      "4.4.3-4.4.4":"a #2 #5",
      "50":"a #2 #5"
    },
    "bb":{
      "7":"n",
      "10":"a #2 #5"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"u",
      "37":"a #4 #5"
    },
    "and_chr":{
      "50":"a #5"
    },
    "and_ff":{
      "46":"a #4"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"a #2 #5"
    }
  },
  "notes":"Internet Explorer will display a security prompt for access to the OS clipboard.\r\n\r\nChrome 42+, Opera 29+ and Firefox 41+ support clipboard reading/writing only when part of a user action (click, keydown, etc).\r\n\r\nFirefox 40- users [can enable support](https://developer.mozilla.org/en-US/docs/Midas/Security_preferences) with a security preference setting.",
  "notes_by_num":{
    "1":"Only supports `Text` and `URL` data types and uses [a non-standard method](http://msdn.microsoft.com/en-us/library/ie/ms535220%28v=vs.85%29.aspx) of interacting with the clipboard.",
    "2":"Only fires `copy` event on a valid selection and only `cut` and `paste` in focused editable fields.",
    "3":"Only supports OS clipboard reading/writing via shortcut keys, not through `document.execCommand()`.",
    "4":"Only supports `paste` event (on focused editable field).",
    "5":"Does not support the `ClipboardEvent` constructor",
    "6":"Supports `cut` & `copy` events without a focused editable field, but not `paste` (presumably for security reasons)",
    "7":"Supports `cut` & `copy` events without a focused editable field, but does not fire `paste` with `document.execCommand('paste')`  "
  },
  "usage_perc_y":0,
  "usage_perc_a":84.25,
  "ucprefix":false,
  "parent":"",
  "keywords":"cut,copy,paste,clipboarddata,clipboardevent",
  "ie_id":"clipboardapi",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],42:[function(require,module,exports){
module.exports={
  "title":"Basic console logging functions",
  "description":"Method of outputting data to the browser's console, intended for development purposes.",
  "spec":"https://console.spec.whatwg.org/",
  "status":"ls",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/API/Console",
      "title":"MDN article"
    },
    {
      "url":"https://developer.chrome.com/devtools/docs/console-api",
      "title":"Chrome console reference"
    },
    {
      "url":"https://developer.apple.com/library/mac/documentation/AppleApplications/Conceptual/Safari_Developer_Guide/Console/Console.html",
      "title":"Safari console reference"
    },
    {
      "url":"https://msdn.microsoft.com/en-us/library/hh772169",
      "title":"Edge/Internet Explorer console reference"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "JS API"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"a #1",
      "9":"a #1",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"y",
      "3.2":"y",
      "4":"y",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"y",
      "4.0-4.1":"y",
      "4.2-4.3":"y",
      "5.0-5.1":"y",
      "6.0-6.1":"y #3",
      "7.0-7.1":"y #3",
      "8":"y #3",
      "8.1-8.4":"y #3",
      "9.0-9.2":"y #3",
      "9.3":"y #3"
    },
    "op_mini":{
      "all":"y #6"
    },
    "android":{
      "2.1":"y #4",
      "2.2":"y #4",
      "2.3":"y #4",
      "3":"y #4",
      "4":"y #4",
      "4.1":"y #4",
      "4.2-4.3":"y #4",
      "4.4":"y #4",
      "4.4.3-4.4.4":"y #4",
      "50":"y #4"
    },
    "bb":{
      "7":"n #2",
      "10":"n #2"
    },
    "op_mob":{
      "10":"n",
      "11":"n #2",
      "11.1":"n #2",
      "11.5":"n #2",
      "12":"n #2",
      "12.1":"n #2",
      "37":"n #2"
    },
    "and_chr":{
      "50":"y #4"
    },
    "and_ff":{
      "46":"y #5"
    },
    "ie_mob":{
      "10":"n #2",
      "11":"n #2"
    },
    "and_uc":{
      "9.9":"n #2"
    },
    "samsung":{
      "4":"y #4"
    }
  },
  "notes":"The basic functions that this information refers to include `console.log`, `console.info`, `console.warn`, `console.error`.",
  "notes_by_num":{
    "1":"Only supports console functions when developer tools are open, otherwise the `console` object is undefined and any calls will throw errors.",
    "2":"Allows `console` functions to be used without throwing errors, but does not appear to output the data anywhere.",
    "3":"Log output on iOS 6+ Safari can only be seen by connecting to a Mac and using the [Safari debugger](https://developer.apple.com/safari/tools/).",
    "4":"Log output on older Android browsers can be retrieved via Android's `logcat` command or using Chrome Developer Tools in Android 4.4+/Chrome for Android [see details](http://developer.android.com/guide/webapps/debugging.html)",
    "5":"Log output on Firefox for Android can be [accessed using WebIDE](https://developer.mozilla.org/en-US/docs/Tools/Remote_Debugging/Debugging_Firefox_for_Android_with_WebIDE)",
    "6":"See [this article](https://dev.opera.com/articles/opera-mini-and-javascript/) for details on how to see console logging in Opera Mini"
  },
  "usage_perc_y":88.94,
  "usage_perc_a":1.06,
  "ucprefix":false,
  "parent":"",
  "keywords":"console.log,console.info,console.warn,console.error,window.console",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],43:[function(require,module,exports){
module.exports={
  "title":"const",
  "description":"Declares a constant with block level scope",
  "spec":"http://www.ecma-international.org/ecma-262/6.0/#sec-let-and-const-declarations",
  "status":"other",
  "links":[
    {
      "url":"http://generatedcontent.org/post/54444832868/variables-and-constants-in-es6",
      "title":"Variables and Constants in ES6"
    },
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/const",
      "title":"Const (MDN)"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "JS API"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"a #1",
      "3":"a #1",
      "3.5":"a #1",
      "3.6":"a #1",
      "4":"a #1",
      "5":"a #1",
      "6":"a #1",
      "7":"a #1",
      "8":"a #1",
      "9":"a #1",
      "10":"a #1",
      "11":"a #1",
      "12":"a #1",
      "13":"a #2",
      "14":"a #2",
      "15":"a #2",
      "16":"a #2",
      "17":"a #2",
      "18":"a #2",
      "19":"a #2",
      "20":"a #2",
      "21":"a #2",
      "22":"a #2",
      "23":"a #2",
      "24":"a #2",
      "25":"a #2",
      "26":"a #2",
      "27":"a #2",
      "28":"a #2",
      "29":"a #2",
      "30":"a #2",
      "31":"a #2",
      "32":"a #2",
      "33":"a #2",
      "34":"a #2",
      "35":"a #2",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"a #2",
      "5":"a #2",
      "6":"a #2",
      "7":"a #2",
      "8":"a #2",
      "9":"a #2",
      "10":"a #2",
      "11":"a #2",
      "12":"a #2",
      "13":"a #2",
      "14":"a #2",
      "15":"a #2",
      "16":"a #2",
      "17":"a #2",
      "18":"a #2",
      "19":"a #2",
      "20":"a #2",
      "21":"a #2 #3",
      "22":"a #2 #3",
      "23":"a #2 #3",
      "24":"a #2 #3",
      "25":"a #2 #3",
      "26":"a #2 #3",
      "27":"a #2 #3",
      "28":"a #2 #3",
      "29":"a #2 #3",
      "30":"a #2 #3",
      "31":"a #2 #3",
      "32":"a #2 #3",
      "33":"a #2 #3",
      "34":"a #2 #3",
      "35":"a #2 #3",
      "36":"a #2 #3",
      "37":"a #2 #3",
      "38":"a #2 #3",
      "39":"a #2 #3",
      "40":"a #2 #3",
      "41":"a #4",
      "42":"a #4",
      "43":"a #4",
      "44":"a #4",
      "45":"a #4",
      "46":"a #4",
      "47":"a #4",
      "48":"a #4",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"a #2",
      "3.2":"a #2",
      "4":"a #2",
      "5":"a #2",
      "5.1":"a #2 #3",
      "6":"a #2 #3",
      "6.1":"a #2 #3",
      "7":"a #2 #3",
      "7.1":"a #2 #3",
      "8":"a #2 #3",
      "9":"a #2 #3",
      "9.1":"a #2 #3",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"a #1",
      "10.5":"a #1",
      "10.6":"a #1",
      "11":"a #1",
      "11.1":"a #1",
      "11.5":"a #1",
      "11.6":"a #1 #3",
      "12":"a #1 #3",
      "12.1":"a #1 #3",
      "15":"a #2 #3",
      "16":"a #2 #3",
      "17":"a #2 #3",
      "18":"a #2 #3",
      "19":"a #2 #3",
      "20":"a #2 #3",
      "21":"a #2 #3",
      "22":"a #2 #3",
      "23":"a #2 #3",
      "24":"a #2 #3",
      "25":"a #2 #3",
      "26":"a #2 #3",
      "27":"a #2 #3",
      "28":"a #4",
      "29":"a #4",
      "30":"a #4",
      "31":"a #4",
      "32":"a #4",
      "33":"a #4",
      "34":"a #4",
      "35":"a #4",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"a #2",
      "4.0-4.1":"a #2",
      "4.2-4.3":"a #2",
      "5.0-5.1":"a #2 #3",
      "6.0-6.1":"a #2 #3",
      "7.0-7.1":"a #2 #3",
      "8":"a #2 #3",
      "8.1-8.4":"a #2 #3",
      "9.0-9.2":"a #2 #3",
      "9.3":"a #2 #3"
    },
    "op_mini":{
      "all":"a #1 #3"
    },
    "android":{
      "2.1":"u",
      "2.2":"u",
      "2.3":"a #2",
      "3":"a #2 #3",
      "4":"a #2 #3",
      "4.1":"a #2 #3",
      "4.2-4.3":"a #2 #3",
      "4.4":"a #2 #3",
      "4.4.3-4.4.4":"a #2 #3",
      "50":"y"
    },
    "bb":{
      "7":"a #2 #3",
      "10":"a #2 #3"
    },
    "op_mob":{
      "10":"a #1",
      "11":"a #1",
      "11.1":"a #1",
      "11.5":"a #1",
      "12":"a #1 #3",
      "12.1":"a #1 #3",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"y"
    },
    "and_uc":{
      "9.9":"a #2 #3"
    },
    "samsung":{
      "4":"a #4"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"const is recognized, but treated like var (no block scope, can be overwritten)",
    "2":"const does not have block scope",
    "3":"Only recognized when NOT in strict mode",
    "4":"Supported correctly in strict mode, otherwise supported without block scope"
  },
  "usage_perc_y":61.43,
  "usage_perc_a":34.86,
  "ucprefix":false,
  "parent":"",
  "keywords":"ES6,constant,block,scope",
  "ie_id":"",
  "chrome_id":"4645595339816960",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],44:[function(require,module,exports){
module.exports={
  "title":"contenteditable attribute (basic support)",
  "description":"Method of making any HTML element editable.",
  "spec":"https://html.spec.whatwg.org/multipage/interaction.html#contenteditable",
  "status":"ls",
  "links":[
    {
      "url":"http://html5demos.com/contenteditable",
      "title":"Demo page"
    },
    {
      "url":"https://blog.whatwg.org/the-road-to-html-5-contenteditable",
      "title":"WHATWG blog post"
    },
    {
      "url":"http://accessgarage.wordpress.com/2009/05/08/how-to-hack-your-app-to-make-contenteditable-work/",
      "title":"Blog post on usage problems"
    },
    {
      "url":"http://docs.webplatform.org/wiki/html/attributes/contentEditable",
      "title":"WebPlatform Docs"
    }
  ],
  "bugs":[
    {
      "description":"In Firefox when clicking on contenteditable nested into draggable, cursor is always positioned to the start of editable text. Still not fixed in version 18.0.1."
    },
    {
      "description":"In Internet Explorer contenteditable cannot be applied to the TABLE, COL, COLGROUP, TBODY, TD, TFOOT, TH, THEAD, and TR elements directly, a content editable SPAN, or DIV element can be placed inside the individual table cells (See http://msdn.microsoft.com/en-us/library/ie/ms533690(v=vs.85).aspx)."
    }
  ],
  "categories":[
    "HTML5"
  ],
  "stats":{
    "ie":{
      "5.5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"a",
      "3.5":"y",
      "3.6":"y",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"y",
      "3.2":"y",
      "4":"y",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"y",
      "9.5-9.6":"y",
      "10.0-10.1":"y",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"This support only refers to very basic editing capability, implementations vary significantly on how certain elements can be edited.",
  "notes_by_num":{
    
  },
  "usage_perc_y":93.28,
  "usage_perc_a":0.04,
  "ucprefix":false,
  "parent":"",
  "keywords":"",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],45:[function(require,module,exports){
module.exports={
  "title":"Content Security Policy 1.0",
  "description":"Mitigate cross-site scripting attacks by whitelisting allowed sources of script, style, and other resources.",
  "spec":"http://www.w3.org/TR/2012/CR-CSP-20121115/",
  "status":"cr",
  "links":[
    {
      "url":"http://html5rocks.com/en/tutorials/security/content-security-policy/",
      "title":"HTML5Rocks article"
    },
    {
      "url":"http://content-security-policy.com/",
      "title":"CSP Examples & Quick Reference"
    }
  ],
  "bugs":[
    {
      "description":"Partial support in Internet Explorer 10-11 refers to the browser only supporting the 'sandbox' directive by using the `X-Content-Security-Policy` header."
    },
    {
      "description":"Partial support in iOS Safari 5.0-5.1 refers to the browser recognizing the `X-Webkit-CSP` header but failing to handle complex cases correctly, often resulting in broken pages."
    },
    {
      "description":"Chrome for iOS fails to render pages without a [connect-src 'self'](https://code.google.com/p/chromium/issues/detail?id=322497) policy."
    }
  ],
  "categories":[
    "Other"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"a #1",
      "11":"a #1"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"y #1",
      "5":"y #1",
      "6":"y #1",
      "7":"y #1",
      "8":"y #1",
      "9":"y #1",
      "10":"y #1",
      "11":"y #1",
      "12":"y #1",
      "13":"y #1",
      "14":"y #1",
      "15":"y #1",
      "16":"y #1",
      "17":"y #1",
      "18":"y #1",
      "19":"y #1",
      "20":"y #1",
      "21":"y #1",
      "22":"y #1",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"y #2",
      "15":"y #2",
      "16":"y #2",
      "17":"y #2",
      "18":"y #2",
      "19":"y #2",
      "20":"y #2",
      "21":"y #2",
      "22":"y #2",
      "23":"y #2",
      "24":"y #2",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"a #2",
      "6":"y #2",
      "6.1":"y #2",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"a #2",
      "6.0-6.1":"y #2",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"y #2"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"a #1",
      "11":"a #1"
    },
    "and_uc":{
      "9.9":"y #2"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"The standard HTTP header is `Content-Security-Policy` which is used unless otherwise noted.",
  "notes_by_num":{
    "1":"Supported through the `X-Content-Security-Policy` header",
    "2":"Supported through the `X-Webkit-CSP` header"
  },
  "usage_perc_y":84.5,
  "usage_perc_a":6.14,
  "ucprefix":false,
  "parent":"",
  "keywords":"csp,security,header",
  "ie_id":"contentsecuritypolicy",
  "chrome_id":"5205088045891584",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],46:[function(require,module,exports){
module.exports={
  "title":"Content Security Policy Level 2",
  "description":"Mitigate cross-site scripting attacks by whitelisting allowed sources of script, style, and other resources. CSP 2 adds hash-source, nonce-source, and five new directives",
  "spec":"http://www.w3.org/TR/CSP/",
  "status":"cr",
  "links":[
    {
      "url":"http://html5rocks.com/en/tutorials/security/content-security-policy/",
      "title":"HTML5Rocks article"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "Other"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"a #1",
      "32":"a #1",
      "33":"a #1",
      "34":"a #1",
      "35":"a #2",
      "36":"a #3",
      "37":"a #3",
      "38":"a #3",
      "39":"a #3",
      "40":"a #3",
      "41":"a #3",
      "42":"a #3",
      "43":"a #3",
      "44":"a #3",
      "45":"a #7",
      "46":"a #7",
      "47":"a #7",
      "48":"a #7",
      "49":"a #7",
      "50":"a #7"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"a #4",
      "37":"a #4",
      "38":"a #4",
      "39":"a #5",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"a #4",
      "24":"a #4",
      "25":"a #4",
      "26":"a #5",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"a #6"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Firefox 31-34 is missing the plugin-types, child-src, frame-ancestors, base-uri, and form-action directives.",
    "2":"Firefox 35 is missing the plugin-types, child-src, frame-ancestors, and form-action directives.",
    "3":"Firefox 36-44 is missing the plugin-types and child-src directives.",
    "4":"Chrome 36-38 & Opera 23-25 are missing the plugin-types, child-src, frame-ancestors, base-uri, and form-action directives.",
    "5":"Chrome 39 and Opera 26 are missing the plugin-types, child-src, base-uri, and form-action directives.",
    "6":"Firefox 38 on Android is missing the child-src directive.",
    "7":"Firefox 45+ is missing the plugin-types directive."
  },
  "usage_perc_y":59.46,
  "usage_perc_a":7.92,
  "ucprefix":false,
  "parent":"",
  "keywords":"csp,header,nonce,hash",
  "ie_id":"contentsecuritypolicylevel2",
  "chrome_id":"4957003285790720",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],47:[function(require,module,exports){
module.exports={
  "title":"Cross-Origin Resource Sharing",
  "description":"Method of performing XMLHttpRequests across domains",
  "spec":"https://fetch.spec.whatwg.org/#http-cors-protocol",
  "status":"ls",
  "links":[
    {
      "url":"http://hacks.mozilla.org/2009/07/cross-site-xmlhttprequest-with-cors/",
      "title":"Mozilla Hacks blog post"
    },
    {
      "url":"http://msdn.microsoft.com/en-us/library/cc288060(VS.85).aspx",
      "title":"Alternative implementation by IE8"
    },
    {
      "url":"https://dev.opera.com/articles/view/dom-access-control-using-cross-origin-resource-sharing/",
      "title":"DOM access using CORS"
    },
    {
      "url":"https://raw.github.com/phiggins42/has.js/master/detect/features.js#native-cors-xhr",
      "title":"has.js test"
    }
  ],
  "bugs":[
    {
      "description":"IE10+ does not send cookies when withCredential=true ([IE Bug #759587](https://connect.microsoft.com/IE/feedback/details/759587/ie10-doesnt-support-cookies-on-cross-origin-xmlhttprequest-withcredentials-true)). A workaround is [to use a P3P policy](http://www.techrepublic.com/blog/software-engineer/craft-a-p3p-policy-to-make-ie-behave/)"
    },
    {
      "description":"IE10+ does not make a CORS request if port is the only difference ([IE Bug #781303](http://connect.microsoft.com/IE/feedback/details/781303))"
    },
    {
      "description":"Android and some old versions of WebKit (that may be found in various webview implementations) do not support Access-Control-Expose-Headers: https://code.google.com/p/android/issues/detail?id=56726"
    },
    {
      "description":"IE11 does not appear to support CORS for images in the `canvas` element"
    }
  ],
  "categories":[
    "JS API"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"a #2",
      "9":"a #2",
      "10":"a #1",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"y",
      "3.6":"y",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"a #1",
      "5":"a #1",
      "6":"a #1",
      "7":"a #1",
      "8":"a #1",
      "9":"a #1",
      "10":"a #1",
      "11":"a #1",
      "12":"a #1",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"a #1 #3",
      "5":"a #1 #3",
      "5.1":"a #1 #3",
      "6":"y #3",
      "6.1":"y #3",
      "7":"y #3",
      "7.1":"y #3",
      "8":"y #3",
      "9":"y #3",
      "9.1":"y #3",
      "10":"y #3",
      "TP":"y #3"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"a #1 #3",
      "4.0-4.1":"a #1 #3",
      "4.2-4.3":"a #1 #3",
      "5.0-5.1":"a #1 #3",
      "6.0-6.1":"y #3",
      "7.0-7.1":"y #3",
      "8":"y #3",
      "8.1-8.4":"y #3",
      "9.0-9.2":"y #3",
      "9.3":"y #3"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"a #1",
      "2.2":"a #1",
      "2.3":"a #1",
      "3":"a #1",
      "4":"a #1",
      "4.1":"a #1",
      "4.2-4.3":"a #1",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"a #1",
      "10":"y"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"a #1",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Does not support CORS for images in `<canvas>`",
    "2":"Supported somewhat in IE8 and IE9 using the XDomainRequest object (but has [limitations](http://blogs.msdn.com/b/ieinternals/archive/2010/05/13/xdomainrequest-restrictions-limitations-and-workarounds.aspx))",
    "3":"Does not support CORS for `<video>` in `<canvas>`: https://bugs.webkit.org/show_bug.cgi?id=135379"
  },
  "usage_perc_y":90.1,
  "usage_perc_a":3.02,
  "ucprefix":false,
  "parent":"",
  "keywords":"",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],48:[function(require,module,exports){
module.exports={
  "title":"Credential Management API",
  "description":"The API provides a programmatic interface to the browser's credential manager. In short, an origin can request a user's credentials to sign them in, or can ask the browser to save credentials on the user's behalf. Both of these requests are user-mediated.",
  "spec":"https://www.w3.org/TR/credential-management-1/",
  "status":"wd",
  "links":[
    {
      "url":"https://developers.google.com/web/updates/2016/04/credential-management-api",
      "title":"Tutorial by Google"
    },
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/API/Credential_Management_API",
      "title":"Mozilla Developer Network"
    },
    {
      "url":"https://g.co/codelabs/cmapi",
      "title":"Codelab"
    },
    {
      "url":"https://credential-management-sample.appspot.com/",
      "title":"Live Demo"
    },
    {
      "url":"https://github.com/GoogleChrome/credential-management-sample",
      "title":"Sample Code"
    },
    {
      "url":"https://github.com/w3c/webappsec-credential-management",
      "title":"Spec discussion"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "JS API"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"n"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"a",
      "49":"a",
      "50":"a",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n",
      "TP":"n"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":17.46,
  "usage_perc_a":9.67,
  "ucprefix":false,
  "parent":"",
  "keywords":"credential,navigator.credentials",
  "ie_id":"",
  "chrome_id":"5026422640869376",
  "firefox_id":"",
  "webkit_id":"",
  "shown":false
}

},{}],49:[function(require,module,exports){
module.exports={
  "title":"Web Cryptography",
  "description":"JavaScript API for performing basic cryptographic operations in web applications",
  "spec":"http://www.w3.org/TR/WebCryptoAPI/",
  "status":"cr",
  "links":[
    {
      "url":"http://www.slideshare.net/Channy/the-history-and-status-of-web-crypto-api",
      "title":"The History and Status of Web Crypto API"
    },
    {
      "url":"http://research.microsoft.com/en-us/projects/msrjscrypto/",
      "title":"Microsoft Research JavaScript Cryptography Library"
    },
    {
      "url":"http://bitwiseshiftleft.github.io/sjcl/",
      "title":"Cross-browser cryptography library"
    },
    {
      "url":"https://docs.google.com/spreadsheet/ccc?key=0AiAcidBZRLxndE9LWEs2R1oxZ0xidUVoU3FQbFFobkE#gid=1",
      "title":"Support for recommended algorithms in Firefox"
    },
    {
      "url":"https://github.com/Netflix/NfWebCrypto",
      "title":"Polyfill by Netflix with partial support"
    },
    {
      "url":"https://github.com/GlobalSign/PKI.js",
      "title":"PKI.js - another crypto library for Public Key Infrastructure applications"
    },
    {
      "url":"https://diafygi.github.io/webcrypto-examples/",
      "title":"Test suite for various algorithms/methods"
    },
    {
      "url":"https://github.com/vibornoff/webcrypto-shim",
      "title":"Web Cryptography API shim for IE11 and Safari - set of bugfixes and workarounds of prefixed api implementations"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "JS API"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"p",
      "7":"p",
      "8":"p",
      "9":"p",
      "10":"p",
      "11":"a x #1"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"p",
      "3":"p",
      "3.5":"p",
      "3.6":"p",
      "4":"p",
      "5":"p",
      "6":"p",
      "7":"p",
      "8":"p",
      "9":"p",
      "10":"p",
      "11":"p",
      "12":"p",
      "13":"p",
      "14":"p",
      "15":"p",
      "16":"p",
      "17":"p",
      "18":"p",
      "19":"p",
      "20":"p",
      "21":"p",
      "22":"p",
      "23":"p",
      "24":"p",
      "25":"p",
      "26":"p",
      "27":"p",
      "28":"p",
      "29":"p",
      "30":"p",
      "31":"p",
      "32":"n d #2",
      "33":"n d #2",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"p",
      "5":"p",
      "6":"p",
      "7":"p",
      "8":"p",
      "9":"p",
      "10":"p",
      "11":"p",
      "12":"p",
      "13":"p",
      "14":"p",
      "15":"p",
      "16":"p",
      "17":"p",
      "18":"p",
      "19":"p",
      "20":"p",
      "21":"p",
      "22":"p",
      "23":"p",
      "24":"p",
      "25":"p",
      "26":"p",
      "27":"p",
      "28":"p",
      "29":"p",
      "30":"p",
      "31":"p",
      "32":"p",
      "33":"p",
      "34":"p",
      "35":"p",
      "36":"p",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"p",
      "3.2":"p",
      "4":"p",
      "5":"p",
      "5.1":"p",
      "6":"p",
      "6.1":"p",
      "7":"p",
      "7.1":"y x #3",
      "8":"y x #3",
      "9":"y x #3",
      "9.1":"y x #3",
      "10":"y x #3",
      "TP":"y x #3"
    },
    "opera":{
      "9":"p",
      "9.5-9.6":"p",
      "10.0-10.1":"p",
      "10.5":"p",
      "10.6":"p",
      "11":"p",
      "11.1":"p",
      "11.5":"p",
      "11.6":"p",
      "12":"p",
      "12.1":"p",
      "15":"p",
      "16":"p",
      "17":"p",
      "18":"p",
      "19":"p",
      "20":"p",
      "21":"p",
      "22":"p",
      "23":"p",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"p",
      "4.0-4.1":"p",
      "4.2-4.3":"p",
      "5.0-5.1":"p",
      "6.0-6.1":"p",
      "7.0-7.1":"p",
      "8":"y x #3",
      "8.1-8.4":"y x #3",
      "9.0-9.2":"y x #3",
      "9.3":"y x #3"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"p",
      "2.2":"p",
      "2.3":"p",
      "3":"p",
      "4":"p",
      "4.1":"p",
      "4.2-4.3":"p",
      "4.4":"p",
      "4.4.3-4.4.4":"p",
      "50":"y"
    },
    "bb":{
      "7":"p",
      "10":"p"
    },
    "op_mob":{
      "10":"p",
      "11":"p",
      "11.1":"p",
      "11.5":"p",
      "12":"p",
      "12.1":"p",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"p"
    },
    "ie_mob":{
      "10":"p",
      "11":"a x #1"
    },
    "and_uc":{
      "9.9":"p"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"Many browsers support the `[crypto.getRandomValues()](#feat=getrandomvalues)` method, but not actual cryptography functionality under `crypto.subtle`. \r\n\r\nFirefox also has support for [unofficial features](https://developer.mozilla.org/en-US/docs/JavaScript_crypto). \r\n\r\nIn Chrome the API is only usable over secure connections. ([corresponding bug](https://code.google.com/p/chromium/issues/detail?id=373032))",
  "notes_by_num":{
    "1":"Support in IE11 is based an older version of the specification.",
    "2":"Supported in Firefox behind the `dom.webcrypto.enabled` flag.",
    "3":"Supported in Safari using the `crypto.webkitSubtle` prefix."
  },
  "usage_perc_y":72.23,
  "usage_perc_a":5.43,
  "ucprefix":false,
  "parent":"",
  "keywords":"subtle,subtlecrypto",
  "ie_id":"webcryptoapi",
  "chrome_id":"5030265697075200",
  "firefox_id":"",
  "webkit_id":"specification-webcrypto",
  "shown":true
}

},{}],50:[function(require,module,exports){
module.exports={
  "title":"CSS all property",
  "description":"A shorthand property for resetting all CSS properties except for `direction` and `unicode-bidi`.",
  "spec":"http://www.w3.org/TR/css-cascade-3/#all-shorthand",
  "status":"cr",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/all",
      "title":"Mozilla Developer Network"
    },
    {
      "url":"http://mcc.id.au/blog/2013/10/all-unset",
      "title":"Resetting styles using `all: unset`"
    },
    {
      "url":"https://bugs.webkit.org/show_bug.cgi?id=116966",
      "title":"WebKit bug 116966: [css3-cascade] Add support for `all` shorthand property"
    },
    {
      "url":"https://wpdev.uservoice.com/forums/257854-microsoft-edge-developer/suggestions/6511510-all-initial",
      "title":"Microsoft Edge feature request on UserVoice"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":69.94,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"CSS,all,property,shorthand,reset",
  "ie_id":"cssallshorthand",
  "chrome_id":"6178222542684160",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],51:[function(require,module,exports){
module.exports={
  "title":"CSS Animation",
  "description":"Complex method of animating certain properties of an element",
  "spec":"http://www.w3.org/TR/css3-animations/",
  "status":"wd",
  "links":[
    {
      "url":"http://robertnyman.com/2010/05/06/css3-animations/",
      "title":"Blog post on usage"
    },
    {
      "url":"http://www.css3files.com/animation/",
      "title":"Information page"
    },
    {
      "url":"http://docs.webplatform.org/wiki/css/properties/animations",
      "title":"WebPlatform Docs"
    }
  ],
  "bugs":[
    {
      "description":"'animation-fill-mode' property is not supported in Android browser below 2.3."
    },
    {
      "description":"iOS 6.1 and below do not support animation on pseudo-elements. iOS 7 and higher are reported to have buggy behavior with animating pseudo-elements."
    },
    {
      "description":"@keyframes not supported in an inline or scoped stylesheet in Firefox (bug 830056)"
    },
    {
      "description":"In Chrome `animation-fill-mode backwards` is wrong if `steps(x, start)` is used [see example](http://codepen.io/Fyrd/pen/jPPKpX)."
    },
    {
      "description":"IE10 and IE11 do not support CSS animations inside media queries."
    },
    {
      "description":"IE10 and IE11 on Windows 7 have a bug where translate transform values are always interpreted as pixels when used in animations [test case](http://codepen.io/flxsource/pen/jPYWoE)"
    }
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"y x",
      "6":"y x",
      "7":"y x",
      "8":"y x",
      "9":"y x",
      "10":"y x",
      "11":"y x",
      "12":"y x",
      "13":"y x",
      "14":"y x",
      "15":"y x",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y x",
      "5":"y x",
      "6":"y x",
      "7":"y x",
      "8":"y x",
      "9":"y x",
      "10":"y x",
      "11":"y x",
      "12":"y x",
      "13":"y x",
      "14":"y x",
      "15":"y x",
      "16":"y x",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y x",
      "27":"y x",
      "28":"y x",
      "29":"y x",
      "30":"y x",
      "31":"y x",
      "32":"y x",
      "33":"y x",
      "34":"y x",
      "35":"y x",
      "36":"y x",
      "37":"y x",
      "38":"y x",
      "39":"y x",
      "40":"y x",
      "41":"y x",
      "42":"y x",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"y x",
      "5":"y x",
      "5.1":"y x",
      "6":"y x",
      "6.1":"y x",
      "7":"y x",
      "7.1":"y x",
      "8":"y x",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"y x",
      "12.1":"y",
      "15":"y x",
      "16":"y x",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y x",
      "27":"y x",
      "28":"y x",
      "29":"y x",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"y x",
      "4.0-4.1":"y x",
      "4.2-4.3":"y x",
      "5.0-5.1":"y x",
      "6.0-6.1":"y x",
      "7.0-7.1":"y x",
      "8":"y x",
      "8.1-8.4":"y x",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"a x #1",
      "2.2":"a x #1",
      "2.3":"a x #1",
      "3":"a x #1",
      "4":"y x",
      "4.1":"y x",
      "4.2-4.3":"y x",
      "4.4":"y x",
      "4.4.3-4.4.4":"y x",
      "50":"y"
    },
    "bb":{
      "7":"y x",
      "10":"y x"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y x"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Partial support in Android browser refers to buggy behavior in different scenarios."
  },
  "usage_perc_y":92,
  "usage_perc_a":0.01,
  "ucprefix":false,
  "parent":"",
  "keywords":"animations,css-animations,animation-name,animation-duration,animation-delay,animation-timing-function,@keyframes,animationstart,animationend,animationiteration,css3 animation",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],52:[function(require,module,exports){
module.exports={
  "title":"CSS Appearance",
  "description":"The `appearance` property defines how elements (particularly form controls) appear by default. By setting the value to `none` the default appearance can be entirely redefined using other CSS properties.",
  "spec":"https://drafts.csswg.org/css-ui-4/#appearance-switching",
  "status":"wd",
  "links":[
    {
      "url":"http://css-tricks.com/almanac/properties/a/appearance/",
      "title":"CSS Tricks article"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"a #1 #2",
      "13":"a #1 #2",
      "14":"a #1 #2"
    },
    "firefox":{
      "2":"a x #1",
      "3":"a x #1",
      "3.5":"a x #1",
      "3.6":"a x #1",
      "4":"a x #1",
      "5":"a x #1",
      "6":"a x #1",
      "7":"a x #1",
      "8":"a x #1",
      "9":"a x #1",
      "10":"a x #1",
      "11":"a x #1",
      "12":"a x #1",
      "13":"a x #1",
      "14":"a x #1",
      "15":"a x #1",
      "16":"a x #1",
      "17":"a x #1",
      "18":"a x #1",
      "19":"a x #1",
      "20":"a x #1",
      "21":"a x #1",
      "22":"a x #1",
      "23":"a x #1",
      "24":"a x #1",
      "25":"a x #1",
      "26":"a x #1",
      "27":"a x #1",
      "28":"a x #1",
      "29":"a x #1",
      "30":"a x #1",
      "31":"a x #1",
      "32":"a x #1",
      "33":"a x #1",
      "34":"a x #1",
      "35":"a x #1",
      "36":"a x #1",
      "37":"a x #1",
      "38":"a x #1",
      "39":"a x #1",
      "40":"a x #1",
      "41":"a x #1",
      "42":"a x #1",
      "43":"a x #1",
      "44":"a x #1",
      "45":"a x #1",
      "46":"a x #1",
      "47":"a x #1",
      "48":"a x #1",
      "49":"a x #1",
      "50":"a x #1"
    },
    "chrome":{
      "4":"a x #1",
      "5":"a x #1",
      "6":"a x #1",
      "7":"a x #1",
      "8":"a x #1",
      "9":"a x #1",
      "10":"a x #1",
      "11":"a x #1",
      "12":"a x #1",
      "13":"a x #1",
      "14":"a x #1",
      "15":"a x #1",
      "16":"a x #1",
      "17":"a x #1",
      "18":"a x #1",
      "19":"a x #1",
      "20":"a x #1",
      "21":"a x #1",
      "22":"a x #1",
      "23":"a x #1",
      "24":"a x #1",
      "25":"a x #1",
      "26":"a x #1",
      "27":"a x #1",
      "28":"a x #1",
      "29":"a x #1",
      "30":"a x #1",
      "31":"a x #1",
      "32":"a x #1",
      "33":"a x #1",
      "34":"a x #1",
      "35":"a x #1",
      "36":"a x #1",
      "37":"a x #1",
      "38":"a x #1",
      "39":"a x #1",
      "40":"a x #1",
      "41":"a x #1",
      "42":"a x #1",
      "43":"a x #1",
      "44":"a x #1",
      "45":"a x #1",
      "46":"a x #1",
      "47":"a x #1",
      "48":"a x #1",
      "49":"a x #1",
      "50":"a x #1",
      "51":"a x #1",
      "52":"a x #1",
      "53":"a x #1",
      "54":"a x #1"
    },
    "safari":{
      "3.1":"a x #1",
      "3.2":"a x #1",
      "4":"a x #1",
      "5":"a x #1",
      "5.1":"a x #1",
      "6":"a x #1",
      "6.1":"a x #1",
      "7":"a x #1",
      "7.1":"a x #1",
      "8":"a x #1",
      "9":"a x #1",
      "9.1":"a x #1",
      "10":"a x #1",
      "TP":"a x #1"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"a x #1",
      "16":"a x #1",
      "17":"a x #1",
      "18":"a x #1",
      "19":"a x #1",
      "20":"a x #1",
      "21":"a x #1",
      "22":"a x #1",
      "23":"a x #1",
      "24":"a x #1",
      "25":"a x #1",
      "26":"a x #1",
      "27":"a x #1",
      "28":"a x #1",
      "29":"a x #1",
      "30":"a x #1",
      "31":"a x #1",
      "32":"a x #1",
      "33":"a x #1",
      "34":"a x #1",
      "35":"a x #1",
      "36":"a x #1",
      "37":"a x #1",
      "38":"a x #1",
      "39":"a x #1",
      "40":"a x #1"
    },
    "ios_saf":{
      "3.2":"a x #1",
      "4.0-4.1":"a x #1",
      "4.2-4.3":"a x #1",
      "5.0-5.1":"a x #1",
      "6.0-6.1":"a x #1",
      "7.0-7.1":"a x #1",
      "8":"a x #1",
      "8.1-8.4":"a x #1",
      "9.0-9.2":"a x #1",
      "9.3":"a x #1"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"a x #1",
      "2.2":"a x #1",
      "2.3":"a x #1",
      "3":"a x #1",
      "4":"a x #1",
      "4.1":"a x #1",
      "4.2-4.3":"a x #1",
      "4.4":"a x #1",
      "4.4.3-4.4.4":"a x #1",
      "50":"a x #1"
    },
    "bb":{
      "7":"a x #1",
      "10":"a x #1"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"a x #1"
    },
    "and_chr":{
      "50":"a x #1"
    },
    "and_ff":{
      "46":"a x #1"
    },
    "ie_mob":{
      "10":"n",
      "11":"a #1 #2"
    },
    "and_uc":{
      "9.9":"a x #1"
    },
    "samsung":{
      "4":"a x #1"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"The appearance property is supported with the `none` value, but not `auto`. Webkit, Blink, and Gecko browsers also support additional vendor specific values.",
    "2":"Microsoft Edge and IE Mobile support this property with the `-webkit-` prefix, rather than `-ms-` for interop reasons."
  },
  "usage_perc_y":0,
  "usage_perc_a":86.53,
  "ucprefix":false,
  "parent":"",
  "keywords":"",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],53:[function(require,module,exports){
module.exports={
  "title":"CSS Counter Styles",
  "description":"The @counter-style CSS at-rule allows custom counter styles to be defined. A @counter-style rule defines how to convert a counter value into a string representation.",
  "spec":"http://dev.w3.org/csswg/css-counter-styles/",
  "status":"cr",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/@counter-style",
      "title":"MDN article"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"a #1",
      "34":"a #1",
      "35":"a #1",
      "36":"a #1",
      "37":"a #1",
      "38":"a #1",
      "39":"a #1",
      "40":"a #1",
      "41":"a #1",
      "42":"a #1",
      "43":"a #1",
      "44":"a #1",
      "45":"a #1",
      "46":"a #1",
      "47":"a #1",
      "48":"a #1",
      "49":"a #1",
      "50":"a #1"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n",
      "51":"n",
      "52":"n",
      "53":"n",
      "54":"n"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n",
      "TP":"n"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"a #1"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Partial support in Firefox refers to lacking support for [image symbols](https://bugzilla.mozilla.org/show_bug.cgi?id=1024179)"
  },
  "usage_perc_y":0,
  "usage_perc_a":7.55,
  "ucprefix":false,
  "parent":"",
  "keywords":"css @counter-style, list-style",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],54:[function(require,module,exports){
module.exports={
  "title":"CSS Backdrop Filter",
  "description":"Method of applying filter effects (like blur, grayscale or hue) to content/elements below the target element.",
  "spec":"http://dev.w3.org/fxtf/filters-2/#BackdropFilterProperty",
  "status":"unoff",
  "links":[
    {
      "url":"http://product.voxmedia.com/til/2015/2/17/8053347/css-ios-transparency-with-webkit-backdrop-filter",
      "title":"Blog post"
    },
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/backdrop-filter",
      "title":"Mozilla Developer Network"
    },
    {
      "url":"https://wpdev.uservoice.com/forums/257854-microsoft-edge-developer/suggestions/9160189-backdrop-filters",
      "title":"Edge feature request"
    }
  ],
  "bugs":[
    {
      "description":"Chrome feature request: [Chromium issue #497522](https://code.google.com/p/chromium/issues/detail?id=497522)"
    },
    {
      "description":"Firefox feature request: [Mozilla bug #1178765](https://bugzilla.mozilla.org/show_bug.cgi?id=1178765)"
    }
  ],
  "categories":[
    "CSS",
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n d #1",
      "48":"n d #1",
      "49":"n d #1",
      "50":"n d #1",
      "51":"n d #1",
      "52":"n d #1",
      "53":"n d #1",
      "54":"n d #1"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"y x",
      "9.1":"y x",
      "10":"y x",
      "TP":"y x"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n d #1",
      "35":"n d #1",
      "36":"n d #1",
      "37":"n d #1",
      "38":"n d #1",
      "39":"n d #1",
      "40":"n d #1"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"y x",
      "9.3":"y x"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n d #1"
    },
    "and_chr":{
      "50":"n d #1"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Can be enabled via the \"Experimental Web Platform Features\" flag"
  },
  "usage_perc_y":10.05,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"blue,hue-rotate,invert,saturate,filter",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"feature-filter-effects-backdrop-filter-propery",
  "shown":true
}

},{}],55:[function(require,module,exports){
module.exports={
  "title":"CSS background-position edge offsets",
  "description":"Allows CSS background images to be positioned relative to the specified edge using the 3 to 4 value syntax. For example: `background-position: right 5px bottom 5px;` for positioning 5px from the bottom-right corner.",
  "spec":"http://www.w3.org/TR/css3-background/#background-position",
  "status":"cr",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/background-position",
      "title":"MDN article on background-position"
    },
    {
      "url":"http://briantree.se/quick-tip-06-use-four-value-syntax-properly-position-background-images/",
      "title":"Basic information"
    }
  ],
  "bugs":[
    {
      "description":"Safari 8 [has a bug](https://discussions.apple.com/thread/6679022) with bottom-positioned values `background-attachment: fixed;`"
    },
    {
      "description":"Transitions to `background-position` using edge offsets in Safari requires you to set edge offsets to zero if transitioning from no offset positions.\r\nE.g. for `background-position: right bottom` ; to `background-position: right 5px bottom 5px;`\r\nSafari requires `background-position: right 0 bottom 0;`"
    }
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"y"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"y"
    },
    "op_mob":{
      "10":"n",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":88.74,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"4 value syntax",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],56:[function(require,module,exports){
module.exports={
  "title":"CSS background-blend-mode",
  "description":"Allows blending between CSS background images, gradients, and colors.",
  "spec":"http://www.w3.org/TR/compositing-1/#propdef-background-blend-mode",
  "status":"cr",
  "links":[
    {
      "url":"http://codepen.io/bennettfeely/pen/rxoAc",
      "title":"codepen example"
    },
    {
      "url":"https://medium.com/web-design-technique/6b51bf53743a",
      "title":"Blog post"
    },
    {
      "url":"http://bennettfeely.com/gradients",
      "title":"Demo"
    }
  ],
  "bugs":[
    {
      "description":"iOS Safari is reported to not support multiple  background-blend-modes"
    }
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"a #2",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"a #1",
      "8":"a #1",
      "9":"a #1",
      "9.1":"a #1",
      "10":"a #1",
      "TP":"a #1"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"a #2",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"a #1",
      "8.1-8.4":"a #1",
      "9.0-9.2":"a #1",
      "9.3":"a #1"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"a #2"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Partial in Safari refers to not supporting the `hue`, `saturation`, `color`, and `luminosity` blend modes.",
    "2":"Chrome 46 has some [serious bugs](https://code.google.com/p/chromium/issues/detail?id=543583) with multiply, difference, and exclusion blend modes"
  },
  "usage_perc_y":59.83,
  "usage_perc_a":11.28,
  "ucprefix":false,
  "parent":"",
  "keywords":"css blend modes,css blending modes,blending,multiply,screen,background",
  "ie_id":"",
  "chrome_id":"5768037999312896",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],57:[function(require,module,exports){
module.exports={
  "title":"CSS box-decoration-break",
  "description":"Controls whether the box's margins, borders, padding, and other decorations wrap the broken edges of the box fragments (when the box is split by a break (page/column/region/line).",
  "spec":"http://www.w3.org/TR/css3-break/#break-decoration",
  "status":"wd",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/box-decoration-break",
      "title":"MDN article"
    },
    {
      "url":"http://jsbin.com/xojoro/edit?css,output",
      "title":"Demo of effect on box border"
    },
    {
      "url":"https://wpdev.uservoice.com/forums/257854-microsoft-edge-developer/suggestions/6514472-box-decoration-break",
      "title":"Microsoft Edge feature request on UserVoice"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"a x #1",
      "23":"a x #1",
      "24":"a x #1",
      "25":"a x #1",
      "26":"a x #1",
      "27":"a x #1",
      "28":"a x #1",
      "29":"a x #1",
      "30":"a x #1",
      "31":"a x #1",
      "32":"a x #1",
      "33":"a x #1",
      "34":"a x #1",
      "35":"a x #1",
      "36":"a x #1",
      "37":"a x #1",
      "38":"a x #1",
      "39":"a x #1",
      "40":"a x #1",
      "41":"a x #1",
      "42":"a x #1",
      "43":"a x #1",
      "44":"a x #1",
      "45":"a x #1",
      "46":"a x #1",
      "47":"a x #1",
      "48":"a x #1",
      "49":"a x #1",
      "50":"a x #1",
      "51":"a x #1",
      "52":"a x #1",
      "53":"a x #1",
      "54":"a x #1"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"a x #1",
      "7":"a x #1",
      "7.1":"a x #1",
      "8":"a x #1",
      "9":"a x #1",
      "9.1":"a x #1",
      "10":"a x #1",
      "TP":"a x #1"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"y #1",
      "11.1":"y #1",
      "11.5":"y #1",
      "11.6":"y #1",
      "12":"y #1",
      "12.1":"y #1",
      "15":"a x #1",
      "16":"a x #1",
      "17":"a x #1",
      "18":"a x #1",
      "19":"a x #1",
      "20":"a x #1",
      "21":"a x #1",
      "22":"a x #1",
      "23":"a x #1",
      "24":"a x #1",
      "25":"a x #1",
      "26":"a x #1",
      "27":"a x #1",
      "28":"a x #1",
      "29":"a x #1",
      "30":"a x #1",
      "31":"a x #1",
      "32":"a x #1",
      "33":"a x #1",
      "34":"a x #1",
      "35":"a x #1",
      "36":"a x #1",
      "37":"a x #1",
      "38":"a x #1",
      "39":"a x #1",
      "40":"a x #1"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"a x #1",
      "8":"a x #1",
      "8.1-8.4":"a x #1",
      "9.0-9.2":"a x #1",
      "9.3":"a x #1"
    },
    "op_mini":{
      "all":"a #1"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"a x #1",
      "4.4.3-4.4.4":"a x #1",
      "50":"a x #1"
    },
    "bb":{
      "7":"n",
      "10":"a x #1"
    },
    "op_mob":{
      "10":"n",
      "11":"y #1",
      "11.1":"y #1",
      "11.5":"y #1",
      "12":"y #1",
      "12.1":"y #1",
      "37":"a x #1"
    },
    "and_chr":{
      "50":"a x #1"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"a x #1"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Partial support refers to working for inline elements but not across column or page breaks."
  },
  "usage_perc_y":7.74,
  "usage_perc_a":72.75,
  "ucprefix":false,
  "parent":"",
  "keywords":"box-decoration,box decoration,break",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],58:[function(require,module,exports){
module.exports={
  "title":"CSS3 Box-shadow",
  "description":"Method of displaying an inner or outer shadow effect to elements",
  "spec":"http://www.w3.org/TR/css3-background/#box-shadow",
  "status":"cr",
  "links":[
    {
      "url":"https://developer.mozilla.org/En/CSS/-moz-box-shadow",
      "title":"MDN article"
    },
    {
      "url":"http://westciv.com/tools/boxshadows/index.html",
      "title":"Live editor"
    },
    {
      "url":"http://tests.themasta.com/blogstuff/boxshadowdemo.html",
      "title":"Demo of various effects"
    },
    {
      "url":"http://www.css3files.com/shadow/",
      "title":"Information page"
    },
    {
      "url":"http://docs.webplatform.org/wiki/css/properties/box-shadow",
      "title":"WebPlatform Docs"
    }
  ],
  "bugs":[
    {
      "description":"Edge and IE up to 11 suppress box-shadow in tables with border-collapse:collapse. [test case](http://codepen.io/Fyrd/pen/oXVYyq)"
    },
    {
      "description":"Safari 6, iOS 6 and Android 2.3 default browser don't work with a 0px value for \"blur-radius\".\r\ne.g. `-webkit-box-shadow: 5px 1px 0px 1px #f04e29;`\r\ndoesn't work, but\r\n`-webkit-box-shadow: 5px 1px 1px 1px #f04e29`\r\ndoes."
    },
    {
      "description":"iOS 8 has a bug where the box shadow disappears when zooming in a certain amount. [test case](http://jsfiddle.net/b6aaq57z/4/)"
    }
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"y x",
      "3.6":"y x",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y x",
      "5":"y x",
      "6":"y x",
      "7":"y x",
      "8":"y x",
      "9":"y x",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"a x #1",
      "3.2":"a x #1",
      "4":"a x #1",
      "5":"y x",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"a x #1",
      "4.0-4.1":"y x",
      "4.2-4.3":"y x",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"a x #1",
      "2.2":"a x #1",
      "2.3":"a x #1",
      "3":"a x #1",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y x",
      "10":"y"
    },
    "op_mob":{
      "10":"n",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"Can be partially emulated in older IE versions using the non-standard \"shadow\" filter.",
  "notes_by_num":{
    "1":"Partial support in Safari, iOS Safari and Android Browser refers to missing \"inset\", blur radius value, and multiple shadow support."
  },
  "usage_perc_y":92.51,
  "usage_perc_a":0.04,
  "ucprefix":false,
  "parent":"",
  "keywords":"box-shadows,boxshadows,box shadow,shaow",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],59:[function(require,module,exports){
module.exports={
  "title":"CSS Canvas Drawings",
  "description":"Method of using HTML5 Canvas as a background image. Not currently part of any specification.",
  "spec":"http://webkit.org/blog/176/css-canvas-drawing/",
  "status":"unoff",
  "links":[
    {
      "url":"http://webkit.org/blog/176/css-canvas-drawing/",
      "title":"Webkit blog post"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"u",
      "49":"u",
      "50":"u"
    },
    "chrome":{
      "4":"y x",
      "5":"y x",
      "6":"y x",
      "7":"y x",
      "8":"y x",
      "9":"y x",
      "10":"y x",
      "11":"y x",
      "12":"y x",
      "13":"y x",
      "14":"y x",
      "15":"y x",
      "16":"y x",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y x",
      "27":"y x",
      "28":"y x",
      "29":"y x",
      "30":"y x",
      "31":"y x",
      "32":"y x",
      "33":"y x",
      "34":"y x",
      "35":"y x",
      "36":"y x",
      "37":"y x",
      "38":"y x",
      "39":"y x",
      "40":"y x",
      "41":"y x",
      "42":"y x",
      "43":"y x",
      "44":"y x",
      "45":"y x",
      "46":"y x",
      "47":"y x",
      "48":"n",
      "49":"n",
      "50":"n",
      "51":"n",
      "52":"n",
      "53":"n",
      "54":"n"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"y x",
      "5":"y x",
      "5.1":"y x",
      "6":"y x",
      "6.1":"y x",
      "7":"y x",
      "7.1":"y x",
      "8":"y x",
      "9":"y x",
      "9.1":"y x",
      "10":"y x",
      "TP":"y x"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"y x",
      "16":"y x",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y x",
      "27":"y x",
      "28":"y x",
      "29":"y x",
      "30":"y x",
      "31":"y x",
      "32":"y x",
      "33":"y x",
      "34":"y x",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n"
    },
    "ios_saf":{
      "3.2":"y x",
      "4.0-4.1":"y x",
      "4.2-4.3":"y x",
      "5.0-5.1":"y x",
      "6.0-6.1":"y x",
      "7.0-7.1":"y x",
      "8":"y x",
      "8.1-8.4":"y x",
      "9.0-9.2":"y x",
      "9.3":"y x"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"y x",
      "2.2":"y x",
      "2.3":"y x",
      "3":"y x",
      "4":"y x",
      "4.1":"y x",
      "4.2-4.3":"y x",
      "4.4":"y x",
      "4.4.3-4.4.4":"y x",
      "50":"n"
    },
    "bb":{
      "7":"y x",
      "10":"y x"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"y x"
    },
    "samsung":{
      "4":"y x"
    }
  },
  "notes":"A similar effect can be achieved in Firefox 4+ using the -moz-element() background property",
  "notes_by_num":{
    
  },
  "usage_perc_y":28.67,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],60:[function(require,module,exports){
module.exports={
  "title":"Case-insensitive CSS attribute selectors",
  "description":"Including an `i` before the `]` in a CSS attribute selector causes the attribute value to be matched in an ASCII-case-insensitive manner. For example, `[b=\"xyz\" i]` would match both `<a b=\"xyz\">` and `<a b=\"XYZ\">`.",
  "spec":"https://drafts.csswg.org/selectors-4/#attribute-case",
  "status":"unoff",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/Attribute_selectors#case-insensitive",
      "title":"Mozilla Developer Network article"
    },
    {
      "url":"http://jsbin.com/zutuna/edit?html,css,output",
      "title":"JS Bin testcase"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":61.04,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"i,attribute,case,insensitive,sensitive,sensitivity,insensitivity",
  "ie_id":"",
  "chrome_id":"5610936115134464",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],61:[function(require,module,exports){
module.exports={
  "title":"CSS clip-path property",
  "description":"Method of defining the visible region of an element using SVG or a shape definition.",
  "spec":"http://www.w3.org/TR/css-masking-1/#the-clip-path",
  "status":"cr",
  "links":[
    {
      "url":"http://css-tricks.com/almanac/properties/c/clip/",
      "title":"CSS Tricks article"
    },
    {
      "url":"http://codepen.io/dubrod/details/myNNyW/",
      "title":"Codepen Example Clipping an Image with a Polygon"
    }
  ],
  "bugs":[
    {
      "description":"Chrome has an issue with [clip-paths and backface-visibility with 3D transforms](https://code.google.com/p/chromium/issues/detail?id=350724)"
    }
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"a #1",
      "3.6":"a #1",
      "4":"a #1",
      "5":"a #1",
      "6":"a #1",
      "7":"a #1",
      "8":"a #1",
      "9":"a #1",
      "10":"a #1",
      "11":"a #1",
      "12":"a #1",
      "13":"a #1",
      "14":"a #1",
      "15":"a #1",
      "16":"a #1",
      "17":"a #1",
      "18":"a #1",
      "19":"a #1",
      "20":"a #1",
      "21":"a #1",
      "22":"a #1",
      "23":"a #1",
      "24":"a #1",
      "25":"a #1",
      "26":"a #1",
      "27":"a #1",
      "28":"a #1",
      "29":"a #1",
      "30":"a #1",
      "31":"a #1",
      "32":"a #1",
      "33":"a #1",
      "34":"a #1",
      "35":"a #1",
      "36":"a #1",
      "37":"a #1",
      "38":"a #1",
      "39":"a #1",
      "40":"a #1",
      "41":"a #1",
      "42":"a #1",
      "43":"a #1",
      "44":"a #1",
      "45":"a #1",
      "46":"a #1",
      "47":"a #1 #3",
      "48":"a #1 #3",
      "49":"a #1 #3",
      "50":"a #1 #3"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"a x #2",
      "25":"a x #2",
      "26":"a x #2",
      "27":"a x #2",
      "28":"a x #2",
      "29":"a x #2",
      "30":"a x #2",
      "31":"a x #2",
      "32":"a x #2",
      "33":"a x #2",
      "34":"a x #2",
      "35":"a x #2",
      "36":"a x #2",
      "37":"a x #2",
      "38":"a x #2",
      "39":"a x #2",
      "40":"a x #2",
      "41":"a x #2",
      "42":"a x #2",
      "43":"a x #2",
      "44":"a x #2",
      "45":"a x #2",
      "46":"a x #2",
      "47":"a x #2",
      "48":"a x #2",
      "49":"a x #2",
      "50":"a x #2",
      "51":"a x #2",
      "52":"a x #2",
      "53":"a x #2",
      "54":"a x #2"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"a x #2",
      "7.1":"a x #2",
      "8":"a x #2",
      "9":"a x #2",
      "9.1":"a x #2",
      "10":"a x #2",
      "TP":"a x #2"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"a x #2",
      "16":"a x #2",
      "17":"a x #2",
      "18":"a x #2",
      "19":"a x #2",
      "20":"a x #2",
      "21":"a x #2",
      "22":"a x #2",
      "23":"a x #2",
      "24":"a x #2",
      "25":"a x #2",
      "26":"a x #2",
      "27":"a x #2",
      "28":"a x #2",
      "29":"a x #2",
      "30":"a x #2",
      "31":"a x #2",
      "32":"a x #2",
      "33":"a x #2",
      "34":"a x #2",
      "35":"a x #2",
      "36":"a x #2",
      "37":"a x #2",
      "38":"a x #2",
      "39":"a x #2",
      "40":"a x #2"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"a x #2",
      "8":"a x #2",
      "8.1-8.4":"a x #2",
      "9.0-9.2":"a x #2",
      "9.3":"a x #2"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"a x #2",
      "4.4.3-4.4.4":"a x #2",
      "50":"a x #2"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"a x #2"
    },
    "and_chr":{
      "50":"a x #2"
    },
    "and_ff":{
      "46":"a #1"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"a x #2"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Partial support refers to only supporting the `url()` syntax.",
    "2":"Partial support refers to supporting shapes and the `url(#foo)` syntax for inline SVG, but not shapes in external SVGs.",
    "3":"Supports shapes behind the `layout.css.clip-path-shapes.enabled` flag"
  },
  "usage_perc_y":0,
  "usage_perc_a":76.16,
  "ucprefix":false,
  "parent":"css-masks",
  "keywords":"clippath",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],62:[function(require,module,exports){
module.exports={
  "title":"CSS Containment",
  "description":"The CSS `contain` property lets developers limit the scope of the browser's styles, layout and paint work for faster and more efficient rendering.",
  "spec":"https://drafts.csswg.org/css-containment/#style-containment",
  "status":"unoff",
  "links":[
    {
      "url":"https://developers.google.com/web/updates/2016/06/css-containment",
      "title":"Google Developers article"
    },
    {
      "url":"https://bugzilla.mozilla.org/show_bug.cgi?id=1150081",
      "title":"Firefox bug"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"n"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"u"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n",
      "51":"n d #1",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n",
      "TP":"n"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n d #1",
      "39":"n d #1",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Enabled via the \"Experimental Web Platform features\" flag"
  },
  "usage_perc_y":0.18,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"",
  "ie_id":"csscontainment",
  "chrome_id":"6522186978295808",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],63:[function(require,module,exports){
module.exports={
  "title":"CSS Counters",
  "description":"Method of controlling number values in generated content, using the `counter-reset` and `counter-increment` properties.",
  "spec":"http://www.w3.org/TR/CSS21/generate.html#counters",
  "status":"rec",
  "links":[
    {
      "url":"http://onwebdev.blogspot.com/2012/02/css-counters-tutorial.html",
      "title":"Tutorial and information"
    },
    {
      "url":"https://developer.mozilla.org/en/CSS_Counters",
      "title":"MDN article"
    },
    {
      "url":"http://docs.webplatform.org/wiki/css/properties/counter-reset",
      "title":"WebPlatform Docs"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS2"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"y",
      "3":"y",
      "3.5":"y",
      "3.6":"y",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"y",
      "3.2":"y",
      "4":"y",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"y",
      "9.5-9.6":"y",
      "10.0-10.1":"y",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"y",
      "4.0-4.1":"y",
      "4.2-4.3":"y",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"y"
    },
    "android":{
      "2.1":"y",
      "2.2":"y",
      "2.3":"y",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":97.96,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],64:[function(require,module,exports){
module.exports={
  "title":"Crisp edges/pixelated images",
  "description":"Scales images with an algorithm that preserves edges and contrast, without smoothing colors or introducing blur. This is intended for images such as pixel art. Official values that accomplish this for the `image-rendering` property are `crisp-edges` and `pixelated`.",
  "spec":"http://dev.w3.org/csswg/css-images-3/#valdef-image-rendering-crisp-edges",
  "status":"unoff",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/image-rendering",
      "title":"MDN article"
    },
    {
      "url":"http://updates.html5rocks.com/2015/01/pixelated",
      "title":"HTML5Rocks article"
    }
  ],
  "bugs":[
    {
      "description":"`image-rendering:-webkit-optimize-contrast;` and `-ms-interpolation-mode:nearest-neighbor` do not affect CSS images."
    }
  ],
  "categories":[
    "CSS",
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"a x #2 #5",
      "8":"a x #2 #5",
      "9":"a x #2 #5",
      "10":"a x #2 #5",
      "11":"a x #2 #5"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"y x #3",
      "4":"y x #3",
      "5":"y x #3",
      "6":"y x #3",
      "7":"y x #3",
      "8":"y x #3",
      "9":"y x #3",
      "10":"y x #3",
      "11":"y x #3",
      "12":"y x #3",
      "13":"y x #3",
      "14":"y x #3",
      "15":"y x #3",
      "16":"y x #3",
      "17":"y x #3",
      "18":"y x #3",
      "19":"y x #3",
      "20":"y x #3",
      "21":"y x #3",
      "22":"y x #3",
      "23":"y x #3",
      "24":"y x #3",
      "25":"y x #3",
      "26":"y x #3",
      "27":"y x #3",
      "28":"y x #3",
      "29":"y x #3",
      "30":"y x #3",
      "31":"y x #3",
      "32":"y x #3",
      "33":"y x #3",
      "34":"y x #3",
      "35":"y x #3",
      "36":"y x #3",
      "37":"y x #3",
      "38":"y x #3",
      "39":"y x #3",
      "40":"y x #3",
      "41":"y x #3",
      "42":"y x #3",
      "43":"y x #3",
      "44":"y x #3",
      "45":"y x #3",
      "46":"y x #3",
      "47":"y x #3",
      "48":"y x #3",
      "49":"y x #3",
      "50":"y x #3"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"y #4",
      "42":"y #4",
      "43":"y #4",
      "44":"y #4",
      "45":"y #4",
      "46":"y #4",
      "47":"y #4",
      "48":"y #4",
      "49":"y #4",
      "50":"y #4",
      "51":"y #4",
      "52":"y #4",
      "53":"y #4",
      "54":"y #4"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"a x #1",
      "6.1":"a x #3 #6",
      "7":"a x #3 #6",
      "7.1":"a x #3 #6",
      "8":"a x #3 #6",
      "9":"a x #3 #6",
      "9.1":"a x #3 #6",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"y x #3",
      "12":"y x #3",
      "12.1":"y x #3",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"y #4",
      "29":"y #4",
      "30":"y #4",
      "31":"y #4",
      "32":"y #4",
      "33":"y #4",
      "34":"y #4",
      "35":"y #4",
      "36":"y #4",
      "37":"y #4",
      "38":"y #4",
      "39":"y #4",
      "40":"y #4"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"a x #1 #6",
      "6.0-6.1":"a x #1 #6",
      "7.0-7.1":"a x #3 #6",
      "8":"a x #3 #6",
      "8.1-8.4":"a x #3 #6",
      "9.0-9.2":"a x #3 #6",
      "9.3":"a x #3 #6"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"y #4"
    },
    "bb":{
      "7":"n",
      "10":"a x #1 #6"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"y x #3",
      "12.1":"y x #3",
      "37":"y #4"
    },
    "and_chr":{
      "50":"y #4"
    },
    "and_ff":{
      "46":"y x #3"
    },
    "ie_mob":{
      "10":"a x #2 #5",
      "11":"a x #2 #5"
    },
    "and_uc":{
      "9.9":"a x #1 #6"
    },
    "samsung":{
      "4":"y #4"
    }
  },
  "notes":"Note that prefixes apply to the value (e.g. `-moz-crisp-edges`), not the `image-rendering` property.",
  "notes_by_num":{
    "1":"Supported using the non-standard value `-webkit-optimize-contrast`",
    "2":"Internet Explorer accomplishes support using the non-standard declaration `-ms-interpolation-mode: nearest-neighbor`",
    "3":"Supports the `crisp-edges` value, but not `pixelated`.",
    "4":"Supports the `pixelated` value, but not `crisp-edges`.",
    "5":"Only works on `<img>`, not CSS backgrounds or `<canvas>`.",
    "6":"Only works on `<img>` and CSS backgrounds, _not_ `<canvas>`. "
  },
  "usage_perc_y":60.59,
  "usage_perc_a":24.89,
  "ucprefix":false,
  "parent":"",
  "keywords":"image-rendering,crisp-edges",
  "ie_id":"",
  "chrome_id":"5118058116939776",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],65:[function(require,module,exports){
module.exports={
  "title":"CSS Cross-Fade Function",
  "description":"Image function to create a \"crossfade\" between images. This allows one image to transition (fade) into another based on a percentage value.",
  "spec":"https://drafts.csswg.org/css-images-3/#cross-fade-function",
  "status":"unoff",
  "links":[
    {
      "url":"http://peter.sh/files/examples/cross-fading.html",
      "title":"Simple demo"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y x",
      "27":"y x",
      "28":"y x",
      "29":"y x",
      "30":"y x",
      "31":"y x",
      "32":"y x",
      "33":"y x",
      "34":"y x",
      "35":"y x",
      "36":"y x",
      "37":"y x",
      "38":"y x",
      "39":"y x",
      "40":"y x",
      "41":"y x",
      "42":"y x",
      "43":"y x",
      "44":"y x",
      "45":"y x",
      "46":"y x",
      "47":"y x",
      "48":"y x",
      "49":"y x",
      "50":"y x",
      "51":"y x",
      "52":"y x",
      "53":"y x",
      "54":"y x"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"y x",
      "6":"y x",
      "6.1":"y x",
      "7":"y x",
      "7.1":"y x",
      "8":"y x",
      "9":"y x",
      "9.1":"y x",
      "10":"y",
      "TP":"y x"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"y x",
      "16":"y x",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y x",
      "27":"y x",
      "28":"y x",
      "29":"y x",
      "30":"y x",
      "31":"y x",
      "32":"y x",
      "33":"y x",
      "34":"y x",
      "35":"y x",
      "36":"y x",
      "37":"y x",
      "38":"y x",
      "39":"y x",
      "40":"y x"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"y x",
      "6.0-6.1":"y x",
      "7.0-7.1":"y x",
      "8":"y x",
      "8.1-8.4":"y x",
      "9.0-9.2":"y x",
      "9.3":"y x"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"y x",
      "4.4.3-4.4.4":"y x",
      "50":"y x"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y x"
    },
    "and_chr":{
      "50":"y x"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"y x"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":68.25,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"css,image,crossfade",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],66:[function(require,module,exports){
module.exports={
  "title":":default CSS pseudo-class",
  "description":"The `:default` pseudo-class matches checkboxes and radio buttons which are checked by default, `<option>`s with the `selected` attribute, and the default submit button (if any) of a form.",
  "spec":"https://drafts.csswg.org/selectors-4/#the-default-pseudo",
  "status":"unoff",
  "links":[
    {
      "url":"https://html.spec.whatwg.org/multipage/scripting.html#selector-default",
      "title":"HTML specification for `:default`"
    },
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/:default",
      "title":"Mozilla Developer Network article"
    },
    {
      "url":"https://wpdev.uservoice.com/forums/257854-microsoft-edge-developer/suggestions/13311459--default-pseudo-class-from-selectors-level-4",
      "title":"MS Edge feature request on UserVoice"
    },
    {
      "url":"http://jsbin.com/hiyada/edit?html,css,output",
      "title":"JS Bin testcase"
    },
    {
      "url":"https://bugs.webkit.org/show_bug.cgi?id=156230",
      "title":"WebKit bug 156230 - `:default` CSS pseudo-class should match checkboxes+radios with a `checked` attribute"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"u",
      "3":"u",
      "3.5":"u",
      "3.6":"u",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"u",
      "5":"u",
      "6":"u",
      "7":"u",
      "8":"u",
      "9":"u",
      "10":"u",
      "11":"u",
      "12":"u",
      "13":"u",
      "14":"u",
      "15":"a #1",
      "16":"a #1",
      "17":"a #1",
      "18":"a #1",
      "19":"a #1",
      "20":"a #1",
      "21":"a #1",
      "22":"a #1",
      "23":"a #1",
      "24":"a #1",
      "25":"a #1",
      "26":"a #1",
      "27":"a #1",
      "28":"a #1",
      "29":"a #1",
      "30":"a #1",
      "31":"a #1",
      "32":"a #1",
      "33":"a #1",
      "34":"a #1",
      "35":"a #1",
      "36":"a #1",
      "37":"a #1",
      "38":"a #1",
      "39":"a #1",
      "40":"a #1",
      "41":"a #1",
      "42":"a #1",
      "43":"a #1",
      "44":"a #1",
      "45":"a #1",
      "46":"a #1",
      "47":"a #1",
      "48":"a #1",
      "49":"a #1",
      "50":"a #1",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"u",
      "3.2":"u",
      "4":"u",
      "5":"u",
      "5.1":"a #1",
      "6":"a #1",
      "6.1":"a #1",
      "7":"a #1",
      "7.1":"a #1",
      "8":"a #1",
      "9":"a #1",
      "9.1":"a #1",
      "10":"a #1",
      "TP":"y"
    },
    "opera":{
      "9":"u",
      "9.5-9.6":"u",
      "10.0-10.1":"u",
      "10.5":"u",
      "10.6":"u",
      "11":"u",
      "11.1":"u",
      "11.5":"u",
      "11.6":"a #2",
      "12":"a #2",
      "12.1":"a #2",
      "15":"a #1",
      "16":"a #1",
      "17":"a #1",
      "18":"a #1",
      "19":"a #1",
      "20":"a #1",
      "21":"a #1",
      "22":"a #1",
      "23":"a #1",
      "24":"a #1",
      "25":"a #1",
      "26":"a #1",
      "27":"a #1",
      "28":"a #1",
      "29":"a #1",
      "30":"a #1",
      "31":"a #1",
      "32":"a #1",
      "33":"a #1",
      "34":"a #1",
      "35":"a #1",
      "36":"a #1",
      "37":"a #1",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"u",
      "4.0-4.1":"u",
      "4.2-4.3":"u",
      "5.0-5.1":"u",
      "6.0-6.1":"u",
      "7.0-7.1":"a #1",
      "8":"a #1",
      "8.1-8.4":"a #1",
      "9.0-9.2":"a #1",
      "9.3":"a #1"
    },
    "op_mini":{
      "all":"a #2"
    },
    "android":{
      "2.1":"u",
      "2.2":"u",
      "2.3":"u",
      "3":"u",
      "4":"a #1",
      "4.1":"a #1",
      "4.2-4.3":"a #1",
      "4.4":"a #1",
      "4.4.3-4.4.4":"a #1",
      "50":"a #1"
    },
    "bb":{
      "7":"u",
      "10":"a #1"
    },
    "op_mob":{
      "10":"u",
      "11":"u",
      "11.1":"u",
      "11.5":"u",
      "12":"u",
      "12.1":"a #2",
      "37":"a #1"
    },
    "and_chr":{
      "50":"a #1"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"a #1"
    },
    "samsung":{
      "4":"a #1"
    }
  },
  "notes":"Whether `<option selected>` matches `:default` (per the spec) was not tested since `<select>`s and `<option>`s are generally not styleable, which makes it hard to formulate a test for this.",
  "notes_by_num":{
    "1":"Does not match `<input type=\"checkbox\" checked>` or `<input type=\"radio\" checked>`",
    "2":"Does not match the default submit button of a form"
  },
  "usage_perc_y":25.97,
  "usage_perc_a":62.96,
  "ucprefix":false,
  "parent":"",
  "keywords":":default,default",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],67:[function(require,module,exports){
module.exports={
  "title":"Explicit descendant combinator >>",
  "description":"An explicit, non-whitespace spelling of the descendant combinator. `A >> B` is equivalent to `A B`.",
  "spec":"https://drafts.csswg.org/selectors-4/#descendant-combinators",
  "status":"unoff",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/Descendant_selectors",
      "title":"MDN article"
    },
    {
      "url":"http://jsbin.com/qipekof/edit?html,css,output",
      "title":"JS Bin testcase"
    },
    {
      "url":"https://bugs.chromium.org/p/chromium/issues/detail?id=446050",
      "title":"Chrome issue #446050: Implement Descendant Combinator \">>\""
    },
    {
      "url":"https://bugzilla.mozilla.org/show_bug.cgi?id=1266283",
      "title":"Mozilla bug #1266283 - Implement CSS4 descendant combinator `>>`"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n",
      "51":"n",
      "52":"n",
      "53":"u",
      "54":"u"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":0,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],68:[function(require,module,exports){
module.exports={
  "title":"CSS Device Adaptation",
  "description":"A standard way to override the size of viewport in web page using the `@viewport` rule, standardizing and replacing Apple's own popular `<meta>` viewport implementation.",
  "spec":"http://www.w3.org/TR/css-device-adapt/",
  "status":"wd",
  "links":[
    {
      "url":"https://dev.opera.com/articles/view/an-introduction-to-meta-viewport-and-viewport/",
      "title":"Introduction to meta viewport and @viewport in Opera Mobile"
    },
    {
      "url":"http://msdn.microsoft.com/en-us/library/ie/hh708740(v=vs.85).aspx",
      "title":"Device adaptation in Internet Explorer 10"
    },
    {
      "url":"https://wpdev.uservoice.com/forums/257854-microsoft-edge-developer/suggestions/6777420-unprefix-and-support-all-viewport-properties",
      "title":"Microsoft Edge feature request on UserVoice"
    },
    {
      "url":"https://code.google.com/p/chromium/issues/detail?id=155477",
      "title":"Chrome tracking bug"
    },
    {
      "url":"https://bugs.webkit.org/show_bug.cgi?id=95959",
      "title":"WebKit tracking bug"
    },
    {
      "url":"https://bugzilla.mozilla.org/show_bug.cgi?id=747754",
      "title":"Mozilla tracking bug"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"a x #1",
      "11":"a x #1"
    },
    "edge":{
      "12":"a x #1",
      "13":"a x #1",
      "14":"a x #1"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n d",
      "30":"n d",
      "31":"n d",
      "32":"n d",
      "33":"n d",
      "34":"n d",
      "35":"n d",
      "36":"n d",
      "37":"n d",
      "38":"n d",
      "39":"n d",
      "40":"n d",
      "41":"n d",
      "42":"n d",
      "43":"n d",
      "44":"n d",
      "45":"n d",
      "46":"n d",
      "47":"n d",
      "48":"n d",
      "49":"n d",
      "50":"n d",
      "51":"n d",
      "52":"n d",
      "53":"n d",
      "54":"n d"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n",
      "TP":"n"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"a x #2"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"a x #2",
      "11.1":"a x #2",
      "11.5":"a x #2",
      "12":"a x #2",
      "12.1":"a x #2",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"a x #1",
      "11":"a x #1"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"IE only supports the 'width' and 'height' properties.",
    "2":"Opera Mobile and Opera Mini only support the 'orientation' property."
  },
  "usage_perc_y":0,
  "usage_perc_a":12.22,
  "ucprefix":false,
  "parent":"",
  "keywords":"viewport",
  "ie_id":"",
  "chrome_id":"4737164243894272",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],69:[function(require,module,exports){
module.exports={
  "title":":dir() CSS pseudo-class",
  "description":"Matches elements based on their directionality. `:dir(ltr)` matches elements which are Left-to-Right. `:dir(rtl)` matches elements which are Right-to-Left.",
  "spec":"https://www.w3.org/TR/selectors4/#the-dir-pseudo",
  "status":"wd",
  "links":[
    {
      "url":"https://html.spec.whatwg.org/multipage/scripting.html#selector-ltr",
      "title":"HTML specification for `:dir()`"
    },
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/:dir",
      "title":"Mozilla Developer Network article"
    },
    {
      "url":"https://bugs.chromium.org/p/chromium/issues/detail?id=576815",
      "title":"Chrome issue #576815: CSS4 pseudo-class :dir()"
    },
    {
      "url":"https://wpdev.uservoice.com/forums/257854-microsoft-edge-developer/suggestions/12299532--dir",
      "title":"Microsoft Edge feature request on UserVoice"
    },
    {
      "url":"https://bugs.webkit.org/show_bug.cgi?id=64861",
      "title":"WebKit bug #64861: Need support for :dir() pseudo-class"
    },
    {
      "url":"http://jsbin.com/celuye/edit?html,css,output",
      "title":"JS Bin testcase"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"n"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y x",
      "27":"y x",
      "28":"y x",
      "29":"y x",
      "30":"y x",
      "31":"y x",
      "32":"y x",
      "33":"y x",
      "34":"y x",
      "35":"y x",
      "36":"y x",
      "37":"y x",
      "38":"y x",
      "39":"y x",
      "40":"y x",
      "41":"y x",
      "42":"y x",
      "43":"y x",
      "44":"y x",
      "45":"y x",
      "46":"y x",
      "47":"y x",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n",
      "51":"n",
      "52":"n",
      "53":"n",
      "54":"n"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n",
      "TP":"n"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":7.94,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":":dir,dir,direction,ltr,rtl,left,right",
  "ie_id":"",
  "chrome_id":"5751531651465216",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],70:[function(require,module,exports){
module.exports={
  "title":"CSS element() function",
  "description":"This function renders a live image generated from an arbitrary HTML element",
  "spec":"http://www.w3.org/TR/css4-images/#element-notation",
  "status":"wd",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/element",
      "title":"MDN page"
    }
  ],
  "bugs":[
    {
      "description":"Chromium [bug #108972](https://code.google.com/p/chromium/issues/detail?id=108972)"
    },
    {
      "description":"WebKit [bug #44650](https://bugs.webkit.org/show_bug.cgi?id=44650)"
    }
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"a x #1",
      "3":"a x #1",
      "3.5":"a x #1",
      "3.6":"a x #1",
      "4":"y x",
      "5":"y x",
      "6":"y x",
      "7":"y x",
      "8":"y x",
      "9":"y x",
      "10":"y x",
      "11":"y x",
      "12":"y x",
      "13":"y x",
      "14":"y x",
      "15":"y x",
      "16":"y x",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y x",
      "27":"y x",
      "28":"y x",
      "29":"y x",
      "30":"y x",
      "31":"y x",
      "32":"y x",
      "33":"y x",
      "34":"y x",
      "35":"y x",
      "36":"y x",
      "37":"y x",
      "38":"y x",
      "39":"y x",
      "40":"y x",
      "41":"y x",
      "42":"y x",
      "43":"y x",
      "44":"y x",
      "45":"y x",
      "46":"y x",
      "47":"y x",
      "48":"y x",
      "49":"y x",
      "50":"y x"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n",
      "51":"n",
      "52":"n",
      "53":"n",
      "54":"n"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n",
      "TP":"n"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"y x"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"In Firefox < 4, usage limited to the background and background-image CSS properties"
  },
  "usage_perc_y":8.19,
  "usage_perc_a":0.1,
  "ucprefix":false,
  "parent":"",
  "keywords":"element, function",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],71:[function(require,module,exports){
module.exports={
  "title":"CSS Exclusions Level 1",
  "description":"Exclusions defines how inline content flows around elements. It extends the content wrapping ability of floats to any block-level element.",
  "spec":"http://www.w3.org/TR/css3-exclusions/",
  "status":"wd",
  "links":[
    {
      "url":"https://msdn.microsoft.com/en-us/library/ie/hh673558(v=vs.85).aspx",
      "title":"CSS Exclusions"
    },
    {
      "url":"https://bugzilla.mozilla.org/show_bug.cgi?id=674804",
      "title":"Firefox tracking bug"
    },
    {
      "url":"https://bugs.webkit.org/show_bug.cgi?id=57311",
      "title":"WebKit tracking bug"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"y x",
      "11":"y x"
    },
    "edge":{
      "12":"y x",
      "13":"y x",
      "14":"y x"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n",
      "51":"n",
      "52":"n",
      "53":"n",
      "54":"n"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n",
      "TP":"n"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"y x",
      "11":"y x"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":7.52,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"floats,exclusions,wrap-flow,wrap-through",
  "ie_id":"exclusions",
  "chrome_id":"6296903092273152",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],72:[function(require,module,exports){
module.exports={
  "title":"CSS Feature Queries",
  "description":"CSS Feature Queries allow authors to condition rules based on whether particular property declarations are supported in CSS using the @supports at rule.",
  "spec":"http://www.w3.org/TR/css3-conditional/#at-supports",
  "status":"cr",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/@supports",
      "title":"MDN Article"
    },
    {
      "url":"http://mcc.id.au/blog/2012/08/supports",
      "title":"@supports in Firefox"
    },
    {
      "url":"http://dabblet.com/gist/3895764",
      "title":"Test case"
    },
    {
      "url":"http://docs.webplatform.org/wiki/css/atrules/@supports",
      "title":"WebPlatform Docs"
    }
  ],
  "bugs":[
    {
      "description":"Using @supports on Chrome 28-29 and Opera 15-16 breaks following :not selectors. [crbug.com/257695](http://crbug.com/257695)"
    },
    {
      "description":"Safari claims to support certain font-feature-settings it actually does not. [This JS module](https://github.com/kennethormandy/font-feature-fibbing) helps to provide accurate support for this."
    }
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"See also the [CSS.supports() DOM API](#feat=css-supports-api)",
  "notes_by_num":{
    
  },
  "usage_perc_y":76.31,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"supports,conditional",
  "ie_id":"conditionalrules",
  "chrome_id":"4993981813358592",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],73:[function(require,module,exports){
module.exports={
  "title":"CSS filter() function",
  "description":"This function filters a CSS input image with a set of filter functions (like blur, grayscale or hue)",
  "spec":"http://www.w3.org/TR/filter-effects/#FilterCSSImageValue",
  "status":"wd",
  "links":[
    {
      "url":"http://iamvdo.me/en/blog/advanced-css-filters#filter",
      "title":"Blog post"
    }
  ],
  "bugs":[
    {
      "description":"Firefox feature request: [Mozilla bug #1191043](https://bugzilla.mozilla.org/show_bug.cgi?id=1191043)"
    }
  ],
  "categories":[
    "CSS",
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n",
      "51":"n",
      "52":"n",
      "53":"n",
      "54":"n"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"y x",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"y x",
      "9.3":"y x"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":10.05,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"filter, function",
  "ie_id":"cssfilterimagefunction",
  "chrome_id":"5425136400334848",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],74:[function(require,module,exports){
module.exports={
  "title":"CSS Filter Effects",
  "description":"Method of applying filter effects (like blur, grayscale, brightness, contrast and hue) to elements, previously only possible by using SVG.",
  "spec":"http://www.w3.org/TR/filter-effects-1/",
  "status":"wd",
  "links":[
    {
      "url":"http://html5-demos.appspot.com/static/css/filters/index.html",
      "title":"Demo file for WebKit browsers"
    },
    {
      "url":"http://www.html5rocks.com/en/tutorials/filters/understanding-css/",
      "title":"HTML5Rocks article"
    },
    {
      "url":"http://dl.dropbox.com/u/3260327/angular/CSS3ImageManipulation.html",
      "title":"Filter editor"
    },
    {
      "url":"http://bennettfeely.com/filters/",
      "title":"Filter Playground"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS",
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n d #2 #4",
      "13":"a #4",
      "14":"a #4"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"a #3",
      "4":"a #3",
      "5":"a #3",
      "6":"a #3",
      "7":"a #3",
      "8":"a #3",
      "9":"a #3",
      "10":"a #3",
      "11":"a #3",
      "12":"a #3",
      "13":"a #3",
      "14":"a #3",
      "15":"a #3",
      "16":"a #3",
      "17":"a #3",
      "18":"a #3",
      "19":"a #3",
      "20":"a #3",
      "21":"a #3",
      "22":"a #3",
      "23":"a #3",
      "24":"a #3",
      "25":"a #3",
      "26":"a #3",
      "27":"a #3",
      "28":"a #3",
      "29":"a #3",
      "30":"a #3",
      "31":"a #3",
      "32":"a #3",
      "33":"a #3",
      "34":"a d #1",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y x",
      "27":"y x",
      "28":"y x",
      "29":"y x",
      "30":"y x",
      "31":"y x",
      "32":"y x",
      "33":"y x",
      "34":"y x",
      "35":"y x",
      "36":"y x",
      "37":"y x",
      "38":"y x",
      "39":"y x",
      "40":"y x",
      "41":"y x",
      "42":"y x",
      "43":"y x",
      "44":"y x",
      "45":"y x",
      "46":"y x",
      "47":"y x",
      "48":"y x",
      "49":"y x",
      "50":"y x",
      "51":"y x",
      "52":"y x",
      "53":"y x",
      "54":"y x"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"y x",
      "6.1":"y x",
      "7":"y x",
      "7.1":"y x",
      "8":"y x",
      "9":"y x",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"y x",
      "16":"y x",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y x",
      "27":"y x",
      "28":"y x",
      "29":"y x",
      "30":"y x",
      "31":"y x",
      "32":"y x",
      "33":"y x",
      "34":"y x",
      "35":"y x",
      "36":"y x",
      "37":"y x",
      "38":"y x",
      "39":"y x",
      "40":"y x"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"y x",
      "7.0-7.1":"y x",
      "8":"y x",
      "8.1-8.4":"y x",
      "9.0-9.2":"y x",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"y x",
      "4.4.3-4.4.4":"y x",
      "50":"y x"
    },
    "bb":{
      "7":"n",
      "10":"y x"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y x"
    },
    "and_chr":{
      "50":"y x"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"y x"
    },
    "samsung":{
      "4":"y x"
    }
  },
  "notes":"Note that this property is significantly different from and incompatible with Microsoft's [older \"filter\" property](http://msdn.microsoft.com/en-us/library/ie/ms530752%28v=vs.85%29.aspx).",
  "notes_by_num":{
    "1":"Supported in Firefox under the `layout.css.filters.enabled` flag.",
    "2":"Supported in MS Edge under the \"Enable CSS filter property\" flag.",
    "3":"Partial support in Firefox before version 34 [only implemented the url() function of the filter property](https://developer.mozilla.org/en-US/docs/Web/CSS/filter#Browser_compatibility)",
    "4":"Partial support refers to supporting filter functions, but not the `url` function."
  },
  "usage_perc_y":82.27,
  "usage_perc_a":2.11,
  "ucprefix":false,
  "parent":"",
  "keywords":"sepia,hue-rotate,invert,saturate,filter:blur",
  "ie_id":"filters",
  "chrome_id":"5822463824887808",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],75:[function(require,module,exports){
module.exports={
  "title":"::first-letter CSS pseudo-element selector",
  "description":"CSS pseudo-element that allows styling only the first \"letter\" of text within an element. Useful for implementing initial caps or drop caps styling.",
  "spec":"http://www.w3.org/TR/css3-selectors/#first-letter",
  "status":"rec",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/::first-letter",
      "title":"Mozilla Developer Network"
    }
  ],
  "bugs":[
    {
      "description":"In webkit-based browsers first character of text inside elements, styled with `::first-letter`, is not highlighted while selecting the text. [See bug](https://bugs.webkit.org/show_bug.cgi?id=6185)"
    },
    {
      "description":"Firefox appears to incorrectly cut off the top & bottom of a `::first-letter` character in certain cases [see Firefox bug #1233271](https://bugzilla.mozilla.org/show_bug.cgi?id=1233271)"
    }
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"u",
      "6":"a #3 #4",
      "7":"a #3 #4",
      "8":"a #3",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"a #2",
      "3":"a #1",
      "3.5":"y",
      "3.6":"y",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"a #1",
      "5":"u",
      "6":"u",
      "7":"u",
      "8":"u",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"u",
      "3.2":"a #1",
      "4":"a #1",
      "5":"u",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"u",
      "9.5-9.6":"u",
      "10.0-10.1":"a #2",
      "10.5":"a #2",
      "10.6":"a #2",
      "11":"a #2",
      "11.1":"a #2",
      "11.5":"a #2",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"u",
      "4.0-4.1":"u",
      "4.2-4.3":"u",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"y"
    },
    "android":{
      "2.1":"u",
      "2.2":"u",
      "2.3":"a #1",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"a #2",
      "11":"a #2",
      "11.1":"a #2",
      "11.5":"a #2",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"The spec says that both letters of digraphs which are always capitalized together (such as \"IJ\" in Dutch) should be matched by ::first-letter, but no browser has ever implemented this.",
  "notes_by_num":{
    "1":"Excludes punctuation immediately after the first letter from the match. (The spec says it should be included in the match.)",
    "2":"Acts like the first character is always a letter even when it's not. For example, given \"!,X;\", \"!,\" is matched instead of the entire string.",
    "3":"Only recognizes the deprecated :first-letter pseudo-class, not the ::first-letter pseudo-element.",
    "4":"Only matches the very first character. The spec says that surrounding punctuation should also match."
  },
  "usage_perc_y":97.08,
  "usage_perc_a":0.87,
  "ucprefix":false,
  "parent":"",
  "keywords":"first,letter,pseudo,element,class,selector",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],76:[function(require,module,exports){
module.exports={
  "title":"CSS position:fixed",
  "description":"Method of keeping an element in a fixed location regardless of scroll position",
  "spec":"http://www.w3.org/TR/CSS21/visuren.html#fixed-positioning",
  "status":"rec",
  "links":[
    {
      "url":"http://www.css-101.org/fixed-positioning/05.php",
      "title":"Workaround for IE6"
    },
    {
      "url":"http://bradfrostweb.com/blog/mobile/fixed-position/",
      "title":"Article on mobile support"
    },
    {
      "url":"http://docs.webplatform.org/wiki/css/properties/position",
      "title":"WebPlatform Docs"
    }
  ],
  "bugs":[
    {
      "description":"in iOS Safari 5-7, position:fixed will move to center of window with focus event on child text input field."
    },
    {
      "description":"In Android 4.0-4.3 `position:fixed` inside an iframe will cause unexpected behviour."
    }
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"p",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"y",
      "3":"y",
      "3.5":"y",
      "3.6":"y",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"y",
      "3.2":"y",
      "4":"y",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"y",
      "9.5-9.6":"y",
      "10.0-10.1":"y",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"a #1",
      "6.0-6.1":"a #1",
      "7.0-7.1":"a #1",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"a #2",
      "2.2":"a #2",
      "2.3":"a #2",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Partial support in older iOS Safari refers to [buggy behavior](http://remysharp.com/2012/05/24/issues-with-position-fixed-scrolling-on-ios/).",
    "2":"Only works in Android 2.1 thru 2.3 by using the following meta tag: <meta name=\"viewport\" content=\"width=device-width, user-scalable=no\">."
  },
  "usage_perc_y":93.06,
  "usage_perc_a":0.25,
  "ucprefix":false,
  "parent":"",
  "keywords":"",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],77:[function(require,module,exports){
module.exports={
  "title":":focus-within CSS pseudo-class",
  "description":"The `:focus-within` pseudo-class matches elements that either themselves match `:focus` or that have descendants which match `:focus`.",
  "spec":"https://drafts.csswg.org/selectors-4/#the-focus-within-pseudo",
  "status":"unoff",
  "links":[
    {
      "url":"https://www.sitepoint.com/future-generation-css-selectors-level-4/#generalized-input-focus-pseudo-class-focus-within",
      "title":"The Future Generation of CSS Selectors: Level 4: Generalized Input Focus Pseudo-class"
    },
    {
      "url":"http://allyjs.io/api/style/focus-within.html",
      "title":"ally.style.focusWithin Polyfill, part of ally.js"
    },
    {
      "url":"https://wpdev.uservoice.com/forums/257854-microsoft-edge-developer/suggestions/11725071-implement-focus-within-from-selectors-4",
      "title":"Microsoft Edge feature request on UserVoice"
    },
    {
      "url":"https://bugs.webkit.org/show_bug.cgi?id=140144",
      "title":"WebKit bug #140144: Add support for CSS4 `:focus-within` pseudo"
    },
    {
      "url":"https://bugs.chromium.org/p/chromium/issues/detail?id=617371",
      "title":"Chromium issue #617371: Implement `:focus-within` pseudo-class from Selectors Level 4"
    },
    {
      "url":"https://bugzilla.mozilla.org/show_bug.cgi?id=1176997",
      "title":"Mozilla bug #1176997: Add support for pseudo class `:focus-within`"
    },
    {
      "url":"http://jsbin.com/qevoqa/edit?html,css,output",
      "title":"JS Bin testcase"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"n"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n",
      "51":"n",
      "52":"n",
      "53":"n",
      "54":"n"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":0,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"focus,within,focus-within,pseudo",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],78:[function(require,module,exports){
module.exports={
  "title":"CSS font-stretch",
  "description":"If a font has multiple types of variations based on the width of characters, the `font-stretch` property allows the appropriate one to be selected. The property in itself does not cause the browser to stretch to a font.",
  "spec":"http://www.w3.org/TR/css-fonts-3/#font-stretch-prop",
  "status":"cr",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/font-stretch",
      "title":"MDN article"
    },
    {
      "url":"http://css-tricks.com/almanac/properties/f/font-stretch/",
      "title":"CSS Tricks article"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n",
      "TP":"n"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":63.58,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"font stretch",
  "ie_id":"cssfontstretch",
  "chrome_id":"4598830058176512",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],79:[function(require,module,exports){
module.exports={
  "title":"CSS Generated content for pseudo-elements",
  "description":"Method of displaying text or images before or after the given element's contents using the ::before and ::after pseudo-elements. All browsers with support also support the `attr()` notation in the `content` property. ",
  "spec":"http://www.w3.org/TR/CSS21/generate.html",
  "status":"rec",
  "links":[
    {
      "url":"http://www.westciv.com/style_master/academy/css_tutorial/advanced/generated_content.html",
      "title":"Guide on usage"
    },
    {
      "url":"https://dev.opera.com/articles/view/css-generated-content-techniques/",
      "title":"Dev.Opera article"
    },
    {
      "url":"http://docs.webplatform.org/wiki/css/generated_and_replaced_content",
      "title":"WebPlatform Docs"
    }
  ],
  "bugs":[
    {
      "description":"Chrome supports CSS transitions on generated content as of v. 26. Safari v6 and below do not support transitions or animations on pseudo elements."
    },
    {
      "description":"IE9, IE10, IE11 ignore CSS rem units in the line-height property. [Bug report](https://connect.microsoft.com/IE/feedback/details/776744/css3-using-rem-to-set-line-height-in-before-after-pseudo-elements-doesnt-work)."
    },
    {
      "description":"Firefox does not support `:after` and `:before` for input fields"
    }
  ],
  "categories":[
    "CSS2",
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"a #1",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"y",
      "3":"y",
      "3.5":"y",
      "3.6":"y",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"y",
      "3.2":"y",
      "4":"y",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"y",
      "9.5-9.6":"y",
      "10.0-10.1":"y",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"y",
      "4.0-4.1":"y",
      "4.2-4.3":"y",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"y"
    },
    "android":{
      "2.1":"y",
      "2.2":"y",
      "2.3":"y",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"For content to appear in pseudo-elements, the `content` property must be set (but may be an empty string).",
  "notes_by_num":{
    "1":"IE8 only supports the single-colon CSS 2.1 syntax (i.e. :pseudo-class). It does not support the double-colon CSS3 syntax (i.e. ::pseudo-element)."
  },
  "usage_perc_y":97.33,
  "usage_perc_a":0.63,
  "ucprefix":false,
  "parent":"",
  "keywords":"before,after",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],80:[function(require,module,exports){
module.exports={
  "title":"CSS Gradients",
  "description":"Method of defining a linear or radial color gradient as a CSS image.",
  "spec":"http://www.w3.org/TR/css3-images/",
  "status":"cr",
  "links":[
    {
      "url":"http://www.colorzilla.com/gradient-editor/",
      "title":"Cross-browser editor"
    },
    {
      "url":"http://www.css3files.com/gradient/",
      "title":"Information page"
    },
    {
      "url":"http://css3pie.com/",
      "title":"Tool to emulate support in IE"
    },
    {
      "url":"http://docs.webplatform.org/wiki/css/functions/linear-gradient",
      "title":"WebPlatform Docs"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"y x",
      "4":"y x",
      "5":"y x",
      "6":"y x",
      "7":"y x",
      "8":"y x",
      "9":"y x",
      "10":"y x",
      "11":"y x",
      "12":"y x",
      "13":"y x",
      "14":"y x",
      "15":"y x",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"a x",
      "5":"a x",
      "6":"a x",
      "7":"a x",
      "8":"a x",
      "9":"a x",
      "10":"y x",
      "11":"y x",
      "12":"y x",
      "13":"y x",
      "14":"y x",
      "15":"y x",
      "16":"y x",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"a x",
      "5":"a x",
      "5.1":"y x",
      "6":"y x",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"a x #1",
      "11.5":"a x #1",
      "11.6":"y x",
      "12":"y x",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"a x",
      "4.0-4.1":"a x",
      "4.2-4.3":"a x",
      "5.0-5.1":"y x",
      "6.0-6.1":"y x",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"a x",
      "2.2":"a x",
      "2.3":"a x",
      "3":"a x",
      "4":"y x",
      "4.1":"y x",
      "4.2-4.3":"y x",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"a x",
      "10":"y"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"a x #1",
      "11.5":"a x #1",
      "12":"y x",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y x"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"Syntax used by browsers with prefixed support may be incompatible with that for proper support.\r\n\r\nSupport can be somewhat emulated in older IE versions using the non-standard \"gradient\" filter. \r\n\r\nFirefox 10+, Opera 11.6+, Chrome 26+ and IE10+ also support the new \"to (side)\" syntax.",
  "notes_by_num":{
    "1":"Partial support in Opera 11.10 and 11.50 also refers to only having support for linear gradients."
  },
  "usage_perc_y":91.87,
  "usage_perc_a":0.2,
  "ucprefix":false,
  "parent":"",
  "keywords":"linear,linear-gradient,gradiant",
  "ie_id":"gradients",
  "chrome_id":"5785905063264256",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],81:[function(require,module,exports){
module.exports={
  "title":"CSS Grid Layout",
  "description":"Method of using a grid concept to lay out content, providing a mechanism for authors to divide available space for lay out into columns and rows using a set of predictable sizing behaviors",
  "spec":"http://www.w3.org/TR/css3-grid-layout/",
  "status":"wd",
  "links":[
    {
      "url":"http://blogs.msdn.com/b/ie/archive/2011/04/14/ie10-platform-preview-and-css-features-for-adaptive-layouts.aspx",
      "title":"IE Blog post"
    },
    {
      "url":"https://bugs.webkit.org/show_bug.cgi?id=60731",
      "title":"Webkit (Chrome, Safari, etc.) feature request"
    },
    {
      "url":"https://bugzilla.mozilla.org/show_bug.cgi?id=616605",
      "title":"Mozilla (Firefox) feature request"
    },
    {
      "url":"https://github.com/codler/Grid-Layout-Polyfill",
      "title":"Polyfill based on old spec"
    },
    {
      "url":"https://github.com/FremyCompany/css-grid-polyfill/",
      "title":"Polyfill based on new spec"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"p",
      "10":"a x #2",
      "11":"a x #2"
    },
    "edge":{
      "12":"a x #2",
      "13":"a x #2",
      "14":"a x #2"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"p",
      "20":"p",
      "21":"p",
      "22":"p",
      "23":"p",
      "24":"p",
      "25":"p",
      "26":"p",
      "27":"p",
      "28":"p",
      "29":"p",
      "30":"p",
      "31":"p",
      "32":"p",
      "33":"p",
      "34":"p",
      "35":"p",
      "36":"p",
      "37":"p",
      "38":"p",
      "39":"p",
      "40":"p d #3",
      "41":"p d #3",
      "42":"p d #3",
      "43":"p d #3",
      "44":"p d #3",
      "45":"p d #3",
      "46":"p d #3",
      "47":"p d #3",
      "48":"p d #3",
      "49":"p d #3",
      "50":"p d #3"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"p",
      "26":"p",
      "27":"p",
      "28":"p",
      "29":"p d #1",
      "30":"p d #1",
      "31":"p d #1",
      "32":"p d #1",
      "33":"p d #1",
      "34":"p d #1",
      "35":"p d #1",
      "36":"p d #1",
      "37":"p d #1",
      "38":"p d #1",
      "39":"p d #1",
      "40":"p d #1",
      "41":"p d #1",
      "42":"p d #1",
      "43":"p d #1",
      "44":"p d #1",
      "45":"p d #1",
      "46":"p d #1",
      "47":"p d #1",
      "48":"p d #1",
      "49":"p d #1",
      "50":"p d #1",
      "51":"p d #1",
      "52":"p d #1",
      "53":"p d #1",
      "54":"p d #1"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"p",
      "6.1":"p",
      "7":"p",
      "7.1":"p",
      "8":"p",
      "9":"p",
      "9.1":"p",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"p d #1",
      "29":"p d #1",
      "30":"p d #1",
      "31":"p d #1",
      "32":"p d #1",
      "33":"p d #1",
      "34":"p d #1",
      "35":"p d #1",
      "36":"p d #1",
      "37":"p d #1",
      "38":"p d #1",
      "39":"p d #1",
      "40":"p d #1"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"p",
      "7.0-7.1":"p",
      "8":"p",
      "8.1-8.4":"p",
      "9.0-9.2":"p",
      "9.3":"p"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"p",
      "4.4":"p",
      "4.4.3-4.4.4":"p",
      "50":"p"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"p"
    },
    "and_chr":{
      "50":"p"
    },
    "and_ff":{
      "46":"p"
    },
    "ie_mob":{
      "10":"a x #2",
      "11":"a x #2"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"p"
    }
  },
  "notes":"Supported in WebKit Nightly with `-webkit-` prefix.\r\n\r\nEnabled by default in Firefox nightly and developer editions, but not yet on track to be enabled in beta or stable Firefox.",
  "notes_by_num":{
    "1":"Enabled in Chrome through the \"experimental Web Platform features\" flag in chrome://flags",
    "2":"Partial support in IE refers to supporting an [older version](http://www.w3.org/TR/2011/WD-css3-grid-layout-20110407/) of the specification.",
    "3":"Enabled in Firefox through the `layout.css.grid.enabled ` flag"
  },
  "usage_perc_y":0,
  "usage_perc_a":7.52,
  "ucprefix":false,
  "parent":"",
  "keywords":"grids,grid-row,grid-column,display:grid",
  "ie_id":"grid",
  "chrome_id":"4589636412243968",
  "firefox_id":"grid-layout",
  "webkit_id":"specification-css-grid-layout-level-1",
  "shown":true
}

},{}],82:[function(require,module,exports){
module.exports={
  "title":":has() CSS relational pseudo-class",
  "description":"Only select elements containing specified content. For example, `a:has(>img)` selects all `<a>` elements that contain an `<img>` child.",
  "spec":"https://drafts.csswg.org/selectors-4/#relational",
  "status":"unoff",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/:has",
      "title":":has() on MDN"
    },
    {
      "url":"https://bugzilla.mozilla.org/show_bug.cgi?id=418039",
      "title":"Firefox support bug"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"n"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n",
      "51":"n",
      "52":"n",
      "53":"n",
      "54":"n"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n",
      "TP":"n"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":0,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"children,parent,selector",
  "ie_id":"cssrelationalpseudoclasshas",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],83:[function(require,module,exports){
module.exports={
  "title":"CSS Hyphenation",
  "description":"Method of controlling when words at the end of lines should be hyphenated using the \"hyphens\" property.",
  "spec":"http://www.w3.org/TR/css3-text/#hyphenation",
  "status":"wd",
  "links":[
    {
      "url":"https://developer.mozilla.org/en/CSS/hyphens",
      "title":"MDN article"
    },
    {
      "url":"http://blog.fontdeck.com/post/9037028497/hyphens",
      "title":"Blog post"
    },
    {
      "url":"http://docs.webplatform.org/wiki/css/properties/hyphens",
      "title":"WebPlatform Docs"
    },
    {
      "url":"https://crbug.com/605840",
      "title":"Chrome bug for implementing hyphenation"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"y x",
      "11":"y x"
    },
    "edge":{
      "12":"y x",
      "13":"y x",
      "14":"y x"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"y x",
      "7":"y x",
      "8":"y x",
      "9":"y x",
      "10":"y x",
      "11":"y x",
      "12":"y x",
      "13":"y x",
      "14":"y x",
      "15":"y x",
      "16":"y x",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y x",
      "27":"y x",
      "28":"y x",
      "29":"y x",
      "30":"y x",
      "31":"y x",
      "32":"y x",
      "33":"y x",
      "34":"y x",
      "35":"y x",
      "36":"y x",
      "37":"y x",
      "38":"y x",
      "39":"y x",
      "40":"y x",
      "41":"y x",
      "42":"y x",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n",
      "51":"n",
      "52":"n",
      "53":"n",
      "54":"n"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"y x",
      "6":"y x",
      "6.1":"y x",
      "7":"y x",
      "7.1":"y x",
      "8":"y x",
      "9":"y x",
      "9.1":"y x",
      "10":"y x",
      "TP":"y x"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"y x",
      "5.0-5.1":"y x",
      "6.0-6.1":"y x",
      "7.0-7.1":"y x",
      "8":"y x",
      "8.1-8.4":"y x",
      "9.0-9.2":"y x",
      "9.3":"y x"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"a x"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"Chrome and Android 4.0 Browser support \"-webkit-hyphens: none\", but not the \"auto\" property. It is [advisable to set the @lang attribute](http://blog.adrianroselli.com/2015/01/on-use-of-lang-attribute.html) on the HTML element to enable hyphenation support and improve accessibility.",
  "notes_by_num":{
    
  },
  "usage_perc_y":26.16,
  "usage_perc_a":6.65,
  "ucprefix":false,
  "parent":"",
  "keywords":"hyphen,shy",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],84:[function(require,module,exports){
module.exports={
  "title":"CSS3 image-orientation",
  "description":"CSS property used generally to fix the intended orientation of an image. This can be done using 90 degree increments or based on the image's EXIF data using the \"from-image\" value.",
  "spec":"http://www.w3.org/TR/css3-images/#image-orientation",
  "status":"cr",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/image-orientation",
      "title":"MDN article"
    },
    {
      "url":"http://sethfowler.org/blog/2013/09/13/new-in-firefox-26-css-image-orientation/",
      "title":"Blog post"
    },
    {
      "url":"http://jsbin.com/EXUTolo/4",
      "title":"Demo (Chinese)"
    }
  ],
  "bugs":[
    {
      "description":"Negative values do not work in Firefox."
    }
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n",
      "51":"n",
      "52":"n",
      "53":"n",
      "54":"n"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n",
      "TP":"n"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n"
    },
    "ios_saf":{
      "3.2":"a #1",
      "4.0-4.1":"a #1",
      "4.2-4.3":"a #1",
      "5.0-5.1":"a #1",
      "6.0-6.1":"a #1",
      "7.0-7.1":"a #1",
      "8":"a #1",
      "8.1-8.4":"a #1",
      "9.0-9.2":"a #1",
      "9.3":"a #1"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"Opening the image in a new tab in Chrome results in the image shown in the orientation according to the EXIF data.",
  "notes_by_num":{
    "1":"Partial support in iOS refers to the browser using EXIF data by default, though it does not actually support the property."
  },
  "usage_perc_y":7.76,
  "usage_perc_a":8.85,
  "ucprefix":false,
  "parent":"",
  "keywords":"image-orientation,from-image,flip",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],85:[function(require,module,exports){
module.exports={
  "title":"CSS image-set",
  "description":"Method of letting the browser pick the most appropriate CSS background image from a given set, primarily for high PPI screens.",
  "spec":"http://dev.w3.org/csswg/css-images-3/#image-set-notation",
  "status":"unoff",
  "links":[
    {
      "url":"http://cloudfour.com/examples/image-set/",
      "title":"Demo"
    },
    {
      "url":"https://wpdev.uservoice.com/forums/257854-microsoft-edge-developer/suggestions/6606738-image-set",
      "title":"Microsoft Edge feature request on UserVoice"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y x",
      "27":"y x",
      "28":"y x",
      "29":"y x",
      "30":"y x",
      "31":"y x",
      "32":"y x",
      "33":"y x",
      "34":"y x",
      "35":"y x",
      "36":"y x",
      "37":"y x",
      "38":"y x",
      "39":"y x",
      "40":"y x",
      "41":"y x",
      "42":"y x",
      "43":"y x",
      "44":"y x",
      "45":"y x",
      "46":"y x",
      "47":"y x",
      "48":"y x",
      "49":"y x",
      "50":"y x",
      "51":"y x",
      "52":"y x",
      "53":"y x",
      "54":"y x"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"y x",
      "6.1":"y x",
      "7":"y x",
      "7.1":"y x",
      "8":"y x",
      "9":"y x",
      "9.1":"y x",
      "10":"y x",
      "TP":"y x"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"y x",
      "16":"y x",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y x",
      "27":"y x",
      "28":"y x",
      "29":"y x",
      "30":"y x",
      "31":"y x",
      "32":"y x",
      "33":"y x",
      "34":"y x",
      "35":"y x",
      "36":"y x",
      "37":"y x",
      "38":"y x",
      "39":"y x",
      "40":"y x"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"y x",
      "7.0-7.1":"y x",
      "8":"y x",
      "8.1-8.4":"y x",
      "9.0-9.2":"y x",
      "9.3":"y x"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"y x",
      "4.4.3-4.4.4":"y x",
      "50":"y x"
    },
    "bb":{
      "7":"n",
      "10":"y x"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y x"
    },
    "and_chr":{
      "50":"y x"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"y x"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":68.09,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"",
  "ie_id":"cssimageset",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],86:[function(require,module,exports){
module.exports={
  "title":":in-range and :out-of-range CSS pseudo-classes",
  "description":"If a temporal or number `<input>` has `max` and/or `min` attributes, then `:in-range` matches when the value is within the specified range and `:out-of-range` matches when the value is outside the specified range. If there are no range constraints, then neither pseudo-class matches.",
  "spec":"http://www.w3.org/TR/selectors4/#range-pseudos",
  "status":"wd",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/:out-of-range",
      "title":"MDN article"
    },
    {
      "url":"https://html.spec.whatwg.org/multipage/scripting.html#selector-in-range",
      "title":"WHATWG HTML specification for `:in-range` and `:out-of-range`"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"a #2",
      "14":"a #2"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"a #3",
      "30":"a #3",
      "31":"a #3",
      "32":"a #3",
      "33":"a #3",
      "34":"a #3",
      "35":"a #3",
      "36":"a #3",
      "37":"a #3",
      "38":"a #3",
      "39":"a #3",
      "40":"a #3",
      "41":"a #3",
      "42":"a #3",
      "43":"a #3",
      "44":"a #3",
      "45":"a #3",
      "46":"a #3",
      "47":"a #3",
      "48":"a #3",
      "49":"a #3",
      "50":"a #3"
    },
    "chrome":{
      "4":"n",
      "5":"u",
      "6":"u",
      "7":"u",
      "8":"u",
      "9":"u",
      "10":"u",
      "11":"u",
      "12":"u",
      "13":"u",
      "14":"u",
      "15":"a #2 #3",
      "16":"a #2 #3",
      "17":"a #2 #3",
      "18":"a #2 #3",
      "19":"a #2 #3",
      "20":"a #2 #3",
      "21":"a #2 #3",
      "22":"a #2 #3",
      "23":"a #2 #3",
      "24":"a #2 #3",
      "25":"a #2 #3",
      "26":"a #2 #3",
      "27":"a #2 #3",
      "28":"a #2 #3",
      "29":"a #2 #3",
      "30":"a #2 #3",
      "31":"a #2 #3",
      "32":"a #2 #3",
      "33":"a #2 #3",
      "34":"a #2 #3",
      "35":"a #2 #3",
      "36":"a #2 #3",
      "37":"a #2 #3",
      "38":"a #2 #3",
      "39":"a #2 #3",
      "40":"a #2 #3",
      "41":"a #2 #3",
      "42":"a #2 #3",
      "43":"a #2 #3",
      "44":"a #2 #3",
      "45":"a #2 #3",
      "46":"a #2 #3",
      "47":"a #2 #3",
      "48":"a #2 #3",
      "49":"a #2 #3",
      "50":"a #2 #3",
      "51":"a #2 #3",
      "52":"a #2",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"u",
      "5.1":"a #2 #3",
      "6":"a #2 #3",
      "6.1":"a #2 #3",
      "7":"a #2 #3",
      "7.1":"a #2 #3",
      "8":"a #2 #3",
      "9":"a #2 #3",
      "9.1":"a #2 #3",
      "10":"a #2 #3",
      "TP":"y"
    },
    "opera":{
      "9":"u",
      "9.5-9.6":"u",
      "10.0-10.1":"a #2",
      "10.5":"a #2",
      "10.6":"a #2",
      "11":"a #2",
      "11.1":"a #2",
      "11.5":"a #2",
      "11.6":"a #2",
      "12":"a #2",
      "12.1":"a #2",
      "15":"a #2 #3",
      "16":"a #2 #3",
      "17":"a #2 #3",
      "18":"a #2 #3",
      "19":"a #2 #3",
      "20":"a #2 #3",
      "21":"a #2 #3",
      "22":"a #2 #3",
      "23":"a #2 #3",
      "24":"a #2 #3",
      "25":"a #2 #3",
      "26":"a #2 #3",
      "27":"a #2 #3",
      "28":"a #2 #3",
      "29":"a #2 #3",
      "30":"a #2 #3",
      "31":"a #2 #3",
      "32":"a #2 #3",
      "33":"a #2 #3",
      "34":"a #2 #3",
      "35":"a #2 #3",
      "36":"a #2 #3",
      "37":"a #2 #3",
      "38":"a #2 #3",
      "39":"a #2",
      "40":"a #2"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"a #2 #3",
      "6.0-6.1":"a #2 #3",
      "7.0-7.1":"a #2 #3",
      "8":"a #2 #3",
      "8.1-8.4":"a #2 #3",
      "9.0-9.2":"a #2 #3",
      "9.3":"a #2 #3"
    },
    "op_mini":{
      "all":"a #1"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"a #2",
      "4.1":"a #2",
      "4.2-4.3":"a #2",
      "4.4":"a #2",
      "4.4.3-4.4.4":"a #2",
      "50":"a #2"
    },
    "bb":{
      "7":"n",
      "10":"a #2"
    },
    "op_mob":{
      "10":"a #2",
      "11":"a #2",
      "11.1":"a #2",
      "11.5":"a #2",
      "12":"a #2",
      "12.1":"a #2",
      "37":"a #2"
    },
    "and_chr":{
      "50":"a #2"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"a #2"
    },
    "samsung":{
      "4":"a #2"
    }
  },
  "notes":"Note that `<input type=\"range\">` can never match `:out-of-range` because the user cannot input such a value, and if the initial value is outside the range, the browser immediately clamps it to the minimum or maximum (as appropriate) bound of the range.",
  "notes_by_num":{
    "1":"Opera Mini correctly applies style on initial load, but does not correctly update when value is changed.",
    "2":"`:in-range` also incorrectly matches temporal and `number` inputs which don't have `min` or `max` attributes. See [Edge bug](https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/7200501/), [Chrome bug](https://bugs.chromium.org/p/chromium/issues/detail?id=603268), [WebKit bug](https://bugs.webkit.org/show_bug.cgi?id=156558).",
    "3":"`:in-range` and `:out-of-range` incorrectly match inputs which are disabled or readonly. See [Mozilla bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1264157), [WebKit bug](https://bugs.webkit.org/show_bug.cgi?id=156530), [Chrome bug](https://bugs.chromium.org/p/chromium/issues/detail?id=602568)."
  },
  "usage_perc_y":0.13,
  "usage_perc_a":89.74,
  "ucprefix":false,
  "parent":"",
  "keywords":"in,out,of,range,:in-range,:out-of-range",
  "ie_id":"cssrangepseudoclasses",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],87:[function(require,module,exports){
module.exports={
  "title":":indeterminate CSS pseudo-class",
  "description":"The `:indeterminate` pseudo-class matches indeterminate checkboxes, indeterminate `<progress>` bars, and radio buttons with no checked button in their radio button group.",
  "spec":"https://drafts.csswg.org/selectors-4/#indeterminate",
  "status":"unoff",
  "links":[
    {
      "url":"https://html.spec.whatwg.org/multipage/scripting.html#selector-indeterminate",
      "title":"HTML specification for `:indeterminate`"
    },
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/:indeterminate",
      "title":"Mozilla Developer Network article"
    },
    {
      "url":"https://developer.microsoft.com/en-us/microsoft-edge/platform/issues/7124038/",
      "title":"EdgeHTML issue 7124038 - `:indeterminate` pseudo-class doesn't match radio buttons"
    },
    {
      "url":"https://bugzilla.mozilla.org/show_bug.cgi?id=885359",
      "title":"Mozilla Bug 885359 - Radio groups without a selected radio button should have `:indeterminate` applying"
    },
    {
      "url":"https://bugs.webkit.org/show_bug.cgi?id=156270",
      "title":"WebKit Bug 156270 - `:indeterminate` pseudo-class should match radios whose group has no checked radio"
    },
    {
      "url":"http://jsbin.com/zumoqu/edit?html,css,js,output",
      "title":"JS Bin testcase"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"a #1 #2",
      "10":"a #1",
      "11":"a #1"
    },
    "edge":{
      "12":"a #1",
      "13":"a #1",
      "14":"a #1"
    },
    "firefox":{
      "2":"u",
      "3":"u",
      "3.5":"u",
      "3.6":"u",
      "4":"a #1 #2",
      "5":"a #1 #2",
      "6":"a #1",
      "7":"a #1",
      "8":"a #1",
      "9":"a #1",
      "10":"a #1",
      "11":"a #1",
      "12":"a #1",
      "13":"a #1",
      "14":"a #1",
      "15":"a #1",
      "16":"a #1",
      "17":"a #1",
      "18":"a #1",
      "19":"a #1",
      "20":"a #1",
      "21":"a #1",
      "22":"a #1",
      "23":"a #1",
      "24":"a #1",
      "25":"a #1",
      "26":"a #1",
      "27":"a #1",
      "28":"a #1",
      "29":"a #1",
      "30":"a #1",
      "31":"a #1",
      "32":"a #1",
      "33":"a #1",
      "34":"a #1",
      "35":"a #1",
      "36":"a #1",
      "37":"a #1",
      "38":"a #1",
      "39":"a #1",
      "40":"a #1",
      "41":"a #1",
      "42":"a #1",
      "43":"a #1",
      "44":"a #1",
      "45":"a #1",
      "46":"a #1",
      "47":"a #1",
      "48":"u",
      "49":"u",
      "50":"u"
    },
    "chrome":{
      "4":"u",
      "5":"u",
      "6":"u",
      "7":"u",
      "8":"u",
      "9":"u",
      "10":"u",
      "11":"u",
      "12":"u",
      "13":"u",
      "14":"u",
      "15":"a #1",
      "16":"a #1",
      "17":"a #1",
      "18":"a #1",
      "19":"a #1",
      "20":"a #1",
      "21":"a #1",
      "22":"a #1",
      "23":"a #1",
      "24":"a #1",
      "25":"a #1",
      "26":"a #1",
      "27":"a #1",
      "28":"a #1",
      "29":"a #1",
      "30":"a #1",
      "31":"a #1",
      "32":"a #1",
      "33":"a #1",
      "34":"a #1",
      "35":"a #1",
      "36":"a #1",
      "37":"a #1",
      "38":"a #1",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"u",
      "3.2":"u",
      "4":"u",
      "5":"u",
      "5.1":"a #1 #2",
      "6":"u",
      "6.1":"a #1",
      "7":"a #1",
      "7.1":"a #1",
      "8":"a #1",
      "9":"a #1",
      "9.1":"a #1",
      "10":"a #1",
      "TP":"y"
    },
    "opera":{
      "9":"u",
      "9.5-9.6":"u",
      "10.0-10.1":"u",
      "10.5":"u",
      "10.6":"u",
      "11":"u",
      "11.1":"u",
      "11.5":"u",
      "11.6":"a #3",
      "12":"a #3",
      "12.1":"a #3",
      "15":"a #1",
      "16":"a #1",
      "17":"a #1",
      "18":"a #1",
      "19":"a #1",
      "20":"a #1",
      "21":"a #1",
      "22":"a #1",
      "23":"a #1",
      "24":"a #1",
      "25":"a #1",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"u",
      "4.0-4.1":"u",
      "4.2-4.3":"u",
      "5.0-5.1":"u",
      "6.0-6.1":"u",
      "7.0-7.1":"a #1",
      "8":"a #1",
      "8.1-8.4":"a #1",
      "9.0-9.2":"a #1",
      "9.3":"a #1"
    },
    "op_mini":{
      "all":"a #3"
    },
    "android":{
      "2.1":"u",
      "2.2":"u",
      "2.3":"u",
      "3":"u",
      "4":"a #1 #2",
      "4.1":"a #1 #2",
      "4.2-4.3":"a #1 #2",
      "4.4":"a #1",
      "4.4.3-4.4.4":"u",
      "50":"y"
    },
    "bb":{
      "7":"u",
      "10":"a #1"
    },
    "op_mob":{
      "10":"u",
      "11":"u",
      "11.1":"u",
      "11.5":"u",
      "12":"u",
      "12.1":"a #3",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"a #1"
    },
    "ie_mob":{
      "10":"a #1",
      "11":"a #1"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Doesn't match radio buttons whose radio button group lacks a checked radio button",
    "2":"Doesn't support the `<progress>` element",
    "3":"Doesn't match indeterminate `<progress>` bars"
  },
  "usage_perc_y":59.06,
  "usage_perc_a":36.7,
  "ucprefix":false,
  "parent":"",
  "keywords":":indeterminate,indeterminate",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],88:[function(require,module,exports){
module.exports={
  "title":"CSS initial value",
  "description":"A CSS value that will apply a property's initial value as defined in the CSS specification that defines the property",
  "spec":"http://www.w3.org/TR/css-values/#common-keywords",
  "status":"cr",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/initial",
      "title":"Mozilla Developer Network"
    },
    {
      "url":"https://css-tricks.com/getting-acquainted-with-initial/",
      "title":"CSS Tricks article"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"u",
      "3.2":"y",
      "4":"y",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"u",
      "4.0-4.1":"y",
      "4.2-4.3":"y",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"u",
      "2.2":"u",
      "2.3":"y",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":85.63,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"CSS,initial,value",
  "ie_id":"cssinitialvalue",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],89:[function(require,module,exports){
module.exports={
  "title":"letter-spacing CSS property",
  "description":"Controls spacing between characters of text (i.e. \"tracking\" in typographical terms). Not to be confused with kerning.",
  "spec":"http://www.w3.org/TR/CSS2/text.html#propdef-letter-spacing",
  "status":"rec",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/letter-spacing",
      "title":"Mozilla Developer Network"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"u",
      "6":"a #1",
      "7":"a #1",
      "8":"a #1",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"y",
      "3":"y",
      "3.5":"y",
      "3.6":"y",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"a #1",
      "5":"a #1",
      "6":"a #1",
      "7":"a #1",
      "8":"a #1",
      "9":"a #1",
      "10":"a #1",
      "11":"a #1",
      "12":"a #1",
      "13":"a #1",
      "14":"a #1",
      "15":"a #1",
      "16":"a #1",
      "17":"a #1",
      "18":"a #1",
      "19":"a #1",
      "20":"a #1",
      "21":"a #1",
      "22":"a #1",
      "23":"a #1",
      "24":"a #1",
      "25":"a #1",
      "26":"a #1",
      "27":"a #1",
      "28":"a #1",
      "29":"a #1",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"u",
      "3.2":"a #1",
      "4":"a #1",
      "5":"a #1",
      "5.1":"a #1",
      "6":"a #1",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"u",
      "9.5-9.6":"u",
      "10.0-10.1":"a #1",
      "10.5":"a #1",
      "10.6":"a #1",
      "11":"a #1",
      "11.1":"a #1",
      "11.5":"a #1",
      "11.6":"a #1",
      "12":"a #1",
      "12.1":"a #1",
      "15":"a #1",
      "16":"a #1",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"u",
      "4.0-4.1":"y",
      "4.2-4.3":"y",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"u",
      "2.2":"u",
      "2.3":"a #1",
      "3":"a #1",
      "4":"a #1",
      "4.1":"a #1",
      "4.2-4.3":"a #1",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"a #1",
      "10":"a #1"
    },
    "op_mob":{
      "10":"a #1",
      "11":"a #1",
      "11.1":"a #1",
      "11.5":"a #1",
      "12":"a #1",
      "12.1":"a #1",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"a #1"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Truncates or rounds fractional portions of values"
  },
  "usage_perc_y":83.05,
  "usage_perc_a":10.27,
  "ucprefix":false,
  "parent":"",
  "keywords":"CSS,letter,spacing,tracking",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],90:[function(require,module,exports){
module.exports={
  "title":"CSS line-clamp",
  "description":"Proprietary and undocumented CSS property that will contain text to a given amount of lines when used in combination with `display: -webkit-box`. It will end with ellipsis when `text-overflow: ellipsis` is included.",
  "spec":"https://developer.apple.com/library/safari/documentation/AppleApplications/Reference/SafariCSSRef/Articles/StandardCSSProperties.html#//apple_ref/doc/uid/TP30001266-WebKit_SpecificUnsupportedProperties",
  "status":"unoff",
  "links":[
    {
      "url":"http://guerillalabs.co/blog/css-line-clamping.html",
      "title":"Article on cross-browser CSS line clamping"
    },
    {
      "url":"https://css-tricks.com/line-clampin/",
      "title":"CSS Tricks article"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n"
    },
    "chrome":{
      "4":"u",
      "5":"u",
      "6":"u",
      "7":"u",
      "8":"u",
      "9":"u",
      "10":"u",
      "11":"u",
      "12":"u",
      "13":"u",
      "14":"y x",
      "15":"y x",
      "16":"y x",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y x",
      "27":"y x",
      "28":"y x",
      "29":"y x",
      "30":"y x",
      "31":"y x",
      "32":"y x",
      "33":"y x",
      "34":"y x",
      "35":"y x",
      "36":"y x",
      "37":"y x",
      "38":"y x",
      "39":"y x",
      "40":"y x",
      "41":"y x",
      "42":"y x",
      "43":"y x",
      "44":"y x",
      "45":"y x",
      "46":"y x",
      "47":"y x",
      "48":"y x",
      "49":"y x",
      "50":"y x",
      "51":"y x",
      "52":"y x",
      "53":"y x",
      "54":"y x"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"y x",
      "5.1":"y x",
      "6":"y x",
      "6.1":"y x",
      "7":"y x",
      "7.1":"y x",
      "8":"y x",
      "9":"y x",
      "9.1":"y x",
      "10":"y x",
      "TP":"y x"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"y x",
      "16":"y x",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y x",
      "27":"y x",
      "28":"y x",
      "29":"y x",
      "30":"y x",
      "31":"y x",
      "32":"y x",
      "33":"y x",
      "34":"y x",
      "35":"y x",
      "36":"y x",
      "37":"y x",
      "38":"y x",
      "39":"y x",
      "40":"y x"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"y x",
      "6.0-6.1":"y x",
      "7.0-7.1":"y x",
      "8":"y x",
      "8.1-8.4":"y x",
      "9.0-9.2":"y x",
      "9.3":"y x"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"u",
      "2.2":"u",
      "2.3":"y x",
      "3":"y x",
      "4":"y x",
      "4.1":"y x",
      "4.2-4.3":"y x",
      "4.4":"y x",
      "4.4.3-4.4.4":"y x",
      "50":"y x"
    },
    "bb":{
      "7":"y x",
      "10":"y x"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y x"
    },
    "and_chr":{
      "50":"y x"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"y x"
    },
    "samsung":{
      "4":"y x"
    }
  },
  "notes":"As there is no specification and the property is dependent on an outdated implementation of flexbox (hence `display: -webkit-box`) it is unlikely that other browsers will support the property as-is, although an alternative solution may at some point replace it.\r\n\r\nOlder (presto-based) versions of the Opera browser have also supported the same effect using the proprietary `-o-ellipsis-lastline;` value for `text-overflow`.",
  "notes_by_num":{
    
  },
  "usage_perc_y":76.07,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],91:[function(require,module,exports){
module.exports={
  "title":"CSS Logical Properties",
  "description":"Use start/end properties that depend on LTR or RTL writing direction instead of left/right",
  "spec":"http://dev.w3.org/csswg/css-logical-props/",
  "status":"unoff",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/-moz-margin-start",
      "title":"MDN -moz-margin-start"
    },
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/-moz-padding-start",
      "title":"MDN -moz-padding-start"
    },
    {
      "url":"https://wpdev.uservoice.com/forums/257854-microsoft-edge-developer/suggestions/7438435-css-logical-properties",
      "title":"Microsoft Edge feature request on UserVoice"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS",
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"a x #1",
      "3.5":"a x #1",
      "3.6":"a x #1",
      "4":"a x #1",
      "5":"a x #1",
      "6":"a x #1",
      "7":"a x #1",
      "8":"a x #1",
      "9":"a x #1",
      "10":"a x #1",
      "11":"a x #1",
      "12":"a x #1",
      "13":"a x #1",
      "14":"a x #1",
      "15":"a x #1",
      "16":"a x #1",
      "17":"a x #1",
      "18":"a x #1",
      "19":"a x #1",
      "20":"a x #1",
      "21":"a x #1",
      "22":"a x #1",
      "23":"a x #1",
      "24":"a x #1",
      "25":"a x #1",
      "26":"a x #1",
      "27":"a x #1",
      "28":"a x #1",
      "29":"a x #1",
      "30":"a x #1",
      "31":"a x #1",
      "32":"a x #1",
      "33":"a x #1",
      "34":"a x #1",
      "35":"a x #1",
      "36":"a x #1",
      "37":"a x #1",
      "38":"a x #1",
      "39":"a x #1",
      "40":"a x #1",
      "41":"a x #1",
      "42":"a x #1",
      "43":"a x #1",
      "44":"a x #1",
      "45":"a x #1",
      "46":"a x #1",
      "47":"a x #1",
      "48":"a x #1",
      "49":"a x #1",
      "50":"a x #1"
    },
    "chrome":{
      "4":"a x #2",
      "5":"a x #2",
      "6":"a x #2",
      "7":"a x #2",
      "8":"a x #2",
      "9":"a x #2",
      "10":"a x #2",
      "11":"a x #2",
      "12":"a x #2",
      "13":"a x #2",
      "14":"a x #2",
      "15":"a x #2",
      "16":"a x #2",
      "17":"a x #2",
      "18":"a x #2",
      "19":"a x #2",
      "20":"a x #2",
      "21":"a x #2",
      "22":"a x #2",
      "23":"a x #2",
      "24":"a x #2",
      "25":"a x #2",
      "26":"a x #2",
      "27":"a x #2",
      "28":"a x #2",
      "29":"a x #2",
      "30":"a x #2",
      "31":"a x #2",
      "32":"a x #2",
      "33":"a x #2",
      "34":"a x #2",
      "35":"a x #2",
      "36":"a x #2",
      "37":"a x #2",
      "38":"a x #2",
      "39":"a x #2",
      "40":"a x #2",
      "41":"a x #2",
      "42":"a x #2",
      "43":"a x #2",
      "44":"a x #2",
      "45":"a x #2",
      "46":"a x #2",
      "47":"a x #2",
      "48":"a x #2",
      "49":"a x #2",
      "50":"a x #2",
      "51":"a x #2",
      "52":"a x #2",
      "53":"a x #2",
      "54":"a x #2"
    },
    "safari":{
      "3.1":"a x #2",
      "3.2":"a x #2",
      "4":"a x #2",
      "5":"a x #2",
      "5.1":"a x #2",
      "6":"a x #2",
      "6.1":"a x #2",
      "7":"a x #2",
      "7.1":"a x #2",
      "8":"a x #2",
      "9":"a x #2",
      "9.1":"a x #2",
      "10":"a x #2",
      "TP":"a x #2"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"a x #2",
      "16":"a x #2",
      "17":"a x #2",
      "18":"a x #2",
      "19":"a x #2",
      "20":"a x #2",
      "21":"a x #2",
      "22":"a x #2",
      "23":"a x #2",
      "24":"a x #2",
      "25":"a x #2",
      "26":"a x #2",
      "27":"a x #2",
      "28":"a x #2",
      "29":"a x #2",
      "30":"a x #2",
      "31":"a x #2",
      "32":"a x #2",
      "33":"a x #2",
      "34":"a x #2",
      "35":"a x #2",
      "36":"a x #2",
      "37":"a x #2",
      "38":"a x #2",
      "39":"a x #2",
      "40":"a x #2"
    },
    "ios_saf":{
      "3.2":"a x #2",
      "4.0-4.1":"a x #2",
      "4.2-4.3":"a x #2",
      "5.0-5.1":"a x #2",
      "6.0-6.1":"a x #2",
      "7.0-7.1":"a x #2",
      "8":"a x #2",
      "8.1-8.4":"a x #2",
      "9.0-9.2":"a x #2",
      "9.3":"a x #2"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"a x #2",
      "2.2":"a x #2",
      "2.3":"a x #2",
      "3":"a x #2",
      "4":"a x #2",
      "4.1":"a x #2",
      "4.2-4.3":"a x #2",
      "4.4":"a x #2",
      "4.4.3-4.4.4":"a x #2",
      "50":"a x #2"
    },
    "bb":{
      "7":"a x #2",
      "10":"a x #2"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"a x #2"
    },
    "and_chr":{
      "50":"a x #2"
    },
    "and_ff":{
      "46":"a x #1"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"a x #2"
    },
    "samsung":{
      "4":"a x #2"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Only supports the *-start, and *-end values for `margin`, `border` and `padding`, not the inline/block type values as defined in the spec.",
    "2":"Like #1 but also supports `*-before` and `*-end` for `*-block-start` and `*-block-end` properties as well as `start` and `end` values for `text-align`"
  },
  "usage_perc_y":0,
  "usage_perc_a":84.47,
  "ucprefix":false,
  "parent":"",
  "keywords":"margin-start,margin-end,padding-start,padding-end,border-start,border-end,inline-start,inline-end,block-start,block-end",
  "ie_id":"csslogicalpropertieslevel1",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],92:[function(require,module,exports){
module.exports={
  "title":"CSS Masks",
  "description":"Method of displaying part of an element, using a selected image as a mask",
  "spec":"http://www.w3.org/TR/css-masking-1/",
  "status":"cr",
  "links":[
    {
      "url":"http://docs.webplatform.org/wiki/css/properties/mask",
      "title":"WebPlatform Docs"
    },
    {
      "url":"http://www.html5rocks.com/en/tutorials/masking/adobe/",
      "title":"HTML5 Rocks article"
    },
    {
      "url":"http://thenittygritty.co/css-masking",
      "title":"Detailed blog post"
    },
    {
      "url":"https://bugzilla.mozilla.org/show_bug.cgi?id=1224422",
      "title":"Firefox implementation bug"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"a #2",
      "3.6":"a #2",
      "4":"a #2",
      "5":"a #2",
      "6":"a #2",
      "7":"a #2",
      "8":"a #2",
      "9":"a #2",
      "10":"a #2",
      "11":"a #2",
      "12":"a #2",
      "13":"a #2",
      "14":"a #2",
      "15":"a #2",
      "16":"a #2",
      "17":"a #2",
      "18":"a #2",
      "19":"a #2",
      "20":"a #2",
      "21":"a #2",
      "22":"a #2",
      "23":"a #2",
      "24":"a #2",
      "25":"a #2",
      "26":"a #2",
      "27":"a #2",
      "28":"a #2",
      "29":"a #2",
      "30":"a #2",
      "31":"a #2",
      "32":"a #2",
      "33":"a #2",
      "34":"a #2",
      "35":"a #2",
      "36":"a #2",
      "37":"a #2",
      "38":"a #2",
      "39":"a #2",
      "40":"a #2",
      "41":"a #2",
      "42":"a #2",
      "43":"a #2",
      "44":"a #2",
      "45":"a #2",
      "46":"a #2",
      "47":"a #2",
      "48":"a #2",
      "49":"a #2",
      "50":"a #2"
    },
    "chrome":{
      "4":"a x #1",
      "5":"a x #1",
      "6":"a x #1",
      "7":"a x #1",
      "8":"a x #1",
      "9":"a x #1",
      "10":"a x #1",
      "11":"a x #1",
      "12":"a x #1",
      "13":"a x #1",
      "14":"a x #1",
      "15":"a x #1",
      "16":"a x #1",
      "17":"a x #1",
      "18":"a x #1",
      "19":"a x #1",
      "20":"a x #1",
      "21":"a x #1",
      "22":"a x #1",
      "23":"a x #1",
      "24":"a x #1",
      "25":"a x #1",
      "26":"a x #1",
      "27":"a x #1",
      "28":"a x #1",
      "29":"a x #1",
      "30":"a x #1",
      "31":"a x #1",
      "32":"a x #1",
      "33":"a x #1",
      "34":"a x #1",
      "35":"a x #1",
      "36":"a x #1",
      "37":"a x #1",
      "38":"a x #1",
      "39":"a x #1",
      "40":"a x #1",
      "41":"a x #1",
      "42":"a x #1",
      "43":"a x #1",
      "44":"a x #1",
      "45":"a x #1",
      "46":"a x #1",
      "47":"a x #1",
      "48":"a x #1",
      "49":"a x #1",
      "50":"a x #1",
      "51":"a x #1",
      "52":"a x #1",
      "53":"a x #1",
      "54":"a x #1"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"a x #1",
      "5":"a x #1",
      "5.1":"a x #1",
      "6":"a x #1",
      "6.1":"a x #1",
      "7":"a x #1",
      "7.1":"a x #1",
      "8":"a x #1",
      "9":"a x #1",
      "9.1":"a x #1",
      "10":"a x #1",
      "TP":"a x #1"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"a x #1",
      "16":"a x #1",
      "17":"a x #1",
      "18":"a x #1",
      "19":"a x #1",
      "20":"a x #1",
      "21":"a x #1",
      "22":"a x #1",
      "23":"a x #1",
      "24":"a x #1",
      "25":"a x #1",
      "26":"a x #1",
      "27":"a x #1",
      "28":"a x #1",
      "29":"a x #1",
      "30":"a x #1",
      "31":"a x #1",
      "32":"a x #1",
      "33":"a x #1",
      "34":"a x #1",
      "35":"a x #1",
      "36":"a x #1",
      "37":"a x #1",
      "38":"a x #1",
      "39":"a x #1",
      "40":"a x #1"
    },
    "ios_saf":{
      "3.2":"a x #1",
      "4.0-4.1":"a x #1",
      "4.2-4.3":"a x #1",
      "5.0-5.1":"a x #1",
      "6.0-6.1":"a x #1",
      "7.0-7.1":"a x #1",
      "8":"a x #1",
      "8.1-8.4":"a x #1",
      "9.0-9.2":"a x #1",
      "9.3":"a x #1"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"a x #1",
      "2.2":"a x #1",
      "2.3":"a x #1",
      "3":"a x #1",
      "4":"a x #1",
      "4.1":"a x #1",
      "4.2-4.3":"a x #1",
      "4.4":"a x #1",
      "4.4.3-4.4.4":"a x #1",
      "50":"a x #1"
    },
    "bb":{
      "7":"a x #1",
      "10":"a x #1"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"a x #1"
    },
    "and_chr":{
      "50":"a x #1"
    },
    "and_ff":{
      "46":"a #2"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"a x #1"
    },
    "samsung":{
      "4":"a x #1"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Partial support in WebKit/Blink browsers refers to supporting the mask-image and mask-box-image properties, but lacking support for other parts of the spec.",
    "2":"Partial support in Firefox refers to only support for inline SVG mask elements i.e. mask: url(#foo)."
  },
  "usage_perc_y":0,
  "usage_perc_a":84.41,
  "ucprefix":false,
  "parent":"",
  "keywords":"clip,clip-path,clip-rule,mask,mask-border,mask-clip,mask-image,mask-mode,mask-type",
  "ie_id":"masks",
  "chrome_id":"5381559662149632",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],93:[function(require,module,exports){
module.exports={
  "title":":matches() CSS pseudo-class",
  "description":"The `:matches()` (formerly `:any()`) pseudo-class checks whether the element at its position in the outer selector matches any of the selectors in its selector list. It's useful syntactic sugar that allows you to avoid writing out all the combinations manually as separate selectors. The effect is similar to nesting in Sass and most other CSS preprocessors.",
  "spec":"https://www.w3.org/TR/selectors4/#matches",
  "status":"wd",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/:any",
      "title":"Mozilla Developer Network article"
    },
    {
      "url":"https://webkit.org/blog/3615/css-selectors-inside-selectors-discover-matches-not-and-nth-child/",
      "title":"WebKit blog post about adding `:matches()` and other Selectors Level 4 features"
    },
    {
      "url":"https://bugzilla.mozilla.org/show_bug.cgi?id=906353",
      "title":"Mozilla Bug 906353 - Add support for css4 selector :matches(), the standard of :-moz-any()"
    },
    {
      "url":"https://wpdev.uservoice.com/forums/257854-microsoft-edge-developer/suggestions/9361350--matches",
      "title":"Microsoft Edge UserVoice feature request for :matches()"
    },
    {
      "url":"http://output.jsbin.com/lehina",
      "title":"JS Bin testcase"
    },
    {
      "url":"https://bugs.chromium.org/p/chromium/issues/detail?id=568705",
      "title":"Issue 568705: Chrome does not support :matches() selector"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"u",
      "3":"u",
      "3.5":"u",
      "3.6":"u",
      "4":"a x #3",
      "5":"a x #3",
      "6":"a x #3",
      "7":"a x #3",
      "8":"a x #3",
      "9":"a x #3",
      "10":"a x #3",
      "11":"a x #3",
      "12":"a x #3",
      "13":"a x #3",
      "14":"a x #3",
      "15":"a x #3",
      "16":"a x #3",
      "17":"a x #3",
      "18":"a x #3",
      "19":"a x #3",
      "20":"a x #3",
      "21":"a x #3",
      "22":"a x #3",
      "23":"a x #3",
      "24":"a x #3",
      "25":"a x #3",
      "26":"a x #3",
      "27":"a x #3",
      "28":"a x #3",
      "29":"a x #3",
      "30":"a x #3",
      "31":"a x #3",
      "32":"a x #3",
      "33":"a x #3",
      "34":"a x #3",
      "35":"a x #3",
      "36":"a x #3",
      "37":"a x #3",
      "38":"a x #3",
      "39":"a x #3",
      "40":"a x #3",
      "41":"a x #3",
      "42":"a x #3",
      "43":"a x #3",
      "44":"a x #3",
      "45":"a x #3",
      "46":"a x #3",
      "47":"a x #3",
      "48":"a x #3",
      "49":"a x #3",
      "50":"a x #3"
    },
    "chrome":{
      "4":"u",
      "5":"u",
      "6":"u",
      "7":"u",
      "8":"u",
      "9":"u",
      "10":"u",
      "11":"u",
      "12":"u",
      "13":"u",
      "14":"u",
      "15":"a x #1",
      "16":"a x #1",
      "17":"a x #1",
      "18":"a x #1",
      "19":"a x #1",
      "20":"a x #1",
      "21":"a x #1",
      "22":"a x #1",
      "23":"a x #1",
      "24":"a x #1",
      "25":"a x #1",
      "26":"a x #1",
      "27":"a x #1",
      "28":"a x #1",
      "29":"a x #1",
      "30":"a x #1",
      "31":"a x #1",
      "32":"a x #1",
      "33":"a x #1",
      "34":"a x #1",
      "35":"a x #1",
      "36":"a x #1",
      "37":"a x #1",
      "38":"a x #1",
      "39":"a x #1",
      "40":"a x #1",
      "41":"a x #1",
      "42":"a x #1",
      "43":"a x #1",
      "44":"a x #1",
      "45":"a x #1",
      "46":"a x #1",
      "47":"a x #1",
      "48":"a x #1",
      "49":"a x #1",
      "50":"a x #1",
      "51":"a x #1",
      "52":"a x #1",
      "53":"a x #1",
      "54":"a x #1"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"u",
      "5.1":"a x #1",
      "6":"a x #1",
      "6.1":"a x #1",
      "7":"a x #1",
      "7.1":"a x #1",
      "8":"a x #1",
      "9":"y #2",
      "9.1":"y #2",
      "10":"y #2",
      "TP":"y #2"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"a x #1",
      "16":"a x #1",
      "17":"a x #1",
      "18":"a x #1",
      "19":"a x #1",
      "20":"a x #1",
      "21":"a x #1",
      "22":"a x #1",
      "23":"a x #1",
      "24":"a x #1",
      "25":"a x #1",
      "26":"a x #1",
      "27":"a x #1",
      "28":"a x #1",
      "29":"a x #1",
      "30":"a x #1",
      "31":"a x #1",
      "32":"a x #1",
      "33":"a x #1",
      "34":"a x #1",
      "35":"a x #1",
      "36":"a x #1",
      "37":"a x #1",
      "38":"a x #1",
      "39":"a x #1",
      "40":"a x #1"
    },
    "ios_saf":{
      "3.2":"u",
      "4.0-4.1":"u",
      "4.2-4.3":"u",
      "5.0-5.1":"u",
      "6.0-6.1":"u",
      "7.0-7.1":"a x #1",
      "8":"a x #1",
      "8.1-8.4":"a x #1",
      "9.0-9.2":"y #2",
      "9.3":"y #2"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"u",
      "2.2":"u",
      "2.3":"u",
      "3":"u",
      "4":"a x #1",
      "4.1":"a x #1",
      "4.2-4.3":"a x #1",
      "4.4":"a x #1",
      "4.4.3-4.4.4":"a x #1",
      "50":"a x #1"
    },
    "bb":{
      "7":"u",
      "10":"a x #1"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"a x #1"
    },
    "and_chr":{
      "50":"a x #1"
    },
    "and_ff":{
      "46":"a x #3"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"a x #1"
    },
    "samsung":{
      "4":"a x #1"
    }
  },
  "notes":"Most browsers support this spelled as a prefixed `:-vendor-any()` pseudo-class.",
  "notes_by_num":{
    "1":"Only supports the `:-webkit-any()` pseudo-class, which is deprecated due to handling specificity incorrectly.",
    "2":"Also supports the `:-webkit-any()` pseudo-class, which is deprecated due to handling specificity incorrectly.",
    "3":"Only supports the `:-moz-any()` pseudo-class."
  },
  "usage_perc_y":10.05,
  "usage_perc_a":74.07,
  "ucprefix":false,
  "parent":"",
  "keywords":":matches,matches,:any,any",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"feature-css-selector-:matches()",
  "shown":true
}

},{}],94:[function(require,module,exports){
module.exports={
  "title":"Media Queries: interaction media features",
  "description":"Allows a media query to be set based on the presence and accuracy of the user's pointing device, and whether they have the ability to hover over elements on the page. This includes the `pointer`, `any-pointer`, `hover`, and `any-hover` media features.",
  "spec":"http://www.w3.org/TR/mediaqueries-4/#mf-interaction",
  "status":"wd",
  "links":[
    {
      "url":"http://jordanm.co.uk/2013/11/11/potential-use-cases-for-script-hover-and-pointer.html",
      "title":"Potential use cases for script, hover and pointer CSS Level 4 Media Features"
    },
    {
      "url":"https://dev.opera.com/articles/media-features/",
      "title":"Interaction Media Features and their potential (for incorrect assumptions)"
    },
    {
      "url":"https://github.com/twbs/mq4-hover-shim",
      "title":"Polyfill for the `hover` media feature"
    }
  ],
  "bugs":[
    {
      "description":"[Firefox tracking bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1035774)"
    }
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":60.83,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"css-mediaqueries",
  "keywords":"@media,interaction,hover,any-hover,pointer,any-pointer",
  "ie_id":"mediaquerieslevel4pointerandhover",
  "chrome_id":"6460705494532096",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],95:[function(require,module,exports){
module.exports={
  "title":"Media Queries: resolution feature",
  "description":"Allows a media query to be set based on the device pixels used per CSS unit. While the standard uses `min`/`max-resolution` for this, some browsers support the older non-standard `device-pixel-ratio` media query.",
  "spec":"http://www.w3.org/TR/css3-mediaqueries/#resolution",
  "status":"rec",
  "links":[
    {
      "url":"http://www.w3.org/blog/CSS/2012/06/14/unprefix-webkit-device-pixel-ratio/",
      "title":"How to unprefix -webkit-device-pixel-ratio"
    },
    {
      "url":"https://bugs.webkit.org/show_bug.cgi?id=78087",
      "title":"WebKit Bug 78087: Implement the 'resolution' media query"
    },
    {
      "url":"https://compat.spec.whatwg.org/#css-media-queries-webkit-device-pixel-ratio",
      "title":"WHATWG Compatibility Standard: -webkit-device-pixel-ratio"
    }
  ],
  "bugs":[
    {
      "description":"Microsoft Edge has a bug where `min-resolution` less than `1dpcm` [is ignored](http://jsfiddle.net/behmjd5t/)."
    }
  ],
  "categories":[
    "CSS",
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"a #1",
      "10":"a #1",
      "11":"a #1"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"a #2",
      "3.6":"a #2",
      "4":"a #2",
      "5":"a #2",
      "6":"a #2",
      "7":"a #2",
      "8":"a #2",
      "9":"a #2",
      "10":"a #2",
      "11":"a #2",
      "12":"a #2",
      "13":"a #2",
      "14":"a #2",
      "15":"a #2",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"a x #3",
      "5":"a x #3",
      "6":"a x #3",
      "7":"a x #3",
      "8":"a x #3",
      "9":"a x #3",
      "10":"a x #3",
      "11":"a x #3",
      "12":"a x #3",
      "13":"a x #3",
      "14":"a x #3",
      "15":"a x #3",
      "16":"a x #3",
      "17":"a x #3",
      "18":"a x #3",
      "19":"a x #3",
      "20":"a x #3",
      "21":"a x #3",
      "22":"a x #3",
      "23":"a x #3",
      "24":"a x #3",
      "25":"a x #3",
      "26":"a x #3",
      "27":"a x #3",
      "28":"a x #3",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"a x #3",
      "5":"a x #3",
      "5.1":"a x #3",
      "6":"a x #3",
      "6.1":"a x #3",
      "7":"a x #3",
      "7.1":"a x #3",
      "8":"a x #3",
      "9":"a x #3",
      "9.1":"a x #3",
      "10":"a x #3",
      "TP":"a x #3"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"a x #3",
      "10.0-10.1":"a x #3",
      "10.5":"a x #3",
      "10.6":"a x #3",
      "11":"a x #3",
      "11.1":"a x #3",
      "11.5":"a x #3",
      "11.6":"a x #3",
      "12":"a x #3",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"u",
      "4.0-4.1":"a x #3",
      "4.2-4.3":"a x #3",
      "5.0-5.1":"a x #3",
      "6.0-6.1":"a x #3",
      "7.0-7.1":"a x #3",
      "8":"a x #3",
      "8.1-8.4":"a x #3",
      "9.0-9.2":"a x #3",
      "9.3":"a x #3"
    },
    "op_mini":{
      "all":"a #1"
    },
    "android":{
      "2.1":"u",
      "2.2":"u",
      "2.3":"a x #3",
      "3":"a x #3",
      "4":"a x #3",
      "4.1":"a x #3",
      "4.2-4.3":"a x #3",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"a x #3",
      "10":"a x #3"
    },
    "op_mob":{
      "10":"a x #3",
      "11":"a x #3",
      "11.1":"a x #3",
      "11.5":"a x #3",
      "12":"a x #3",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"a #1",
      "11":"a #1"
    },
    "and_uc":{
      "9.9":"a x #3"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Supports the `dpi` unit, but does not support `dppx` or `dpcm` units.",
    "2":"Firefox before 16 supports only `dpi` unit, but you can set `2dppx` per `min--moz-device-pixel-ratio: 2`",
    "3":"Supports the non-standard `min`/`max-device-pixel-ratio`"
  },
  "usage_perc_y":66.37,
  "usage_perc_a":30.89,
  "ucprefix":false,
  "parent":"css-mediaqueries",
  "keywords":"@media,device-pixel-ratio,resolution,dppx,dpcm,dpi",
  "ie_id":"mediaqueriesresolutionfeature,dppxunitfortheresolutionmediaquery",
  "chrome_id":"5944509615570944",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],96:[function(require,module,exports){
module.exports={
  "title":"Media Queries: scripting media feature",
  "description":"Allows a media query to be set based on whether the current document supports scripting languages (such as JavaScript). This is the `scripting` media feature.",
  "spec":"http://www.w3.org/TR/mediaqueries-4/#scripting",
  "status":"wd",
  "links":[
    {
      "url":"http://jordanm.co.uk/2013/11/11/potential-use-cases-for-script-hover-and-pointer.html",
      "title":"Potential use cases for script, hover and pointer CSS Level 4 Media Features"
    },
    {
      "url":"http://www.nczonline.net/blog/2012/01/04/proposal-scripting-detection-using-css-media-queries/",
      "title":"Original proposal blog post"
    },
    {
      "url":"http://jsbin.com/comefi/1",
      "title":"JS Bin testcase"
    },
    {
      "url":"http://www.quirksmode.org/css/mediaqueries/features.html#basicscripting",
      "title":"Basic testcase at quirksmode.org"
    },
    {
      "url":"https://wpdev.uservoice.com/forums/257854-microsoft-edge-developer/suggestions/8034771--scripting-media-query-feature",
      "title":"Microsoft Edge feature request on UserVoice"
    }
  ],
  "bugs":[
    {
      "description":"[Chrome tracking bug](https://code.google.com/p/chromium/issues/detail?id=489957)"
    },
    {
      "description":"[Firefox tracking bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1166581)"
    }
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"u",
      "13":"u",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"u",
      "49":"u",
      "50":"u"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n",
      "51":"n",
      "52":"u",
      "53":"u",
      "54":"u"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n",
      "TP":"n"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"u",
      "40":"u"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":0,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"css-mediaqueries",
  "keywords":"@media,scripting,script,javascript",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":false
}

},{}],97:[function(require,module,exports){
module.exports={
  "title":"CSS3 Media Queries",
  "description":"Method of applying styles based on media information. Includes things like page and device dimensions",
  "spec":"http://www.w3.org/TR/css3-mediaqueries/",
  "status":"rec",
  "links":[
    {
      "url":"http://ie.microsoft.com/testdrive/HTML5/85CSS3_MediaQueries/",
      "title":"IE demo page with information"
    },
    {
      "url":"http://webdesignerwall.com/tutorials/responsive-design-with-css3-media-queries",
      "title":"Media Queries tutorial"
    },
    {
      "url":"https://github.com/scottjehl/Respond",
      "title":"Polyfill for IE"
    },
    {
      "url":"http://docs.webplatform.org/wiki/css/atrules/@media",
      "title":"WebPlatform Docs"
    }
  ],
  "bugs":[
    {
      "description":"Firefox (9 and previous?) is buggy with min-width media queries not being recognized, but the rules inside those being parsed and used."
    },
    {
      "description":"Opera 12.1 and IE9 incorrectly include scrollbar width for media queries based on window width."
    }
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"p",
      "6":"p",
      "7":"p",
      "8":"p",
      "9":"y #1",
      "10":"y #1",
      "11":"y #1"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"y",
      "3.6":"y",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y #1",
      "5":"y #1",
      "6":"y #1",
      "7":"y #1",
      "8":"y #1",
      "9":"y #1",
      "10":"y #1",
      "11":"y #1",
      "12":"y #1",
      "13":"y #1",
      "14":"y #1",
      "15":"y #1",
      "16":"y #1",
      "17":"y #1",
      "18":"y #1",
      "19":"y #1",
      "20":"y #1",
      "21":"y #1",
      "22":"y #1",
      "23":"y #1",
      "24":"y #1",
      "25":"y #1",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"a #1 #2",
      "3.2":"a #1 #2",
      "4":"y #1",
      "5":"y #1",
      "5.1":"y #1",
      "6":"y #1",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"y",
      "10.0-10.1":"y",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"y #1",
      "4.0-4.1":"y #1",
      "4.2-4.3":"y #1",
      "5.0-5.1":"y #1",
      "6.0-6.1":"y #1",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"y"
    },
    "android":{
      "2.1":"y #1",
      "2.2":"y #1",
      "2.3":"y #1",
      "3":"y #1",
      "4":"y #1",
      "4.1":"y #1",
      "4.2-4.3":"y #1",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y #1",
      "11":"y #1"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Does not support nested media queries",
    "2":"Partial support refers to only acknowledging different media rules on page reload"
  },
  "usage_perc_y":97.25,
  "usage_perc_a":0.01,
  "ucprefix":false,
  "parent":"",
  "keywords":"@media",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],98:[function(require,module,exports){
module.exports={
  "title":"Blending of HTML/SVG elements",
  "description":"Allows blending between arbitrary SVG and HTML elements",
  "spec":"http://www.w3.org/TR/compositing-1/#mix-blend-mode",
  "status":"cr",
  "links":[
    {
      "url":"http://codepen.io/bennettfeely/pen/csjzd",
      "title":"codepen example"
    },
    {
      "url":"http://css-tricks.com/basics-css-blend-modes/",
      "title":"Blog post"
    }
  ],
  "bugs":[
    {
      "description":"Firefox on OSX [has a bug](https://bugzilla.mozilla.org/show_bug.cgi?id=1135271) where content may turn entirely black"
    }
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n d #1",
      "30":"n d #1",
      "31":"n d #1",
      "32":"n d #1",
      "33":"n d #1",
      "34":"n d #1",
      "35":"n d #1",
      "36":"n d #1",
      "37":"n d #1",
      "38":"n d #1",
      "39":"n d #1",
      "40":"n d #1",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"a #2",
      "8":"a #2",
      "9":"a #2",
      "9.1":"a #2",
      "10":"a #2",
      "TP":"a #2"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"a #2",
      "8.1-8.4":"a #2",
      "9.0-9.2":"a #2",
      "9.3":"a #2"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Enabled in Chrome through the \"experimental Web Platform features\" flag in chrome://flags",
    "2":"Partial in Safari refers to not supporting the `hue`, `saturation`, `color`, and `luminosity` blend modes."
  },
  "usage_perc_y":56.85,
  "usage_perc_a":10.75,
  "ucprefix":false,
  "parent":"",
  "keywords":"mix-blend-mode,css blend modes,css blending modes",
  "ie_id":"mixblendmode",
  "chrome_id":"6362616360337408",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],99:[function(require,module,exports){
module.exports={
  "title":"CSS Motion Path",
  "description":"Allows elements to be animated along SVG paths or shapes",
  "spec":"https://drafts.fxtf.org/motion-1/",
  "status":"unoff",
  "links":[
    {
      "url":"http://codepen.io/danwilson/post/css-motion-paths",
      "title":"Blog post"
    },
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/motion-path",
      "title":"MDN article"
    },
    {
      "url":"https://googlechrome.github.io/samples/css-motion-path/index.html",
      "title":"Demo"
    },
    {
      "url":"https://bugzilla.mozilla.org/show_bug.cgi?id=1186329",
      "title":"Firefox tracking bug"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n d #1",
      "44":"n d #1",
      "45":"n d #1",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n",
      "TP":"n"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n d #1",
      "31":"n d #1",
      "32":"n d #1",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Requires the \"Experimental Web Platform features\" flag to be enabled"
  },
  "usage_perc_y":48.03,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"",
  "ie_id":"cssmotionpath",
  "chrome_id":"6190642178818048",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],100:[function(require,module,exports){
module.exports={
  "title":"selector list argument of :not()",
  "description":"Selectors Level 4 allows the `:not()` pseudo-class to accept a list of selectors, which the element must not match any of. Selectors Level 3 only allowed `:not()` to accept a single simple selector. Thus, `:not(a):not(.b):not([c])` can instead be written as `:not(a, .b, [c])`",
  "spec":"https://www.w3.org/TR/selectors4/#negation",
  "status":"wd",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/:not",
      "title":"MDN article"
    },
    {
      "url":"https://bugs.chromium.org/p/chromium/issues/detail?id=580628",
      "title":"Chrome feature request issue"
    },
    {
      "url":"https://bugzilla.mozilla.org/show_bug.cgi?id=933562",
      "title":"Firefox feature request bug"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"u",
      "49":"u",
      "50":"u"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n",
      "51":"n",
      "52":"n",
      "53":"u",
      "54":"u"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":10.05,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"negation,not,pseudo,selector,selectors,list,multiple,argument,level,4",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"feature-css-selector-:not()-level-4",
  "shown":true
}

},{}],101:[function(require,module,exports){
module.exports={
  "title":"selector list argument of :nth-child and :nth-last-child CSS pseudo-classes",
  "description":"The newest versions of `:nth-child()` and `:nth-last-child()` accept an optional `of S` clause which filters the children to only those which match the selector list `S`. For example, `:nth-child(1 of .foo)` selects the first child among the children that have the `foo` class (ignoring any non-`foo` children which precede that child). Similar to `:nth-of-type`, but for arbitrary selectors instead of only type selectors.",
  "spec":"https://drafts.csswg.org/selectors/#the-nth-child-pseudo",
  "status":"unoff",
  "links":[
    {
      "url":"https://bugzilla.mozilla.org/show_bug.cgi?id=854148",
      "title":"Mozilla Bug 854148 - Support for :nth-child(An+B of sel), :nth-last-child(An+B of sel) pseudo-classes"
    },
    {
      "url":"https://bugs.chromium.org/p/chromium/issues/detail?id=304163",
      "title":"Chromium Issue 304163: Implement :nth-child(an+b of S) and :nth-last-child(an+b of S) pseudo-classes"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n",
      "51":"n",
      "52":"n",
      "53":"n",
      "54":"n"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":10.05,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"nth-child,nth-last-child,nth,child,an,b,of,s,sel,selector,list",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"feature-css-selector-:nth-child(an+b-of-selector-list)-and-:nth-last-child(an+b-of-selector-list)",
  "shown":true
}

},{}],102:[function(require,module,exports){
module.exports={
  "title":"CSS3 Opacity",
  "description":"Method of setting the transparency level of an element",
  "spec":"http://www.w3.org/TR/css3-color/",
  "status":"rec",
  "links":[
    {
      "url":"http://www.css3files.com/color/#opacity",
      "title":"Information page"
    },
    {
      "url":"http://docs.webplatform.org/wiki/css/properties/opacity",
      "title":"WebPlatform Docs"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"a",
      "6":"a",
      "7":"a",
      "8":"a",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"y",
      "3":"y",
      "3.5":"y",
      "3.6":"y",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"y",
      "3.2":"y",
      "4":"y",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"y",
      "9.5-9.6":"y",
      "10.0-10.1":"y",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"y",
      "4.0-4.1":"y",
      "4.2-4.3":"y",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"y"
    },
    "android":{
      "2.1":"y",
      "2.2":"y",
      "2.3":"y",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"Transparency for elements in IE8 and older can be achieved using the proprietary \"filter\" property and does not work well with PNG images using alpha transparency.",
  "notes_by_num":{
    
  },
  "usage_perc_y":97.33,
  "usage_perc_a":0.71,
  "ucprefix":false,
  "parent":"",
  "keywords":"transparent,transparency,alpha",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],103:[function(require,module,exports){
module.exports={
  "title":":optional CSS pseudo-class",
  "description":"The `:optional` pseudo-class matches form inputs (`<input>`, `<textarea>`, `<select>`) which are not `:required`.",
  "spec":"https://drafts.csswg.org/selectors-4/#optional-pseudo",
  "status":"unoff",
  "links":[
    {
      "url":"https://html.spec.whatwg.org/multipage/scripting.html#selector-optional",
      "title":"HTML specification for `:optional`"
    },
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/:optional",
      "title":"Mozilla Developer Network article"
    },
    {
      "url":"http://jsbin.com/fihudu/edit?html,css,output",
      "title":"JS Bin testcase"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"u",
      "5":"u",
      "6":"u",
      "7":"u",
      "8":"u",
      "9":"u",
      "10":"u",
      "11":"u",
      "12":"u",
      "13":"u",
      "14":"u",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"u",
      "9.5-9.6":"u",
      "10.0-10.1":"a #1",
      "10.5":"a #1",
      "10.6":"a #1",
      "11":"a #1",
      "11.1":"a #1",
      "11.5":"a #1",
      "11.6":"a #1",
      "12":"a #1",
      "12.1":"a #1",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"a #1"
    },
    "android":{
      "2.1":"u",
      "2.2":"u",
      "2.3":"y",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"a #1",
      "11":"a #1",
      "11.1":"a #1",
      "11.5":"a #1",
      "12":"a #1",
      "12.1":"a #1",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Does not match non-required `<select>`s"
  },
  "usage_perc_y":91.78,
  "usage_perc_a":4.88,
  "ucprefix":false,
  "parent":"form-validation",
  "keywords":":optional,optional,:required,required",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],104:[function(require,module,exports){
module.exports={
  "title":"CSS page-break properties",
  "description":"Properties to control the way elements are broken across (printed) pages.",
  "spec":"http://www.w3.org/TR/CSS2/page.html#page-breaks",
  "status":"rec",
  "links":[
    {
      "url":"https://css-tricks.com/almanac/properties/p/page-break/",
      "title":"CSS Tricks article"
    },
    {
      "url":"http://dev.w3.org/csswg/css-break-3/#break-between",
      "title":"Latest fragmentation specification (includes column & region breaks)"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"a #1 #2 #3",
      "6":"a #1 #2 #3",
      "7":"a #1 #2 #3",
      "8":"a #1 #2 #3",
      "9":"a #1 #2 #3",
      "10":"a #1 #2",
      "11":"a #1 #2"
    },
    "edge":{
      "12":"a #1 #2",
      "13":"a #1 #2",
      "14":"a #1 #2"
    },
    "firefox":{
      "2":"a #1 #2 #3",
      "3":"a #1 #2 #3",
      "3.5":"a #1 #2 #3",
      "3.6":"a #1 #2 #3",
      "4":"a #1 #2 #3",
      "5":"a #1 #2 #3",
      "6":"a #1 #2 #3",
      "7":"a #1 #2 #3",
      "8":"a #1 #2 #3",
      "9":"a #1 #2 #3",
      "10":"a #1 #2 #3",
      "11":"a #1 #2 #3",
      "12":"a #1 #2 #3",
      "13":"a #1 #2 #3",
      "14":"a #1 #2 #3",
      "15":"a #1 #2 #3",
      "16":"a #1 #2 #3",
      "17":"a #1 #2 #3",
      "18":"a #1 #2 #3",
      "19":"a #1 #2 #3",
      "20":"a #1 #2 #3",
      "21":"a #1 #2 #3",
      "22":"a #1 #2 #3",
      "23":"a #1 #2 #3",
      "24":"a #1 #2 #3",
      "25":"a #1 #2 #3",
      "26":"a #1 #2 #3",
      "27":"a #1 #2 #3",
      "28":"a #1 #2 #3",
      "29":"a #1 #2 #3",
      "30":"a #1 #2 #3",
      "31":"a #1 #2 #3",
      "32":"a #1 #2 #3",
      "33":"a #1 #2 #3",
      "34":"a #1 #2 #3",
      "35":"a #1 #2 #3",
      "36":"a #1 #2 #3",
      "37":"a #1 #2 #3",
      "38":"a #1 #2 #3",
      "39":"a #1 #2 #3",
      "40":"a #1 #2 #3",
      "41":"a #1 #2 #3",
      "42":"a #1 #2 #3",
      "43":"a #1 #2 #3",
      "44":"a #1 #2 #3",
      "45":"a #1 #2 #3",
      "46":"a #1 #2 #3",
      "47":"a #1 #2 #3",
      "48":"a #1 #2 #3",
      "49":"a #1 #2 #3",
      "50":"a #1 #2 #3"
    },
    "chrome":{
      "4":"a #1 #2 #3",
      "5":"a #1 #2 #3",
      "6":"a #1 #2 #3",
      "7":"a #1 #2 #3",
      "8":"a #1 #2 #3",
      "9":"a #1 #2 #3",
      "10":"a #1 #2 #3",
      "11":"a #1 #2 #3",
      "12":"a #1 #2 #3",
      "13":"a #1 #2 #3",
      "14":"a #1 #2 #3",
      "15":"a #1 #2 #3",
      "16":"a #1 #2 #3",
      "17":"a #1 #2 #3",
      "18":"a #1 #2 #3",
      "19":"a #1 #2 #3",
      "20":"a #1 #2 #3",
      "21":"a #1 #2 #3",
      "22":"a #1 #2 #3",
      "23":"a #1 #2 #3",
      "24":"a #1 #2 #3",
      "25":"a #1 #2 #3",
      "26":"a #1 #2 #3",
      "27":"a #1 #2 #3",
      "28":"a #1 #2 #3",
      "29":"a #1 #2 #3",
      "30":"a #1 #2 #3",
      "31":"a #1 #2 #3",
      "32":"a #1 #2 #3",
      "33":"a #1 #2 #3",
      "34":"a #1 #2 #3",
      "35":"a #1 #2 #3",
      "36":"a #1 #2 #3",
      "37":"a #1 #2 #3",
      "38":"a #1 #2 #3",
      "39":"a #1 #2 #3",
      "40":"a #1 #2 #3",
      "41":"a #1 #2 #3",
      "42":"a #1 #2 #3",
      "43":"a #1 #2 #3",
      "44":"a #1 #2 #3",
      "45":"a #1 #2 #3",
      "46":"a #1 #2 #3",
      "47":"a #1 #2 #3",
      "48":"a #1 #2 #3",
      "49":"a #1 #2 #3",
      "50":"a #1 #2 #3",
      "51":"a #1 #2 #3",
      "52":"a #1 #2 #3",
      "53":"a #1 #2 #3",
      "54":"a #1 #2 #3"
    },
    "safari":{
      "3.1":"a #1 #2 #3",
      "3.2":"a #1 #2 #3",
      "4":"a #1 #2 #3",
      "5":"a #1 #2 #3",
      "5.1":"a #1 #2 #3",
      "6":"a #1 #2 #3",
      "6.1":"a #1 #2 #3",
      "7":"a #1 #2 #3",
      "7.1":"a #1 #2 #3",
      "8":"a #1 #2 #3",
      "9":"a #1 #2 #3",
      "9.1":"a #1 #2 #3",
      "10":"a #2 #3",
      "TP":"a #1 #2 #3"
    },
    "opera":{
      "9":"u",
      "9.5-9.6":"u",
      "10.0-10.1":"y #1",
      "10.5":"y #1",
      "10.6":"y #1",
      "11":"y #1",
      "11.1":"y #1",
      "11.5":"y #1",
      "11.6":"y #1",
      "12":"y #1",
      "12.1":"y #1",
      "15":"a #1 #2 #3",
      "16":"a #1 #2 #3",
      "17":"a #1 #2 #3",
      "18":"a #1 #2 #3",
      "19":"a #1 #2 #3",
      "20":"a #1 #2 #3",
      "21":"a #1 #2 #3",
      "22":"a #1 #2 #3",
      "23":"a #1 #2 #3",
      "24":"a #1 #2 #3",
      "25":"a #1 #2 #3",
      "26":"a #1 #2 #3",
      "27":"a #1 #2 #3",
      "28":"a #1 #2 #3",
      "29":"a #1 #2 #3",
      "30":"a #1 #2 #3",
      "31":"a #1 #2 #3",
      "32":"a #1 #2 #3",
      "33":"a #1 #2 #3",
      "34":"a #1 #2 #3",
      "35":"a #1 #2 #3",
      "36":"a #1 #2 #3",
      "37":"a #1 #2 #3",
      "38":"a #1 #2 #3",
      "39":"a #1 #2 #3",
      "40":"a #1 #2 #3"
    },
    "ios_saf":{
      "3.2":"a #1 #2 #3",
      "4.0-4.1":"a #1 #2 #3",
      "4.2-4.3":"a #1 #2 #3",
      "5.0-5.1":"a #1 #2 #3",
      "6.0-6.1":"a #1 #2 #3",
      "7.0-7.1":"a #1 #2 #3",
      "8":"a #1 #2 #3",
      "8.1-8.4":"a #1 #2 #3",
      "9.0-9.2":"a #1 #2 #3",
      "9.3":"a #1 #2 #3"
    },
    "op_mini":{
      "all":"y #1"
    },
    "android":{
      "2.1":"a #1 #2 #3",
      "2.2":"a #1 #2 #3",
      "2.3":"a #1 #2 #3",
      "3":"a #1 #2 #3",
      "4":"a #1 #2 #3",
      "4.1":"a #1 #2 #3",
      "4.2-4.3":"a #1 #2 #3",
      "4.4":"a #1 #2 #3",
      "4.4.3-4.4.4":"a #1 #2 #3",
      "50":"a #1 #2 #3"
    },
    "bb":{
      "7":"a #1 #2 #3",
      "10":"a #1 #2 #3"
    },
    "op_mob":{
      "10":"y #1",
      "11":"y #1",
      "11.1":"y #1",
      "11.5":"y #1",
      "12":"y #1",
      "12.1":"y #1",
      "37":"a #1 #2 #3"
    },
    "and_chr":{
      "50":"a #1 #2 #3"
    },
    "and_ff":{
      "46":"a #1 #2 #3"
    },
    "ie_mob":{
      "10":"a #1 #2",
      "11":"a #1 #2"
    },
    "and_uc":{
      "9.9":"a #1 #2 #3"
    },
    "samsung":{
      "4":"a #1 #2 #3"
    }
  },
  "notes":"Not all mobile browsers offer print support; support listed for these is based on browser engine capability.",
  "notes_by_num":{
    "1":"Supports the `page-break-*` alias from the CSS 2.1 specification, but not the `break-*` properties from the latest spec.",
    "2":"Does not support `avoid` for `page-break-before` & `page-break-after` (only `page-break-inside`).",
    "3":"Treats the `left` and `right` values like `always`."
  },
  "usage_perc_y":4.88,
  "usage_perc_a":93.15,
  "ucprefix":false,
  "parent":"",
  "keywords":"page-break-before,page-break-after,page-break-inside,always,avoid",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],105:[function(require,module,exports){
module.exports={
  "title":":placeholder-shown CSS pseudo-class",
  "description":"Input elements can sometimes show placeholder text as a hint to the user on what to type in. See, for example, the placeholder attribute in HTML5. The :placeholder-shown pseudo-class matches an input element that is showing such placeholder text.",
  "spec":"http://dev.w3.org/csswg/selectors-4/#placeholder",
  "status":"unoff",
  "links":[
    {
      "url":"http://trac.webkit.org/changeset/172826",
      "title":"WebKit commit"
    },
    {
      "url":"https://bugzilla.mozilla.org/show_bug.cgi?id=1069015",
      "title":"Firefox bug"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"For support of styling the actual placeholder text itself, see [CSS ::placeholder](http://caniuse.com/#feat=css-placeholder)",
  "notes_by_num":{
    
  },
  "usage_perc_y":57.55,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":":placeholder-shown,placeholder-shown,placeholder",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"feature-css-selector-:placeholder-shown",
  "shown":true
}

},{}],106:[function(require,module,exports){
module.exports={
  "title":"::placeholder CSS pseudo-element",
  "description":"The ::placeholder pseudo-element represents placeholder text in an input field: text that represents the input and provides a hint to the user on how to fill out the form. For example, a date-input field might have the placeholder text `YYYY/MM/DD` to clarify that numeric dates are to be entered in year-month-day order.",
  "spec":"http://dev.w3.org/csswg/css-pseudo-4/#placeholder-pseudo",
  "status":"wd",
  "links":[
    {
      "url":"http://msdn.microsoft.com/en-us/library/ie/hh772745(v=vs.85).aspx",
      "title":"MSDN article"
    },
    {
      "url":"http://css-tricks.com/snippets/css/style-placeholder-text/",
      "title":"CSS-Tricks article with all prefixes"
    },
    {
      "url":"http://wiki.csswg.org/ideas/placeholder-styling",
      "title":"CSSWG discussion"
    },
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/::-moz-placeholder",
      "title":"MDN article"
    },
    {
      "url":"https://bugzilla.mozilla.org/show_bug.cgi?id=1069012",
      "title":"Mozilla Bug 1069012 - unprefix :placeholder-shown pseudo-class and ::placeholder pseudo-element"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"a x",
      "11":"a x"
    },
    "edge":{
      "12":"a x",
      "13":"a x",
      "14":"a x"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"a x #1",
      "5":"a x #1",
      "6":"a x #1",
      "7":"a x #1",
      "8":"a x #1",
      "9":"a x #1",
      "10":"a x #1",
      "11":"a x #1",
      "12":"a x #1",
      "13":"a x #1",
      "14":"a x #1",
      "15":"a x #1",
      "16":"a x #1",
      "17":"a x #1",
      "18":"a x #1",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y x",
      "27":"y x",
      "28":"y x",
      "29":"y x",
      "30":"y x",
      "31":"y x",
      "32":"y x",
      "33":"y x",
      "34":"y x",
      "35":"y x",
      "36":"y x",
      "37":"y x",
      "38":"y x",
      "39":"y x",
      "40":"y x",
      "41":"y x",
      "42":"y x",
      "43":"y x",
      "44":"y x",
      "45":"y x",
      "46":"y x",
      "47":"y x",
      "48":"y x",
      "49":"y x",
      "50":"y x"
    },
    "chrome":{
      "4":"a x",
      "5":"a x",
      "6":"a x",
      "7":"a x",
      "8":"a x",
      "9":"a x",
      "10":"a x",
      "11":"a x",
      "12":"a x",
      "13":"a x",
      "14":"a x",
      "15":"a x",
      "16":"a x",
      "17":"a x",
      "18":"a x",
      "19":"a x",
      "20":"a x",
      "21":"a x",
      "22":"a x",
      "23":"a x",
      "24":"a x",
      "25":"a x",
      "26":"a x",
      "27":"a x",
      "28":"a x",
      "29":"a x",
      "30":"a x",
      "31":"a x",
      "32":"a x",
      "33":"a x",
      "34":"a x",
      "35":"a x",
      "36":"a x",
      "37":"a x",
      "38":"a x",
      "39":"a x",
      "40":"a x",
      "41":"a x",
      "42":"a x",
      "43":"a x",
      "44":"a x",
      "45":"a x",
      "46":"a x",
      "47":"a x",
      "48":"a x",
      "49":"a x",
      "50":"a x",
      "51":"a x",
      "52":"a x",
      "53":"a x",
      "54":"a x"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"a x",
      "5.1":"a x",
      "6":"a x",
      "6.1":"a x",
      "7":"a x",
      "7.1":"a x",
      "8":"a x",
      "9":"a x",
      "9.1":"a x",
      "10":"a x",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"a x",
      "16":"a x",
      "17":"a x",
      "18":"a x",
      "19":"a x",
      "20":"a x",
      "21":"a x",
      "22":"a x",
      "23":"a x",
      "24":"a x",
      "25":"a x",
      "26":"a x",
      "27":"a x",
      "28":"a x",
      "29":"a x",
      "30":"a x",
      "31":"a x",
      "32":"a x",
      "33":"a x",
      "34":"a x",
      "35":"a x",
      "36":"a x",
      "37":"a x",
      "38":"a x",
      "39":"a x",
      "40":"a x"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"a x",
      "5.0-5.1":"a x",
      "6.0-6.1":"a x",
      "7.0-7.1":"a x",
      "8":"a x",
      "8.1-8.4":"a x",
      "9.0-9.2":"a x",
      "9.3":"a x"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"a x",
      "2.2":"a x",
      "2.3":"a x",
      "3":"a x",
      "4":"a x",
      "4.1":"a x",
      "4.2-4.3":"a x",
      "4.4":"a x",
      "4.4.3-4.4.4":"a x",
      "50":"a x"
    },
    "bb":{
      "7":"a x",
      "10":"a x"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"a x"
    },
    "and_chr":{
      "50":"a x"
    },
    "and_ff":{
      "46":"y x"
    },
    "ie_mob":{
      "10":"a x",
      "11":"a x"
    },
    "and_uc":{
      "9.9":"a x"
    },
    "samsung":{
      "4":"a x"
    }
  },
  "notes":"Partial support refers to using alternate names:\r\n`::-webkit-input-placeholder` for Chrome/Safari/Opera ([Chrome issue #623345](https://bugs.chromium.org/p/chromium/issues/detail?id=623345))\r\n`:-ms-input-placeholder` for IE. \r\n`::-ms-input-placeholder` for Edge (also supports webkit prefix)",
  "notes_by_num":{
    "1":"Firefox 18 and below supported the `:-moz-placeholder` pseudo-class rather than the `::-moz-placeholder` pseudo-element."
  },
  "usage_perc_y":7.95,
  "usage_perc_a":83.93,
  "ucprefix":false,
  "parent":"",
  "keywords":"::placeholder,placeholder",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],107:[function(require,module,exports){
module.exports={
  "title":"CSS :read-only and :read-write selectors",
  "description":":read-only and :read-write pseudo-classes to match elements which are considered user-alterable",
  "spec":"https://html.spec.whatwg.org/multipage/scripting.html#selector-read-only",
  "status":"ls",
  "links":[
    {
      "url":"https://css-tricks.com/almanac/selectors/r/read-write-read/",
      "title":"CSS Tricks article"
    },
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/%3Aread-only",
      "title":"MDN :read-only"
    },
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/:read-write",
      "title":"MDN :read-write"
    },
    {
      "url":"https://drafts.csswg.org/selectors-4/#rw-pseudos",
      "title":"Selectors Level 4 \u00a7 The Mutability Pseudo-classes: :read-only and :read-write"
    },
    {
      "url":"https://bugzilla.mozilla.org/show_bug.cgi?id=312971",
      "title":"Firefox feature request bug"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"u",
      "3":"u",
      "3.5":"u",
      "3.6":"u",
      "4":"u",
      "5":"u",
      "6":"u",
      "7":"u",
      "8":"u",
      "9":"u",
      "10":"u",
      "11":"u",
      "12":"u",
      "13":"u",
      "14":"u",
      "15":"u",
      "16":"u",
      "17":"u",
      "18":"u",
      "19":"u",
      "20":"u",
      "21":"u",
      "22":"u",
      "23":"u",
      "24":"u",
      "25":"u",
      "26":"u",
      "27":"y x",
      "28":"y x",
      "29":"y x",
      "30":"y x",
      "31":"y x",
      "32":"y x",
      "33":"y x",
      "34":"y x",
      "35":"y x",
      "36":"y x",
      "37":"y x",
      "38":"y x",
      "39":"y x",
      "40":"y x",
      "41":"y x",
      "42":"y x",
      "43":"y x",
      "44":"y x",
      "45":"y x",
      "46":"y x",
      "47":"y x",
      "48":"y x",
      "49":"y x",
      "50":"y x"
    },
    "chrome":{
      "4":"u",
      "5":"u",
      "6":"u",
      "7":"u",
      "8":"u",
      "9":"u",
      "10":"u",
      "11":"u",
      "12":"u",
      "13":"u",
      "14":"u",
      "15":"u",
      "16":"u",
      "17":"u",
      "18":"u",
      "19":"u",
      "20":"u",
      "21":"u",
      "22":"u",
      "23":"u",
      "24":"u",
      "25":"u",
      "26":"u",
      "27":"u",
      "28":"u",
      "29":"u",
      "30":"u",
      "31":"u",
      "32":"u",
      "33":"u",
      "34":"a #1",
      "35":"a #1",
      "36":"a #1",
      "37":"a #1",
      "38":"a #1",
      "39":"a #1",
      "40":"a #1",
      "41":"a #1",
      "42":"a #1",
      "43":"a #1",
      "44":"a #1",
      "45":"a #1",
      "46":"a #1",
      "47":"a #1",
      "48":"a #1",
      "49":"a #1",
      "50":"a #1",
      "51":"a #1",
      "52":"a #1",
      "53":"a #1",
      "54":"a #1"
    },
    "safari":{
      "3.1":"u",
      "3.2":"u",
      "4":"u",
      "5":"u",
      "5.1":"u",
      "6":"u",
      "6.1":"u",
      "7":"a #1",
      "7.1":"a #1",
      "8":"a #1",
      "9":"a #1",
      "9.1":"a #1",
      "10":"a #1",
      "TP":"a #1"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"a #1",
      "16":"a #1",
      "17":"a #1",
      "18":"a #1",
      "19":"a #1",
      "20":"a #1",
      "21":"a #1",
      "22":"a #1",
      "23":"a #1",
      "24":"a #1",
      "25":"a #1",
      "26":"a #1",
      "27":"a #1",
      "28":"a #1",
      "29":"a #1",
      "30":"a #1",
      "31":"a #1",
      "32":"a #1",
      "33":"a #1",
      "34":"a #1",
      "35":"a #1",
      "36":"a #1",
      "37":"a #1",
      "38":"a #1",
      "39":"a #1",
      "40":"a #1"
    },
    "ios_saf":{
      "3.2":"u",
      "4.0-4.1":"u",
      "4.2-4.3":"u",
      "5.0-5.1":"u",
      "6.0-6.1":"u",
      "7.0-7.1":"u",
      "8":"a #1",
      "8.1-8.4":"a #1",
      "9.0-9.2":"a #1",
      "9.3":"a #1"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"a #1"
    },
    "bb":{
      "7":"u",
      "10":"u"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"a #1"
    },
    "and_chr":{
      "50":"a #1"
    },
    "and_ff":{
      "46":"y x"
    },
    "ie_mob":{
      "10":"u",
      "11":"u"
    },
    "and_uc":{
      "9.9":"u"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Supports selector only for input and textarea fields, but not for contenteditable"
  },
  "usage_perc_y":9.11,
  "usage_perc_a":60.65,
  "ucprefix":false,
  "parent":"",
  "keywords":"css,selector,read-only,read-write",
  "ie_id":"cssmutabilitypseudoclasses",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":false
}

},{}],108:[function(require,module,exports){
module.exports={
  "title":"CSS Reflections",
  "description":"Method of displaying a reflection of an element",
  "spec":"http://webkit.org/blog/182/css-reflections/",
  "status":"unoff",
  "links":[
    {
      "url":"http://webkit.org/blog/182/css-reflections/",
      "title":"Webkit blog post"
    },
    {
      "url":"https://wpdev.uservoice.com/forums/257854-microsoft-edge-developer/suggestions/7930470-support-css-reflections",
      "title":"Microsoft Edge feature request on UserVoice"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n"
    },
    "chrome":{
      "4":"y x",
      "5":"y x",
      "6":"y x",
      "7":"y x",
      "8":"y x",
      "9":"y x",
      "10":"y x",
      "11":"y x",
      "12":"y x",
      "13":"y x",
      "14":"y x",
      "15":"y x",
      "16":"y x",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y x",
      "27":"y x",
      "28":"y x",
      "29":"y x",
      "30":"y x",
      "31":"y x",
      "32":"y x",
      "33":"y x",
      "34":"y x",
      "35":"y x",
      "36":"y x",
      "37":"y x",
      "38":"y x",
      "39":"y x",
      "40":"y x",
      "41":"y x",
      "42":"y x",
      "43":"y x",
      "44":"y x",
      "45":"y x",
      "46":"y x",
      "47":"y x",
      "48":"y x",
      "49":"y x",
      "50":"y x",
      "51":"y x",
      "52":"y x",
      "53":"y x",
      "54":"y x"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"y x",
      "5":"y x",
      "5.1":"y x",
      "6":"y x",
      "6.1":"y x",
      "7":"y x",
      "7.1":"y x",
      "8":"y x",
      "9":"y x",
      "9.1":"y x",
      "10":"y x",
      "TP":"y x"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"y x",
      "16":"y x",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y x",
      "27":"y x",
      "28":"y x",
      "29":"y x",
      "30":"y x",
      "31":"y x",
      "32":"y x",
      "33":"y x",
      "34":"y x",
      "35":"y x",
      "36":"y x",
      "37":"y x",
      "38":"y x",
      "39":"y x",
      "40":"y x"
    },
    "ios_saf":{
      "3.2":"y x",
      "4.0-4.1":"y x",
      "4.2-4.3":"y x",
      "5.0-5.1":"y x",
      "6.0-6.1":"y x",
      "7.0-7.1":"y x",
      "8":"y x",
      "8.1-8.4":"y x",
      "9.0-9.2":"y x",
      "9.3":"y x"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"y x",
      "2.2":"y x",
      "2.3":"y x",
      "3":"y x",
      "4":"y x",
      "4.1":"y x",
      "4.2-4.3":"y x",
      "4.4":"y x",
      "4.4.3-4.4.4":"y x",
      "50":"y x"
    },
    "bb":{
      "7":"y x",
      "10":"y x"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y x"
    },
    "and_chr":{
      "50":"y x"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"y x"
    }
  },
  "notes":"Similar effect can be achieved in Firefox 4+ using the -moz-element() background property",
  "notes_by_num":{
    
  },
  "usage_perc_y":69.53,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"box-reflect",
  "ie_id":"",
  "chrome_id":"5627300510957568",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],109:[function(require,module,exports){
module.exports={
  "title":"CSS Regions",
  "description":"Method of flowing content into multiple elements.",
  "spec":"http://www.w3.org/TR/css3-regions/",
  "status":"wd",
  "links":[
    {
      "url":"http://html.adobe.com/webstandards/cssregions/",
      "title":"Adobe demos and samples"
    },
    {
      "url":"http://msdn.microsoft.com/en-us/ie/hh272902#_CSSConnected",
      "title":"IE10 developer guide info"
    },
    {
      "url":"http://docs.webplatform.org/wiki/css/atrules/@region",
      "title":"WebPlatform Docs"
    },
    {
      "url":"https://bugzilla.mozilla.org/show_bug.cgi?id=674802",
      "title":"Firefox feature request bug"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"a x #1",
      "11":"a x #1"
    },
    "edge":{
      "12":"a x #1",
      "13":"a x #1",
      "14":"a x #1"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"a x",
      "16":"a x",
      "17":"a x",
      "18":"a x",
      "19":"n d",
      "20":"n d",
      "21":"n d",
      "22":"n d",
      "23":"n d",
      "24":"n d",
      "25":"n d",
      "26":"n d",
      "27":"n d",
      "28":"n d",
      "29":"n d",
      "30":"n d",
      "31":"n d",
      "32":"n d",
      "33":"n d",
      "34":"n d",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n",
      "51":"n",
      "52":"n",
      "53":"n",
      "54":"n"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"y x",
      "7":"y x",
      "7.1":"y x",
      "8":"y x",
      "9":"y x",
      "9.1":"y x",
      "10":"y x",
      "TP":"y x"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"y x",
      "8":"y x",
      "8.1-8.4":"y x",
      "9.0-9.2":"y x",
      "9.3":"y x"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"a x #1",
      "11":"a x #1"
    },
    "and_uc":{
      "9.9":"y x"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Support is limited to using an iframe as a content source with the `-ms-flow-into: flow_name;` and `-ms-flow-from: flow_name;` syntax."
  },
  "usage_perc_y":17.75,
  "usage_perc_a":7.56,
  "ucprefix":false,
  "parent":"",
  "keywords":"",
  "ie_id":"regions",
  "chrome_id":"5655612935372800",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],110:[function(require,module,exports){
module.exports={
  "title":"CSS Repeating Gradients",
  "description":"Method of defining a repeating linear or radial color gradient as a CSS image.",
  "spec":"http://www.w3.org/TR/css3-images/#repeating-gradients",
  "status":"cr",
  "links":[
    {
      "url":"https://developer.mozilla.org/en/CSS/repeating-linear-gradient",
      "title":"MDN article"
    },
    {
      "url":"http://www.css3files.com/gradient/#repeatinglineargradient",
      "title":"Information page"
    },
    {
      "url":"http://docs.webplatform.org/wiki/css/repeating-linear-gradient",
      "title":"WebPlatform Docs"
    }
  ],
  "bugs":[
    {
      "description":"Partial support in Opera 11.10 and 11.50 refers to only having support for linear gradients."
    }
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"y x",
      "4":"y x",
      "5":"y x",
      "6":"y x",
      "7":"y x",
      "8":"y x",
      "9":"y x",
      "10":"y x",
      "11":"y x",
      "12":"y x",
      "13":"y x",
      "14":"y x",
      "15":"y x",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"y x",
      "11":"y x",
      "12":"y x",
      "13":"y x",
      "14":"y x",
      "15":"y x",
      "16":"y x",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"y x",
      "6":"y x",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"a x",
      "11.5":"a x",
      "11.6":"y x",
      "12":"y x",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"y x",
      "6.0-6.1":"y x",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"y x",
      "4.1":"y x",
      "4.2-4.3":"y x",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"y"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"a x",
      "11.5":"a x",
      "12":"y x",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y x"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"Firefox 10+, Chrome 26+ and Opera 11.6+ also support the new \"to (side)\" syntax.",
  "notes_by_num":{
    
  },
  "usage_perc_y":91.87,
  "usage_perc_a":0.01,
  "ucprefix":false,
  "parent":"css-gradients",
  "keywords":"repeating-linear-gradient,repeating-radial-gradient",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],111:[function(require,module,exports){
module.exports={
  "title":"CSS resize property",
  "description":"Method of allowing an element to be resized by the user, with options to limit to a given direction. ",
  "spec":"http://www.w3.org/TR/css3-ui/#resize",
  "status":"cr",
  "links":[
    {
      "url":"http://css-tricks.com/almanac/properties/r/resize/",
      "title":"CSS Tricks info"
    },
    {
      "url":"http://davidwalsh.name/textarea-resize",
      "title":"On textarea resizing"
    },
    {
      "url":"https://wpdev.uservoice.com/forums/257854-microsoft-edge-developer/suggestions/6513977-css-resize-property",
      "title":"Microsoft Edge feature request on UserVoice"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"y x",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"y",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"a #1",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Presto-based Opera 12.10+ currently only supports the resize property for textarea elements."
  },
  "usage_perc_y":62.2,
  "usage_perc_a":0.11,
  "ucprefix":false,
  "parent":"",
  "keywords":"horizontal,vertical",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],112:[function(require,module,exports){
module.exports={
  "title":"CSS revert value",
  "description":"A CSS keyword value that resets a property's value to the default specified by the browser in its UA stylesheet, as if the webpage had not included any CSS. For example, `display:revert` on a `<div>` would result in `display:block`. This is in contrast to the `initial` value, which is simply defined on a per-property basis, and for `display` would be `inline`.",
  "spec":"https://www.w3.org/TR/css-cascade-4/#valdef-all-revert",
  "status":"wd",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/revert",
      "title":"Mozilla Developer Network"
    },
    {
      "url":"https://bugzilla.mozilla.org/show_bug.cgi?id=1215878",
      "title":"Firefox feature request bug"
    },
    {
      "url":"https://wpdev.uservoice.com/forums/257854-microsoft-edge-developer/suggestions/10469316-the-css4-revert-value",
      "title":"Microsoft Edge feature request on UserVoice"
    },
    {
      "url":"https://code.google.com/p/chromium/issues/detail?id=579788",
      "title":"Chrome feature request issue"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n",
      "51":"n",
      "52":"n",
      "53":"n",
      "54":"n"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":8.68,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"CSS,reset,value",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],113:[function(require,module,exports){
module.exports={
  "title":"CSSOM Scroll-behavior",
  "description":"Method of specifying the scrolling behavior for a scrolling box, when scrolling happens due to navigation or CSSOM scrolling APIs.",
  "spec":"https://drafts.csswg.org/cssom-view/#propdef-scroll-behavior",
  "status":"wd",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/scroll-behavior",
      "title":"Mozilla Developer Network"
    },
    {
      "url":"https://code.google.com/p/chromium/issues/detail?id=243871",
      "title":"Chrome launch bug "
    },
    {
      "url":"https://blog.gospodarets.com/native_smooth_scrolling",
      "title":"Blog post with demo"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n d #1 #2",
      "42":"n d #1 #2",
      "43":"n d #1 #2",
      "44":"n d #1 #2",
      "45":"n d #1 #2",
      "46":"n d #1 #2",
      "47":"n d #1 #2",
      "48":"n d #1 #2",
      "49":"n d #1 #2",
      "50":"n d #1 #2",
      "51":"n d #1 #2",
      "52":"n d #1 #2",
      "53":"n d #1 #2",
      "54":"n d #1 #2"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n",
      "TP":"n"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n d #1 #2",
      "29":"n d #1 #2",
      "30":"n d #1 #2",
      "31":"n d #1 #2",
      "32":"n d #1 #2",
      "33":"n d #1 #2",
      "34":"n d #1 #2",
      "35":"n d #1 #2",
      "36":"n d #1 #2",
      "37":"n d #1 #2",
      "38":"n d #1 #2",
      "39":"n d #1 #2",
      "40":"n d #1 #2"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Partial support refers to support everything except of `Element.scrollIntoView()` and not together with pinch viewport.",
    "2":"Supported in Chrome and Opera behind the 'Smooth Scrolling' and/or 'Enable experimental web platform features' flag"
  },
  "usage_perc_y":7.39,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"smooth,scroll,cssom,scroll-behavior",
  "ie_id":"cssomviewsmoothscrollapi",
  "chrome_id":"5812155903377408",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],114:[function(require,module,exports){
module.exports={
  "title":"CSS scrollbar styling",
  "description":"Non-standard methods of styling scrollbars.",
  "spec":"https://webkit.org/blog/363/styling-scrollbars/",
  "status":"unoff",
  "links":[
    {
      "url":"https://bugzilla.mozilla.org/show_bug.cgi?id=77790",
      "title":"Firefox support bug"
    },
    {
      "url":"http://stackoverflow.com/questions/9251354/css-customized-scroll-bar-in-div/14150577#14150577",
      "title":"Stackoverflow article discussiong cross-browser support"
    },
    {
      "url":"http://codemug.com/html/custom-scrollbars-using-css/",
      "title":"Tutorial for IE & WebKit/Blink browsers"
    },
    {
      "url":"https://noraesae.github.io/perfect-scrollbar/",
      "title":"\"perfect-scrollbar\" - Minimal custom scrollbar plugin"
    },
    {
      "url":"http://manos.malihu.gr/jquery-custom-content-scroller/",
      "title":"jQuery custom content scroller"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"a #1",
      "6":"a #1",
      "7":"a #1",
      "8":"a #1",
      "9":"a #1",
      "10":"a #1",
      "11":"a #1"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"n"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n"
    },
    "chrome":{
      "4":"y x #2",
      "5":"y x #2",
      "6":"y x #2",
      "7":"y x #2",
      "8":"y x #2",
      "9":"y x #2",
      "10":"y x #2",
      "11":"y x #2",
      "12":"y x #2",
      "13":"y x #2",
      "14":"y x #2",
      "15":"y x #2",
      "16":"y x #2",
      "17":"y x #2",
      "18":"y x #2",
      "19":"y x #2",
      "20":"y x #2",
      "21":"y x #2",
      "22":"y x #2",
      "23":"y x #2",
      "24":"y x #2",
      "25":"y x #2",
      "26":"y x #2",
      "27":"y x #2",
      "28":"y x #2",
      "29":"y x #2",
      "30":"y x #2",
      "31":"y x #2",
      "32":"y x #2",
      "33":"y x #2",
      "34":"y x #2",
      "35":"y x #2",
      "36":"y x #2",
      "37":"y x #2",
      "38":"y x #2",
      "39":"y x #2",
      "40":"y x #2",
      "41":"y x #2",
      "42":"y x #2",
      "43":"y x #2",
      "44":"y x #2",
      "45":"y x #2",
      "46":"y x #2",
      "47":"y x #2",
      "48":"y x #2",
      "49":"y x #2",
      "50":"y x #2",
      "51":"y x #2",
      "52":"y x #2",
      "53":"y x #2",
      "54":"y x #2"
    },
    "safari":{
      "3.1":"u",
      "3.2":"u",
      "4":"u",
      "5":"u",
      "5.1":"y x #2",
      "6":"y x #2",
      "6.1":"y x #2",
      "7":"y x #2",
      "7.1":"y x #2",
      "8":"y x #2",
      "9":"y x #2",
      "9.1":"y x #2",
      "10":"y x #2",
      "TP":"y x #2"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"y x #2",
      "16":"y x #2",
      "17":"y x #2",
      "18":"y x #2",
      "19":"y x #2",
      "20":"y x #2",
      "21":"y x #2",
      "22":"y x #2",
      "23":"y x #2",
      "24":"y x #2",
      "25":"y x #2",
      "26":"y x #2",
      "27":"y x #2",
      "28":"y x #2",
      "29":"y x #2",
      "30":"y x #2",
      "31":"y x #2",
      "32":"y x #2",
      "33":"y x #2",
      "34":"y x #2",
      "35":"y x #2",
      "36":"y x #2",
      "37":"y x #2",
      "38":"y x #2",
      "39":"y x #2",
      "40":"y x #2"
    },
    "ios_saf":{
      "3.2":"u",
      "4.0-4.1":"u",
      "4.2-4.3":"u",
      "5.0-5.1":"u",
      "6.0-6.1":"u",
      "7.0-7.1":"y x #2",
      "8":"y x #2",
      "8.1-8.4":"y x #2",
      "9.0-9.2":"y x #2",
      "9.3":"y x #2"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"u",
      "2.2":"u",
      "2.3":"y x #2",
      "3":"y x #2",
      "4":"y x #2",
      "4.1":"y x #2",
      "4.2-4.3":"y x #2",
      "4.4":"y x #2",
      "4.4.3-4.4.4":"y x #2",
      "50":"y x #2"
    },
    "bb":{
      "7":"y x #2",
      "10":"y x #2"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y x #2"
    },
    "and_chr":{
      "50":"y x #2"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"y x #2"
    },
    "samsung":{
      "4":"y x #2"
    }
  },
  "notes":"Currently scrollbar styling doesn't appear to be on any standards track.",
  "notes_by_num":{
    "1":"Only supports styling [scrollbar colors](https://msdn.microsoft.com/en-us/library/ms531155%28v=vs.85%29.aspx), no other properties to define the scrollbar's appearance.",
    "2":"Supports scrollbar styling via CSS [pseudo-properties](https://webkit.org/blog/363/styling-scrollbars/)."
  },
  "usage_perc_y":76.12,
  "usage_perc_a":6.42,
  "ucprefix":false,
  "parent":"",
  "keywords":"scrollbar-button,scrollbar-track,scrollbar-thumb,scrollbar-base-color,scrollbar-face-color",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],115:[function(require,module,exports){
module.exports={
  "title":"CSS 2.1 selectors",
  "description":"Basic CSS selectors including: `*` (universal selector), `>` (child selector), `:first-child`, `:link`, `:visited`, `:active`, `:hover`, `:focus`, `:lang()`, `+` (adjacent sibling selector), `[attr]`, `[attr=\"val\"]`, `[attr~=\"val\"]`, `[attr|=\"bar\"]`, `.foo` (class selector), `#foo` (id selector)",
  "spec":"http://www.w3.org/TR/CSS21/selector.html",
  "status":"rec",
  "links":[
    {
      "url":"http://www.quirksmode.org/css/contents.html",
      "title":"Detailed support information"
    },
    {
      "url":"http://www.yourhtmlsource.com/stylesheets/advancedselectors.html",
      "title":"Examples of advanced selectors"
    },
    {
      "url":"http://selectivizr.com",
      "title":"Selectivizr: Polyfill for IE6-8"
    },
    {
      "url":"http://docs.webplatform.org/wiki/css/selectors",
      "title":"WebPlatform Docs"
    }
  ],
  "bugs":[
    {
      "description":"IE7 doesn't support all pseudo classes (like :focus) or pseudo elements (like :before and :after)"
    },
    {
      "description":":first-child fails in IE7 if the [first child is a comment](http://robertnyman.com/2009/02/04/how-to-solve-first-child-css-bug-in-ie-7/)."
    },
    {
      "description":"Safari 5.1 and Android browsers do not support the adjacent selector if the adjacent element is a \"nav\" element."
    },
    {
      "description":"IE8-11 [does not update an element's :hover status when scrolling without moving the pointer](https://connect.microsoft.com/IE/feedback/details/926665/ie-11-hovering-over-an-element-and-then-scrolling-without-moving-the-mouse-pointer-leaves-the-element-in-hover-state)."
    },
    {
      "description":"IE6 does not properly support combinations of pseudo classes like `:link`, `:active` and `:visited`"
    },
    {
      "description":"In IE10 adjacent sibling selector doesn't work with pseudo-class in case of `E:active F`."
    }
  ],
  "categories":[
    "CSS2"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"p",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"y",
      "3":"y",
      "3.5":"y",
      "3.6":"y",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"y",
      "3.2":"y",
      "4":"y",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"y",
      "9.5-9.6":"y",
      "10.0-10.1":"y",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"y",
      "4.0-4.1":"y",
      "4.2-4.3":"y",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"y"
    },
    "android":{
      "2.1":"y",
      "2.2":"y",
      "2.3":"y",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"Support for `:visited` styling [varies across browsers](http://sixrevisions.com/css/visited-pseudo-class-strange/) due to security concerns.",
  "notes_by_num":{
    
  },
  "usage_perc_y":98,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"attribute selector",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],116:[function(require,module,exports){
module.exports={
  "title":"CSS3 selectors",
  "description":"Advanced element selection using selectors including: `[foo^=\"bar\"]`, `[foo$=\"bar\"]`, `[foo*=\"bar\"]`, `:root`, `:nth-child()`,  `:nth-last-child()`, `nth-of-type`, `nth-last-of-type()`, `:last-child`, `:first-of-type`, `:last-of-type`, `:only-child`, `:only-of-type`, `:empty`, `:target`, `:enabled`, `:disabled`, `:checked`, `:not()`, `~` (general sibling)",
  "spec":"http://www.w3.org/TR/css3-selectors/",
  "status":"rec",
  "links":[
    {
      "url":"http://www.quirksmode.org/css/selectors/",
      "title":"Detailed support information"
    },
    {
      "url":"http://www.css3.info/selectors-test/",
      "title":"Automated CSS3 selector test"
    },
    {
      "url":"http://selectivizr.com",
      "title":"Selectivizr: Polyfill for IE6-8"
    },
    {
      "url":"http://docs.webplatform.org/wiki/css/selectors",
      "title":"WebPlatform Docs"
    }
  ],
  "bugs":[
    {
      "description":"Android 4.3 and lower (together with older WebKit browsers) [have issues](http://css-tricks.com/webkit-sibling-bug/) when combining pseudo classes with adjacent or general sibling selectors."
    },
    {
      "description":"iOS 8 Safari has [issues with nth-child](http://stackoverflow.com/questions/26032513/ios8-safari-after-a-pushstate-the-nth-child-selectors-not-works).\r\n"
    },
    {
      "description":"IE9-IE11 supports `:empty` but will not repaint/relayout the page if content is added/removed from an `:empty` selected element"
    },
    {
      "description":"iOS 9 has a bug in WebViews (not Safari) with the [CSS sibling selector](https://forums.developer.apple.com/thread/16449)"
    }
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"p",
      "7":"a #1",
      "8":"a #1",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"y",
      "3.6":"y",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"y",
      "4":"y",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"y",
      "10.0-10.1":"y",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"y",
      "4.0-4.1":"y",
      "4.2-4.3":"y",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"y"
    },
    "android":{
      "2.1":"y",
      "2.2":"y",
      "2.3":"y",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"IE7 and IE8 support only these CSS3 selectors: General siblings (`element1~element2`) and Attribute selectors `[attr^=val]`, `[attr$=val]`, and `[attr*=val]`"
  },
  "usage_perc_y":97.26,
  "usage_perc_a":0.66,
  "ucprefix":false,
  "parent":"",
  "keywords":"",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],117:[function(require,module,exports){
module.exports={
  "title":"::selection CSS pseudo-element",
  "description":"The ::selection CSS pseudo-element applies rules to the portion of a document that has been highlighted (e.g., selected with the mouse or another pointing device) by the user.",
  "spec":"http://www.w3.org/TR/css-pseudo-4/#selectordef-selection",
  "status":"wd",
  "links":[
    {
      "url":"http://quirksmode.org/css/selectors/selection.html",
      "title":"::selection test"
    },
    {
      "url":"http://docs.webplatform.org/wiki/css/selectors/pseudo-elements/::selection",
      "title":"WebPlatform Docs"
    }
  ],
  "bugs":[
    {
      "description":"In Safari `::selection` styles do not work in combination with CSS multi-column."
    }
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"y x",
      "3":"y x",
      "3.5":"y x",
      "3.6":"y x",
      "4":"y x",
      "5":"y x",
      "6":"y x",
      "7":"y x",
      "8":"y x",
      "9":"y x",
      "10":"y x",
      "11":"y x",
      "12":"y x",
      "13":"y x",
      "14":"y x",
      "15":"y x",
      "16":"y x",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y x",
      "27":"y x",
      "28":"y x",
      "29":"y x",
      "30":"y x",
      "31":"y x",
      "32":"y x",
      "33":"y x",
      "34":"y x",
      "35":"y x",
      "36":"y x",
      "37":"y x",
      "38":"y x",
      "39":"y x",
      "40":"y x",
      "41":"y x",
      "42":"y x",
      "43":"y x",
      "44":"y x",
      "45":"y x",
      "46":"y x",
      "47":"y x",
      "48":"y x",
      "49":"y x",
      "50":"y x"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"y",
      "3.2":"y",
      "4":"y",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"y",
      "10.0-10.1":"y",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"y"
    },
    "op_mob":{
      "10":"u",
      "11":"u",
      "11.1":"u",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y x"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":76.03,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"::selection,selection",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],118:[function(require,module,exports){
module.exports={
  "title":"CSS Shapes Level 1",
  "description":"Allows geometric shapes to be set in CSS to define an area for text to flow around.",
  "spec":"http://www.w3.org/TR/css-shapes/",
  "status":"cr",
  "links":[
    {
      "url":"http://html.adobe.com/webplatform/layout/shapes/",
      "title":"Adobe demos and samples"
    },
    {
      "url":"http://html.adobe.com/webplatform/layout/shapes/browser-support/",
      "title":"CSS shapes support test by Adobe"
    },
    {
      "url":"http://alistapart.com/article/css-shapes-101",
      "title":"A List Apart article"
    },
    {
      "url":"https://bugzilla.mozilla.org/show_bug.cgi?id=1040714",
      "title":"Firefox tracking bug"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n d #1",
      "35":"n d #1",
      "36":"n d #1",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"y x",
      "8":"y x",
      "9":"y x",
      "9.1":"y x",
      "10":"y x",
      "TP":"y x"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"y x",
      "8.1-8.4":"y x",
      "9.0-9.2":"y x",
      "9.3":"y x"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Enabled in Chrome through the \"experimental Web Platform features\" flag in chrome://flags"
  },
  "usage_perc_y":63.27,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"circle,ellipse,polygon,inset,shape-outside,shape-inside",
  "ie_id":"shapes",
  "chrome_id":"5163890719588352",
  "firefox_id":"css-shapes",
  "webkit_id":"feature-css-shapes-level-1",
  "shown":true
}

},{}],119:[function(require,module,exports){
module.exports={
  "title":"CSS Scroll snap points",
  "description":"CSS technique that allows customizable scrolling experiences like pagination of carousels by setting defined snap points.",
  "spec":"http://www.w3.org/TR/css-snappoints-1/",
  "status":"wd",
  "links":[
    {
      "url":"http://generatedcontent.org/post/66817675443/setting-native-like-scrolling-offsets-in-css-with",
      "title":"Blog post"
    },
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Scroll_Snap_Points",
      "title":"MDN Documentation for CSS Scroll snap points"
    },
    {
      "url":"https://github.com/ckrack/scrollsnap-polyfill",
      "title":"Polyfill"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"a x #1",
      "11":"a x #2"
    },
    "edge":{
      "12":"a x #2",
      "13":"a x #2",
      "14":"a x #2"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n",
      "51":"n",
      "52":"n",
      "53":"n",
      "54":"n"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"a x #4",
      "9.1":"a x #4",
      "10":"a x #4",
      "TP":"a x #4"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"y x",
      "9.3":"y x"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"Works in the iOS WKWebView, but not UIWebView.",
  "notes_by_num":{
    "1":"Partial support in IE10 refers to support limited to touch screens.",
    "2":"Partial support in IE11 [documented here](https://dl.dropboxusercontent.com/u/444684/openwebref/CSS/scroll-snap-points/support.html)",
    "3":"Can be enabled in Firefox using the `layout.css.scroll-snap.enabled` flag in `about:config`",
    "4":"Partial support in Safari refers to not supporting the `none` keyword in `scroll-snap-points-x`, `scroll-snap-points-y` and `scroll-snap-coordinate`, and length keywords (`top`, `right`, etc.) in `scroll-snap-destination` and `scroll-snap-coordinate`."
  },
  "usage_perc_y":15.3,
  "usage_perc_a":8.67,
  "ucprefix":false,
  "parent":"",
  "keywords":"scroll-snap-points-x,scroll-snap-points-y,scroll-snap-type,scroll-snap-destination,scroll-snap-coordinate",
  "ie_id":"cssscrollingsnappoints",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"specification-css-scroll-snap-points-module-level-1",
  "shown":true
}

},{}],120:[function(require,module,exports){
module.exports={
  "title":"CSS position:sticky",
  "description":"Keeps elements positioned as \"fixed\" or \"relative\" depending on how it appears in the viewport. As a result the element is \"stuck\" when necessary while scrolling.",
  "spec":"https://drafts.csswg.org/css-position/#sticky-pos",
  "status":"unoff",
  "links":[
    {
      "url":"http://updates.html5rocks.com/2012/08/Stick-your-landings-position-sticky-lands-in-WebKit",
      "title":"HTML5Rocks"
    },
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/position",
      "title":"MDN article"
    },
    {
      "url":"http://docs.webplatform.org/wiki/css/properties/position",
      "title":"WebPlatform Docs"
    },
    {
      "url":"https://github.com/filamentgroup/fixed-sticky",
      "title":"Polyfill"
    },
    {
      "url":"https://github.com/wilddeer/stickyfill",
      "title":"Another polyfill"
    }
  ],
  "bugs":[
    {
      "description":"Firefox and Safari 7 & below do not appear to support [sticky table headers](http://jsfiddle.net/Mf4YT/2/). (see also [Firefox bug](https://bugzilla.mozilla.org/show_bug.cgi?id=975644))"
    },
    {
      "description":"A parent with overflow set to `auto` will prevent `position: sticky` from working in Safari"
    }
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n d #1",
      "27":"n d #1",
      "28":"n d #1",
      "29":"n d #1",
      "30":"n d #1",
      "31":"n d #1",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n d #2",
      "24":"n d #2",
      "25":"n d #2",
      "26":"n d #2",
      "27":"n d #2",
      "28":"n d #2",
      "29":"n d #2",
      "30":"n d #2",
      "31":"n d #2",
      "32":"n d #2",
      "33":"n d #2",
      "34":"n d #2",
      "35":"n d #2",
      "36":"n d #2",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n",
      "51":"n",
      "52":"n d #2",
      "53":"n d #2",
      "54":"n d #2"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"y x",
      "7":"y x",
      "7.1":"y x",
      "8":"y x",
      "9":"y x",
      "9.1":"y x",
      "10":"y x",
      "TP":"y x"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n d #2",
      "40":"n d #2"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"y x",
      "7.0-7.1":"y x",
      "8":"y x",
      "8.1-8.4":"y x",
      "9.0-9.2":"y x",
      "9.3":"y x"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Can be enabled in Firefox by setting the about:config preference layout.css.sticky.enabled to true",
    "2":"Enabled through the \"experimental Web Platform features\" flag"
  },
  "usage_perc_y":18.67,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"",
  "ie_id":"positionsticky",
  "chrome_id":"6190250464378880",
  "firefox_id":"",
  "webkit_id":"feature-position:-sticky",
  "shown":true
}

},{}],121:[function(require,module,exports){
module.exports={
  "title":"CSS.supports() API",
  "description":"The CSS.supports() static methods returns a Boolean value indicating if the browser supports a given CSS feature, or not.",
  "spec":"http://dev.w3.org/csswg/css-conditional/#the-css-interface",
  "status":"cr",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/API/CSS.supports",
      "title":"MDN Docs"
    },
    {
      "url":"http://jsbin.com/rimevilotari/1/edit",
      "title":"Demo (Chinese)"
    },
    {
      "url":"https://dev.opera.com/articles/native-css-feature-detection/",
      "title":"Native CSS Feature Detection via the @supports Rule"
    },
    {
      "url":"http://davidwalsh.name/css-supports",
      "title":"CSS @supports"
    },
    {
      "url":"http://blog.csdn.net/hfahe/article/details/8619480",
      "title":"Article (Chinese)"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "DOM",
    "JS API"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n d",
      "21":"n d",
      "22":"n d",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"y #1",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"See also [@supports in CSS](#feat=css-featurequeries)\r\n\r\nSee the [WebKit Bug](http://trac.webkit.org/changeset/142739) for status in Safari",
  "notes_by_num":{
    "1":"Opera 12 uses a different method name('window.supportsCSS')"
  },
  "usage_perc_y":76.3,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"conditional",
  "ie_id":"conditionalrules",
  "chrome_id":"4993981813358592",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],122:[function(require,module,exports){
module.exports={
  "title":"CSS Table display",
  "description":"Method of displaying elements as tables, rows, and cells. Includes support for all `display: table-*` properties as well as `display: inline-table`",
  "spec":"http://www.w3.org/TR/CSS21/tables.html",
  "status":"rec",
  "links":[
    {
      "url":"http://www.onenaught.com/posts/201/use-css-displaytable-for-layout",
      "title":"Blog post on usage"
    }
  ],
  "bugs":[
    {
      "description":"Safari 5.1.17 has a bug in when using an element with display:table, with padding and width.  It seems to force the use of the border-box model instead of the content-box model.  Chrome 21.0 however works correctly, making it difficult to resolve with CSS alone."
    },
    {
      "description":"Firefox has had a bug with `position: relative` in table cells, which was fixed in version 37."
    }
  ],
  "categories":[
    "CSS2"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"a #1",
      "3":"y",
      "3.5":"y",
      "3.6":"y",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"y",
      "3.2":"y",
      "4":"y",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"y",
      "9.5-9.6":"y",
      "10.0-10.1":"y",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"y",
      "4.0-4.1":"y",
      "4.2-4.3":"y",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"y"
    },
    "android":{
      "2.1":"y",
      "2.2":"y",
      "2.3":"y",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Firefox 2 does not support `inline-table`"
  },
  "usage_perc_y":97.94,
  "usage_perc_a":0.02,
  "ucprefix":false,
  "parent":"",
  "keywords":"display:table,table-cell,table-row,table-layout",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],123:[function(require,module,exports){
module.exports={
  "title":"CSS3 text-align-last",
  "description":"CSS property to describe how the last line of a block or a line right before a forced line break when `text-align` is `justify`.",
  "spec":"http://www.w3.org/TR/css3-text/#text-align-last-property",
  "status":"wd",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/text-align-last",
      "title":"MDN text-align-last"
    },
    {
      "url":"http://blogs.adobe.com/webplatform/2014/02/25/improving-your-sites-visual-details-css3-text-align-last/",
      "title":"Adobe Web Platform Article"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"a #1",
      "6":"a #1",
      "7":"a #1",
      "8":"a #1",
      "9":"a #1",
      "10":"a #1",
      "11":"a #1"
    },
    "edge":{
      "12":"a",
      "13":"a",
      "14":"a"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"y x",
      "13":"y x",
      "14":"y x",
      "15":"y x",
      "16":"y x",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y x",
      "27":"y x",
      "28":"y x",
      "29":"y x",
      "30":"y x",
      "31":"y x",
      "32":"y x",
      "33":"y x",
      "34":"y x",
      "35":"y x",
      "36":"y x",
      "37":"y x",
      "38":"y x",
      "39":"y x",
      "40":"y x",
      "41":"y x",
      "42":"y x",
      "43":"y x",
      "44":"y x",
      "45":"y x",
      "46":"y x",
      "47":"y x",
      "48":"y x",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n d #2",
      "36":"n d #2",
      "37":"n d #2",
      "38":"n d #2",
      "39":"n d #2",
      "40":"n d #2",
      "41":"n d #2",
      "42":"n d #2",
      "43":"n d #2",
      "44":"n d #2",
      "45":"n d #2",
      "46":"n d #2",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n",
      "TP":"n"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n d #3",
      "23":"n d #3",
      "24":"n d #3",
      "25":"n d #3",
      "26":"n d #3",
      "27":"n d #3",
      "28":"n d #3",
      "29":"n d #3",
      "30":"n d #3",
      "31":"n d #3",
      "32":"n d #3",
      "33":"n d #3",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y x"
    },
    "ie_mob":{
      "10":"a #1",
      "11":"a #1"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"In Internet Explorer, the start and end values are not supported.",
    "2":"Enabled through the \"Enable Experimental Web Platform Features\" flag in chrome://flags",
    "3":"Enabled through the \"Enable Experimental Web Platform Features\" flag in opera://flags"
  },
  "usage_perc_y":55.58,
  "usage_perc_a":8.66,
  "ucprefix":false,
  "parent":"",
  "keywords":"text align last",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],124:[function(require,module,exports){
module.exports={
  "title":"CSS text-justify",
  "description":"CSS property to define how text should be justified when `text-align: justify` is set.",
  "spec":"https://drafts.csswg.org/css-text-3/#text-justify-property",
  "status":"wd",
  "links":[
    {
      "url":"https://crbug.com/248894",
      "title":"Chrome support bug"
    },
    {
      "url":"https://bugs.webkit.org/show_bug.cgi?id=99945",
      "title":"WebKit support bug"
    },
    {
      "url":"https://bugzilla.mozilla.org/show_bug.cgi?id=276079",
      "title":"Firefox support bug"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"u",
      "6":"u",
      "7":"u",
      "8":"a #1",
      "9":"a #1",
      "10":"a #1",
      "11":"a #1"
    },
    "edge":{
      "12":"a #1",
      "13":"a #1",
      "14":"a #1"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"u",
      "49":"u",
      "50":"u"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n d #2",
      "44":"n d #2",
      "45":"n d #2",
      "46":"n d #2",
      "47":"n d #2",
      "48":"n d #2",
      "49":"n d #2",
      "50":"n d #2",
      "51":"n d #2",
      "52":"n d #2",
      "53":"n d #2",
      "54":"n d #2"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n",
      "TP":"n"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n d #2",
      "31":"n d #2",
      "32":"n d #2",
      "33":"n d #2",
      "34":"n d #2",
      "35":"n d #2",
      "36":"n d #2",
      "37":"n d #2",
      "38":"n d #2",
      "39":"n d #2",
      "40":"n d #2"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n d #2"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n d #2"
    },
    "and_chr":{
      "50":"n d #2"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"a #1",
      "11":"a #1"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Supports `inter-word`, but not `inter-character` or  `none`. Also supports the following unofficial values: `distribute` , `distribute-all-lines`, `distribute-center-last`, `inter-cluster`, `inter-ideograph`, `newspaper`. See [MSDN](https://msdn.microsoft.com/en-us/library/ms531172%28v=vs.85%29.aspx) for details.",
    "2":"`inter-word` and `distribute` values supported behind the \"Experimental platform features\" flag but `distribute` support [is buggy](https://crbug.com/467406)"
  },
  "usage_perc_y":0,
  "usage_perc_a":8.58,
  "ucprefix":false,
  "parent":"",
  "keywords":"",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],125:[function(require,module,exports){
module.exports={
  "title":"CSS Text 4 text-spacing",
  "description":"This property controls spacing between adjacent characters on the same line within the same inline formatting context using a set of character-class-based rules.",
  "spec":"https://drafts.csswg.org/css-text-4/#text-spacing-property",
  "status":"wd",
  "links":[
    {
      "url":"https://msdn.microsoft.com/library/ms531164(v=vs.85).aspx",
      "title":"MSDN page"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"y x #1",
      "9":"y x #1",
      "10":"y x #1",
      "11":"y x #1"
    },
    "edge":{
      "12":"y x #1",
      "13":"y x #1",
      "14":"y x #1"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n",
      "51":"n",
      "52":"n",
      "53":"n",
      "54":"n"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n",
      "TP":"n"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"u",
      "11":"u"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"IE accepts -ms-text-autospace property"
  },
  "usage_perc_y":7.83,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":false
}

},{}],126:[function(require,module,exports){
module.exports={
  "title":"CSS3 Text-shadow",
  "description":"Method of applying one or more shadow or blur effects to text",
  "spec":"http://www.w3.org/TR/css-text-decor-3/#text-shadow-property",
  "status":"cr",
  "links":[
    {
      "url":"http://hacks.mozilla.org/2009/06/text-shadow/",
      "title":"Mozilla hacks article"
    },
    {
      "url":"https://testdrive-archive.azurewebsites.net/Graphics/hands-on-css3/hands-on_text-shadow.htm",
      "title":"Live editor"
    },
    {
      "url":"http://www.css3files.com/shadow/#textshadow",
      "title":"Information page"
    },
    {
      "url":"http://docs.webplatform.org/wiki/css/properties/text-shadow",
      "title":"WebPlatform Docs"
    }
  ],
  "bugs":[
    {
      "description":"According to http://code.google.com/p/android/issues/detail?id=7531, text-shadow doesn't work on Android (at least 2.3, from testing) when the blur-radius is 0."
    },
    {
      "description":"IE10 doesn't seem to render rgba(255,255,255,0.25) properly. It seems to ignore the alpha value and uses 100% white instead."
    },
    {
      "description":"Safari 5.1 requires a color to be defined for the shadow."
    }
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"y #1",
      "11":"y #1"
    },
    "edge":{
      "12":"y #1",
      "13":"y #1",
      "14":"y #1"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"y",
      "3.6":"y",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"a #2",
      "3.2":"a #2",
      "4":"y",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"y",
      "10.0-10.1":"y",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"y",
      "4.0-4.1":"y",
      "4.2-4.3":"y",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"a"
    },
    "android":{
      "2.1":"y",
      "2.2":"y",
      "2.3":"y",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"a",
      "10":"y"
    },
    "op_mob":{
      "10":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y #1",
      "11":"y #1"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"Opera Mini ignores the blur-radius set, so no blur effect is visible. Text-shadow behavior can be somewhat emulated in older IE versions using the non-standard \"dropshadow\" or \"glow\" filters.",
  "notes_by_num":{
    "1":"IE 10+ supports a fourth length value for the shadow's \"spread\". This is not (yet) part of the specification.",
    "2":"Partial support in Safari 3.* refers to not supporting multiple shadows."
  },
  "usage_perc_y":92.06,
  "usage_perc_a":4.78,
  "ucprefix":false,
  "parent":"",
  "keywords":"text shadow",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],127:[function(require,module,exports){
module.exports={
  "title":"CSS touch-action property",
  "description":"touch-action is a CSS property that controls filtering of gesture events, providing developers with a declarative mechanism to selectively disable touch scrolling (in one or both axes), pinch-zooming or double-tap-zooming.",
  "spec":"http://www.w3.org/TR/pointerevents/#the-touch-action-css-property",
  "status":"rec",
  "links":[
    {
      "url":"http://msdn.microsoft.com/en-us/library/windows/apps/hh767313.aspx",
      "title":"MSDN Docs"
    },
    {
      "url":"http://updates.html5rocks.com/2013/12/300ms-tap-delay-gone-away",
      "title":"300ms tap delay, gone away"
    },
    {
      "url":"http://blogs.telerik.com/appbuilder/posts/13-11-21/what-exactly-is.....-the-300ms-click-delay",
      "title":"What Exactly Is..... The 300ms Click Delay"
    },
    {
      "url":"http://thx.github.io/mobile/300ms-click-delay/",
      "title":"What Exactly Is..... The 300ms Click Delay (Chinese)"
    },
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/touch-action",
      "title":"Mozilla Developer Network"
    },
    {
      "url":"https://bugs.webkit.org/show_bug.cgi?id=149854",
      "title":"WebKit bug 149854: Implement touch-action: manipulation; for iOS"
    },
    {
      "url":"https://bugs.webkit.org/show_bug.cgi?id=133112",
      "title":"WebKit bug 133112: touch-action CSS property support"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"y x #2",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n d #1",
      "30":"n d #1",
      "31":"n d #1",
      "32":"n d #1",
      "33":"n d #1",
      "34":"n d #1",
      "35":"n d #1",
      "36":"n d #1",
      "37":"n d #1",
      "38":"n d #1",
      "39":"n d #1",
      "40":"n d #1",
      "41":"n d #1",
      "42":"n d #1",
      "43":"n d #1",
      "44":"n d #1",
      "45":"n d #1",
      "46":"n d #1",
      "47":"n d #1",
      "48":"n d #1",
      "49":"n d #1",
      "50":"n d #1"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"y x #2",
      "11":"y"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"Safari supports only `manipulation`, Chrome - `manipulation`, `pan-x`, `pan-y` and `none`.",
  "notes_by_num":{
    "1":"Supported in Firefox behind the `layout.css.touch_action.enabled` flag, Firefox for Windows 8 Touch ('Metro') enabled by default.",
    "2":"IE10+ has already supported these property which are not in standard at present such as'pinch-zoom','double-tap-zoom','cross-slide-x','cross-slide-y'."
  },
  "usage_perc_y":68.81,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"touch action",
  "ie_id":"csstouchaction",
  "chrome_id":"5912074022551552",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],128:[function(require,module,exports){
module.exports={
  "title":"CSS3 Transitions",
  "description":"Simple method of animating certain properties of an element, with ability to define property, duration, delay and timing function. ",
  "spec":"http://www.w3.org/TR/css3-transitions/",
  "status":"wd",
  "links":[
    {
      "url":"http://www.webdesignerdepot.com/2010/01/css-transitions-101/",
      "title":"Article on usage"
    },
    {
      "url":"http://www.css3files.com/transition/",
      "title":"Information page"
    },
    {
      "url":"http://www.the-art-of-web.com/css/timing-function/",
      "title":"Examples on timing functions"
    },
    {
      "url":"http://www.opera.com/docs/specs/presto2.12/css/transitions/",
      "title":"Animation of property types support in Opera"
    },
    {
      "url":"http://docs.webplatform.org/wiki/css/properties/transition",
      "title":"WebPlatform Docs"
    }
  ],
  "bugs":[
    {
      "description":"Not supported on any pseudo-elements besides ::before and ::after for Firefox, Chrome 26+, Opera 16+ and IE10+."
    },
    {
      "description":"Transitionable properties with calc() derived values are not supported below and including IE11 (http://connect.microsoft.com/IE/feedback/details/762719/css3-calc-bug-inside-transition-or-transform)"
    },
    {
      "description":"'background-size' is not supported below and including IE10"
    },
    {
      "description":"IE11 [does not support](https://connect.microsoft.com/IE/feedbackdetail/view/920928/ie-11-css-transition-property-not-working-for-svg-elements) CSS transitions on the SVG `fill` property."
    },
    {
      "description":"In Chrome (up to 43.0), for transition-delay property, either explicitly specified or written within transition property, the unit cannot be ommitted even if the value is 0."
    },
    {
      "description":"IE10 & IE11 are reported to not support transitioning the `column-count` property."
    }
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"y x",
      "5":"y x",
      "6":"y x",
      "7":"y x",
      "8":"y x",
      "9":"y x",
      "10":"y x",
      "11":"y x",
      "12":"y x",
      "13":"y x",
      "14":"y x",
      "15":"y x",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y x",
      "5":"y x",
      "6":"y x",
      "7":"y x",
      "8":"y x",
      "9":"y x",
      "10":"y x",
      "11":"y x",
      "12":"y x",
      "13":"y x",
      "14":"y x",
      "15":"y x",
      "16":"y x",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"y x",
      "3.2":"y x",
      "4":"y x",
      "5":"y x",
      "5.1":"y x",
      "6":"y x",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"y x",
      "10.6":"y x",
      "11":"y x",
      "11.1":"y x",
      "11.5":"y x",
      "11.6":"y x",
      "12":"y x",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"y x",
      "4.0-4.1":"y x",
      "4.2-4.3":"y x",
      "5.0-5.1":"y x",
      "6.0-6.1":"y x",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"y x",
      "2.2":"y x",
      "2.3":"y x",
      "3":"y x",
      "4":"y x",
      "4.1":"y x",
      "4.2-4.3":"y x",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y x",
      "10":"y"
    },
    "op_mob":{
      "10":"y x",
      "11":"y x",
      "11.1":"y x",
      "11.5":"y x",
      "12":"y x",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y x"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"Support listed is for `transition` properties as well as the `transitionend` event. The prefixed name in WebKit browsers is `webkitTransitionEnd`",
  "notes_by_num":{
    
  },
  "usage_perc_y":92.08,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"css transition,transitionend,transition-property,transition-duration,transition-timing-function,transition-delay",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],129:[function(require,module,exports){
module.exports={
  "title":"CSS unset value",
  "description":"A CSS value that's the same as \"inherit\" if a property is inherited or \"initial\" if a property is not inherited.",
  "spec":"http://www.w3.org/TR/css-cascade-3/#inherit-initial",
  "status":"cr",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/unset",
      "title":"Mozilla Developer Network"
    },
    {
      "url":"http://mcc.id.au/blog/2013/10/all-unset",
      "title":"Resetting styles using `all: unset`"
    },
    {
      "url":"https://bugs.webkit.org/show_bug.cgi?id=148614",
      "title":"WebKit bug 148614: Add support for the `unset` CSS property value"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":69.69,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"CSS,unset,value",
  "ie_id":"cssunsetvalue",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],130:[function(require,module,exports){
module.exports={
  "title":"CSS Variables (Custom Properties)",
  "description":"Permits the declaration and usage of cascading variables in stylesheets.",
  "spec":"https://drafts.csswg.org/css-variables/",
  "status":"cr",
  "links":[
    {
      "url":"https://hacks.mozilla.org/2013/12/css-variables-in-firefox-nightly/",
      "title":"Mozilla hacks article (older syntax)"
    },
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_variables",
      "title":"MDN article"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n d #1",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n d #1",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Enabled through the \"Experimental Web Platform features\" flag in `chrome://flags`"
  },
  "usage_perc_y":63.39,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"css variables,custom properties",
  "ie_id":"cssvariables",
  "chrome_id":"6401356696911872",
  "firefox_id":"css-variables",
  "webkit_id":"specification-css-variables",
  "shown":true
}

},{}],131:[function(require,module,exports){
module.exports={
  "title":"CSS widows & orphans",
  "description":"CSS properties to control when lines break across pages or columns by defining the amount of lines that must be left before or after the break.",
  "spec":"https://drafts.csswg.org/css-break-3/#widows-orphans",
  "status":"rec",
  "links":[
    {
      "url":"http://thenewcode.com/946/CSS-last-line-Controlling-Widows-amp-Orphans",
      "title":"CSS last-line: Controlling Widows & Orphans"
    },
    {
      "url":"https://bugzilla.mozilla.org/show_bug.cgi?id=137367",
      "title":"Firefox support bug"
    },
    {
      "url":"http://tympanus.net/codrops/css_reference/orphans/",
      "title":"codrops article on orphans"
    },
    {
      "url":"http://tympanus.net/codrops/css_reference/widows/",
      "title":"codrops article on widows"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"y #1",
      "9":"y #1",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"u",
      "49":"u",
      "50":"u"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"y #1",
      "9.5-9.6":"y #1",
      "10.0-10.1":"y #1",
      "10.5":"y #1",
      "10.6":"y #1",
      "11":"y #1",
      "11.1":"y #1",
      "11.5":"y #1",
      "11.6":"y #1",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"y"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"Some older WebKit-based browsers recognize the properties, but do not appear to have actual support",
  "notes_by_num":{
    "1":"Supports widows & orphans properties, but due to not supporting CSS multi-columns the support is only for page breaks (for print)"
  },
  "usage_perc_y":81.35,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],132:[function(require,module,exports){
module.exports={
  "title":"CSS writing-mode property",
  "description":"Property to define whether lines of text are laid out horizontally or vertically and the direction in which blocks progress.",
  "spec":"https://drafts.csswg.org/css-writing-modes-3/#block-flow",
  "status":"cr",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/writing-mode",
      "title":"MDN article"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"a #1",
      "6":"a #1",
      "7":"a #1",
      "8":"a #1",
      "9":"a #1",
      "10":"a #1",
      "11":"a #1"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n d #2",
      "37":"n d #2",
      "38":"n d #2",
      "39":"n d #2",
      "40":"n d #2",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"u",
      "8":"y x",
      "9":"y x",
      "10":"y x",
      "11":"y x",
      "12":"y x",
      "13":"y x",
      "14":"y x",
      "15":"y x",
      "16":"y x",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y x",
      "27":"y x",
      "28":"y x",
      "29":"y x",
      "30":"y x",
      "31":"y x",
      "32":"y x",
      "33":"y x",
      "34":"y x",
      "35":"y x",
      "36":"y x",
      "37":"y x",
      "38":"y x",
      "39":"y x",
      "40":"y x",
      "41":"y x",
      "42":"y x",
      "43":"y x",
      "44":"y x",
      "45":"y x",
      "46":"y x",
      "47":"y x",
      "48":"y x",
      "49":"y x",
      "50":"y x",
      "51":"y x",
      "52":"y x",
      "53":"y x",
      "54":"y x"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"u",
      "5.1":"y x",
      "6":"y x",
      "6.1":"y x",
      "7":"y x",
      "7.1":"y x",
      "8":"y x",
      "9":"y x",
      "9.1":"y x",
      "10":"y x",
      "TP":"y x"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"y x",
      "16":"y x",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y x",
      "27":"y x",
      "28":"y x",
      "29":"y x",
      "30":"y x",
      "31":"y x",
      "32":"y x",
      "33":"y x",
      "34":"y x",
      "35":"y x",
      "36":"y x",
      "37":"y x",
      "38":"y x",
      "39":"y x",
      "40":"y x"
    },
    "ios_saf":{
      "3.2":"u",
      "4.0-4.1":"u",
      "4.2-4.3":"u",
      "5.0-5.1":"y x",
      "6.0-6.1":"y x",
      "7.0-7.1":"y x",
      "8":"y x",
      "8.1-8.4":"y x",
      "9.0-9.2":"y x",
      "9.3":"y x"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"y x",
      "4":"y x",
      "4.1":"y x",
      "4.2-4.3":"y x",
      "4.4":"y x",
      "4.4.3-4.4.4":"y x",
      "50":"y x"
    },
    "bb":{
      "7":"y x",
      "10":"y x"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y x"
    },
    "and_chr":{
      "50":"y x"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"a x",
      "11":"a x"
    },
    "and_uc":{
      "9.9":"y x"
    },
    "samsung":{
      "4":"y x"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Internet Explorer supports different values from an [earlier version of the spec](http://www.w3.org/TR/2003/CR-css3-text-20030514/#Progression), which originated from SVG.",
    "2":"Supported in Firefox under the `layout.css.vertical-text.enabled` flag"
  },
  "usage_perc_y":84.65,
  "usage_perc_a":7.17,
  "ucprefix":false,
  "parent":"",
  "keywords":"css,writing,direction,i18n,vertical,ltr,rtl",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],133:[function(require,module,exports){
module.exports={
  "title":"CSS zoom",
  "description":"Non-standard method of scaling content.",
  "spec":"https://msdn.microsoft.com/en-us/library/ms531189(v=vs.85).aspx",
  "status":"unoff",
  "links":[
    {
      "url":"https://css-tricks.com/almanac/properties/z/zoom/",
      "title":"CSS Tricks"
    },
    {
      "url":"https://docs.webplatform.org/wiki/css/properties/zoom",
      "title":"WebPlatform Docs"
    },
    {
      "url":"https://msdn.microsoft.com/en-us/library/ms531189(v=vs.85).aspx",
      "title":"MSDN Library"
    },
    {
      "url":"https://developer.apple.com/library/safari/documentation/AppleApplications/Reference/SafariCSSRef/Articles/StandardCSSProperties.html#//apple_ref/doc/uid/TP30001266-SW1",
      "title":"Safari Developer Library"
    },
    {
      "url":"http://www.satzansatz.de/cssd/onhavinglayout.html",
      "title":"Article explaining usage of zoom as the hack for fixing rendering bugs in IE6 and IE7."
    },
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/zoom",
      "title":"Mozilla Developer Network"
    }
  ],
  "bugs":[
    {
      "description":"When both `zoom` and `transform: scale()` are applied, Chrome will perform zooming operation twice."
    }
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"y",
      "6":"y",
      "7":"y",
      "8":"y #1",
      "9":"y #1",
      "10":"y #1",
      "11":"y #1"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"y",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"y",
      "4.2-4.3":"y",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"y",
      "2.2":"y",
      "2.3":"y",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"y #1",
      "11":"y #1"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"Originally implemented only in Internet Explorer. Although several other browsers support the property, using `transform: scale()` is the recommended solution to scale content.",
  "notes_by_num":{
    "1":"The `-ms-zoom` property is an extension to CSS, and can be used as a synonym for `zoom` in IE8 Standards mode."
  },
  "usage_perc_y":84.85,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"-ms-zoom,transform,-moz-transform,-ms-transform,-webkit-transform,-o-transform,scale,css-transforms",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],134:[function(require,module,exports){
module.exports={
  "title":"CSS3 attr() function",
  "description":"CSS Values and Units Level 3 adds the ability to use `attr()` on any CSS property, not just `content`, and to use it for non-string values (e.g. numbers, colors).",
  "spec":"https://www.w3.org/TR/css-values/#attr-notation",
  "status":"cr",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/attr",
      "title":"Mozilla Developer Network article"
    },
    {
      "url":"https://wpdev.uservoice.com/forums/257854-microsoft-edge-developer/suggestions/7671960-css-attr-as-defined-in-css-values-level-3",
      "title":"Microsoft Edge feature request on UserVoice"
    },
    {
      "url":"https://bugzilla.mozilla.org/show_bug.cgi?id=435426",
      "title":"Mozilla Bug #435426: implement css3-values extensions to `attr()`"
    },
    {
      "url":"https://bugs.chromium.org/p/chromium/issues/detail?id=246571",
      "title":"Chromium issue #246571: Implement CSS3 attribute / attr references"
    },
    {
      "url":"https://bugs.webkit.org/show_bug.cgi?id=26609",
      "title":"WebKit Bug #26609: Support CSS3 attr() function"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"n"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n",
      "51":"n",
      "52":"n",
      "53":"n",
      "54":"n"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n",
      "TP":"n"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":0,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"attr,attribute,function",
  "ie_id":"csslevel3attrfunction",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],135:[function(require,module,exports){
module.exports={
  "title":"CSS3 Box-sizing",
  "description":"Method of specifying whether or not an element's borders and padding should be included in size units",
  "spec":"http://www.w3.org/TR/css3-ui/#box-sizing",
  "status":"cr",
  "links":[
    {
      "url":"https://developer.mozilla.org/En/CSS/Box-sizing",
      "title":"MDN article"
    },
    {
      "url":"http://www.456bereastreet.com/archive/201104/controlling_width_with_css3_box-sizing/",
      "title":"Blog post"
    },
    {
      "url":"https://github.com/Schepp/box-sizing-polyfill",
      "title":"Polyfill for IE"
    },
    {
      "url":"http://css-tricks.com/box-sizing/",
      "title":"CSS Tricks"
    },
    {
      "url":"http://docs.webplatform.org/wiki/css/properties/box-sizing",
      "title":"WebPlatform Docs"
    }
  ],
  "bugs":[
    {
      "description":"Android browsers do not calculate correctly the dimensions (width and height) of the HTML select element."
    },
    {
      "description":"Safari 6.0.x does not use box-sizing on elements with display: table;"
    },
    {
      "description":"IE9 will subtract the width of the scrollbar to the width of the element when set to position: absolute / fixed , overflow: auto / overflow-y: scroll"
    },
    {
      "description":"IE 8 ignores `box-sizing: border-box` if min/max-width/height is used."
    },
    {
      "description":"Chrome has problems selecting options from the `select` element when using `box-sizing: border-box` and browser zoom level is less than 100%."
    },
    {
      "description":"In IE8, the min-width property applies to `content-box` even if `box-sizing` is set to `border-box`."
    }
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"p",
      "6":"p",
      "7":"p",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"y x",
      "3":"y x",
      "3.5":"y x",
      "3.6":"y x",
      "4":"y x",
      "5":"y x",
      "6":"y x",
      "7":"y x",
      "8":"y x",
      "9":"y x",
      "10":"y x",
      "11":"y x",
      "12":"y x",
      "13":"y x",
      "14":"y x",
      "15":"y x",
      "16":"y x",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y x",
      "27":"y x",
      "28":"y x",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y x",
      "5":"y x",
      "6":"y x",
      "7":"y x",
      "8":"y x",
      "9":"y x",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"y x",
      "3.2":"y x",
      "4":"y x",
      "5":"y x",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"y",
      "10.0-10.1":"y",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"y x",
      "4.0-4.1":"y x",
      "4.2-4.3":"y x",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"y"
    },
    "android":{
      "2.1":"y x",
      "2.2":"y x",
      "2.3":"y x",
      "3":"y x",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y x",
      "10":"y"
    },
    "op_mob":{
      "10":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"Firefox currently also supports the `padding-box` in addition to `content-box` and `border-box`, though this value has been removed from the specification.",
  "notes_by_num":{
    
  },
  "usage_perc_y":97.95,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"border-box,content-box",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],136:[function(require,module,exports){
module.exports={
  "title":"CSS3 Colors",
  "description":"Method of describing colors using Hue, Saturation and Lightness (hsl()) rather than just RGB, as well as allowing alpha-transparency with rgba() and hsla().",
  "spec":"http://www.w3.org/TR/css3-color/",
  "status":"rec",
  "links":[
    {
      "url":"https://dev.opera.com/articles/view/color-in-opera-10-hsl-rgb-and-alpha-transparency/",
      "title":"Dev.Opera article"
    },
    {
      "url":"http://www.css3files.com/color/",
      "title":"Information page"
    },
    {
      "url":"http://docs.webplatform.org/wiki/css/color#RGBA_Notation",
      "title":"WebPlatform Docs"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"a",
      "3":"y",
      "3.5":"y",
      "3.6":"y",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"y",
      "3.2":"y",
      "4":"y",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"a",
      "10.0-10.1":"y",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"y",
      "4.0-4.1":"y",
      "4.2-4.3":"y",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"y"
    },
    "android":{
      "2.1":"y",
      "2.2":"y",
      "2.3":"y",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":97.3,
  "usage_perc_a":0.03,
  "ucprefix":false,
  "parent":"",
  "keywords":"rgb,hsl,rgba,hsla",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],137:[function(require,module,exports){
module.exports={
  "title":"CSS3 Cursors: grab & grabbing",
  "description":"Support for `grab`, `grabbing` values for the CSS3 `cursor` property.",
  "spec":"http://www.w3.org/TR/css3-ui/#cursor",
  "status":"cr",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/cursor",
      "title":"MDN Documentation"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"y x",
      "3":"y x",
      "3.5":"y x",
      "3.6":"y x",
      "4":"y x",
      "5":"y x",
      "6":"y x",
      "7":"y x",
      "8":"y x",
      "9":"y x",
      "10":"y x",
      "11":"y x",
      "12":"y x",
      "13":"y x",
      "14":"y x",
      "15":"y x",
      "16":"y x",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y x",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y x",
      "5":"y x",
      "6":"y x",
      "7":"y x",
      "8":"y x",
      "9":"y x",
      "10":"y x",
      "11":"y x",
      "12":"y x",
      "13":"y x",
      "14":"y x",
      "15":"y x",
      "16":"y x",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y x",
      "27":"y x",
      "28":"y x",
      "29":"y x",
      "30":"y x",
      "31":"y x",
      "32":"y x",
      "33":"y x",
      "34":"y x",
      "35":"y x",
      "36":"y x",
      "37":"y x",
      "38":"y x",
      "39":"y x",
      "40":"y x",
      "41":"y x",
      "42":"y x",
      "43":"y x",
      "44":"y x",
      "45":"y x",
      "46":"y x",
      "47":"y x",
      "48":"y x",
      "49":"y x",
      "50":"y x",
      "51":"y x",
      "52":"y x",
      "53":"y x",
      "54":"y x"
    },
    "safari":{
      "3.1":"y x",
      "3.2":"y x",
      "4":"y x",
      "5":"y x",
      "5.1":"y x",
      "6":"y x",
      "6.1":"y x",
      "7":"y x",
      "7.1":"y x",
      "8":"y x",
      "9":"y x",
      "9.1":"y x",
      "10":"y x",
      "TP":"y x"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y x",
      "16":"y x",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y x",
      "27":"y x",
      "28":"y x",
      "29":"y x",
      "30":"y x",
      "31":"y x",
      "32":"y x",
      "33":"y x",
      "34":"y x",
      "35":"y x",
      "36":"y x",
      "37":"y x",
      "38":"y x",
      "39":"y x",
      "40":"y x"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"y x",
      "10":"y x"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":42.65,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"cursors, pointers, grab, grabbing",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":false
}

},{}],138:[function(require,module,exports){
module.exports={
  "title":"CSS3 Cursors: zoom-in & zoom-out",
  "description":"Support for `zoom-in`, `zoom-out` values for the CSS3 `cursor` property.",
  "spec":"http://www.w3.org/TR/css3-ui/#cursor",
  "status":"cr",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/cursor",
      "title":"MDN Documentation"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"y x",
      "3":"y x",
      "3.5":"y x",
      "3.6":"y x",
      "4":"y x",
      "5":"y x",
      "6":"y x",
      "7":"y x",
      "8":"y x",
      "9":"y x",
      "10":"y x",
      "11":"y x",
      "12":"y x",
      "13":"y x",
      "14":"y x",
      "15":"y x",
      "16":"y x",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y x",
      "5":"y x",
      "6":"y x",
      "7":"y x",
      "8":"y x",
      "9":"y x",
      "10":"y x",
      "11":"y x",
      "12":"y x",
      "13":"y x",
      "14":"y x",
      "15":"y x",
      "16":"y x",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y x",
      "25":"y x",
      "26":"y x",
      "27":"y x",
      "28":"y x",
      "29":"y x",
      "30":"y x",
      "31":"y x",
      "32":"y x",
      "33":"y x",
      "34":"y x",
      "35":"y x",
      "36":"y x",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"y x",
      "3.2":"y x",
      "4":"y x",
      "5":"y x",
      "5.1":"y x",
      "6":"y x",
      "6.1":"y x",
      "7":"y x",
      "7.1":"y x",
      "8":"y x",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y x",
      "16":"y x",
      "17":"y x",
      "18":"y x",
      "19":"y x",
      "20":"y x",
      "21":"y x",
      "22":"y x",
      "23":"y x",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"y x",
      "10":"y x"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":44.14,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"cursors, pointers",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],139:[function(require,module,exports){
module.exports={
  "title":"CSS3 Cursors (original values)",
  "description":"CSS3 cursor values added in the 2004 spec, including none, context-menu, cell, vertical-text, alias, copy, no-drop, not-allowed, nesw-resize, nwse-resize, col-resize, row-resize and all-scroll. ",
  "spec":"http://www.w3.org/TR/css3-ui/#cursor",
  "status":"cr",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/cursor",
      "title":"MDN Documentation"
    }
  ],
  "bugs":[
    {
      "description":"Firefox/Mac, Safari/Mac, Chrome/Mac don't support PNG and JPG cursors (tested with 48px cursors).\r\nIE and Edge only supports cursors in the CUR format."
    },
    {
      "description":"IE does not support Data URIs as cursor values"
    }
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"a #1",
      "6":"a #1",
      "7":"a #1",
      "8":"a #1",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"a #2",
      "13":"a #2",
      "14":"y"
    },
    "firefox":{
      "2":"a",
      "3":"a",
      "3.5":"a",
      "3.6":"a",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"a",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"a",
      "3.2":"a",
      "4":"a",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"a #2",
      "9.5-9.6":"a #2",
      "10.0-10.1":"a #2",
      "10.5":"a #2",
      "10.6":"a #2",
      "11":"a #2",
      "11.1":"a #2",
      "11.5":"a #2",
      "11.6":"a #2",
      "12":"a #2",
      "12.1":"a #2",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"u"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Partial support refers to no support for the alias, cell, copy, ew-resize, ns-resize, nesw-resize, nwse-resize or context-menu cursors.",
    "2":"Partial support refers to not supporting 'none'."
  },
  "usage_perc_y":48.05,
  "usage_perc_a":2.52,
  "ucprefix":false,
  "parent":"",
  "keywords":"cursors, pointers",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],140:[function(require,module,exports){
module.exports={
  "title":"CSS3 tab-size",
  "description":"Method of customizing the width of the tab character. Only effective using 'white-space: pre' or 'white-space: pre-wrap'.",
  "spec":"http://www.w3.org/TR/css3-text/#tab-size",
  "status":"wd",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/tab-size",
      "title":"MDN article"
    },
    {
      "url":"https://wpdev.uservoice.com/forums/257854-microsoft-edge-developer/suggestions/6524689-tab-size-property",
      "title":"Microsoft Edge feature request on UserVoice"
    }
  ],
  "bugs":[
    {
      "description":"Firefox [does not yet](https://bugzilla.mozilla.org/show_bug.cgi?id=943918) support `<length>` values"
    }
  ],
  "categories":[
    "CSS3"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"a x #1",
      "5":"a x #1",
      "6":"a x #1",
      "7":"a x #1",
      "8":"a x #1",
      "9":"a x #1",
      "10":"a x #1",
      "11":"a x #1",
      "12":"a x #1",
      "13":"a x #1",
      "14":"a x #1",
      "15":"a x #1",
      "16":"a x #1",
      "17":"a x #1",
      "18":"a x #1",
      "19":"a x #1",
      "20":"a x #1",
      "21":"a x #1",
      "22":"a x #1",
      "23":"a x #1",
      "24":"a x #1",
      "25":"a x #1",
      "26":"a x #1",
      "27":"a x #1",
      "28":"a x #1",
      "29":"a x #1",
      "30":"a x #1",
      "31":"a x #1",
      "32":"a x #1",
      "33":"a x #1",
      "34":"a x #1",
      "35":"a x #1",
      "36":"a x #1",
      "37":"a x #1",
      "38":"a x #1",
      "39":"a x #1",
      "40":"a x #1",
      "41":"a x #1",
      "42":"a x #1",
      "43":"a x #1",
      "44":"a x #1",
      "45":"a x #1",
      "46":"a x #1",
      "47":"a x #1",
      "48":"a x #1",
      "49":"a x #1",
      "50":"a x #1"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"a #1",
      "22":"a #1",
      "23":"a #1",
      "24":"a #1",
      "25":"a #1",
      "26":"a #1",
      "27":"a #1",
      "28":"a #1",
      "29":"a #1",
      "30":"a #1",
      "31":"a #1",
      "32":"a #1",
      "33":"a #1",
      "34":"a #1",
      "35":"a #1",
      "36":"a #1",
      "37":"a #1",
      "38":"a #1",
      "39":"a #1",
      "40":"a #1",
      "41":"a #1",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"a #1",
      "7":"a #1",
      "7.1":"a #1",
      "8":"a #1",
      "9":"a #1",
      "9.1":"a #1",
      "10":"a #1",
      "TP":"a #1"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"a x #1",
      "11":"a x #1",
      "11.1":"a x #1",
      "11.5":"a x #1",
      "11.6":"a x #1",
      "12":"a x #1",
      "12.1":"a x #1",
      "15":"a #1",
      "16":"a #1",
      "17":"a #1",
      "18":"a #1",
      "19":"a #1",
      "20":"a #1",
      "21":"a #1",
      "22":"a #1",
      "23":"a #1",
      "24":"a #1",
      "25":"a #1",
      "26":"a #1",
      "27":"a #1",
      "28":"a #1",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"a #1",
      "8":"a #1",
      "8.1-8.4":"a #1",
      "9.0-9.2":"a #1",
      "9.3":"a #1"
    },
    "op_mini":{
      "all":"a x #1"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"a #1",
      "4.4.3-4.4.4":"a #1",
      "50":"a #1"
    },
    "bb":{
      "7":"a #1",
      "10":"a #1"
    },
    "op_mob":{
      "10":"n",
      "11":"a x #1",
      "11.1":"a x #1",
      "11.5":"a x #1",
      "12":"a x #1",
      "12.1":"a x #1",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"a x #1"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Partial refers to supporting `<integer>` but not `<length>` values."
  },
  "usage_perc_y":52.12,
  "usage_perc_a":29.09,
  "ucprefix":false,
  "parent":"",
  "keywords":"tab-size,tab-width",
  "ie_id":"csstabsizeproperty",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],141:[function(require,module,exports){
module.exports={
  "title":"CSS currentColor value",
  "description":"A CSS value that will apply the existing `color` value to other properties like `background-color`, etc. ",
  "spec":"http://www.w3.org/TR/css3-color/#currentcolor",
  "status":"rec",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/CSS/color_value#currentColor_keyword",
      "title":"MDN article"
    },
    {
      "url":"http://css-tricks.com/currentcolor/",
      "title":"CSS Tricks article"
    }
  ],
  "bugs":[
    {
      "description":"Safari and iOS Safari 8 (maybe earlier too) have [a bug with currentColor](http://stackoverflow.com/questions/29400291/currentcolor-seems-to-get-stuck-in-safari) in :after/:before pseudo-content"
    },
    {
      "description":"IE10+ & Edge have an issue with `currentColor` in a linear gradient [see bug](https://connect.microsoft.com/IE/feedback/details/1040120/ie-11-the-color-keyword-currentcolor-doesnt-work-in-the-css-linear-gradient-function)"
    }
  ],
  "categories":[
    "CSS"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"y",
      "3":"y",
      "3.5":"y",
      "3.6":"y",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"y",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"y",
      "10.0-10.1":"y",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"u",
      "4.0-4.1":"y",
      "4.2-4.3":"y",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"y"
    },
    "android":{
      "2.1":"y",
      "2.2":"y",
      "2.3":"y",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":97.32,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],142:[function(require,module,exports){
module.exports={
  "title":"Custom Elements",
  "description":"Method of defining and using new types of DOM elements in a document.",
  "spec":"http://www.w3.org/TR/custom-elements/",
  "status":"wd",
  "links":[
    {
      "url":"http://w3c.github.io/webcomponents/spec/custom/",
      "title":"W3C Editor's Draft spec (closer to current implementations)"
    },
    {
      "url":"http://www.polymer-project.org/platform/custom-elements.html",
      "title":"Polymer project (polyfill & web components framework)"
    },
    {
      "url":"http://www.html5rocks.com/tutorials/webcomponents/customelements/",
      "title":"HTML5Rocks - Custom Elements: defining new elements in HTML"
    },
    {
      "url":"https://code.google.com/p/chromium/issues/detail?id=234509",
      "title":"Chromium tracking bug: Implement Custom Elements"
    },
    {
      "url":"https://bugzilla.mozilla.org/show_bug.cgi?id=889230",
      "title":"Firefox tracking bug: Implement Custom Elements (from Web Components)"
    },
    {
      "url":"http://status.modern.ie/customelements",
      "title":"IE Web Platform Status and Roadmap: Custom Elements"
    },
    {
      "url":"https://github.com/WebReflection/document-register-element",
      "title":"document.registerElement polyfill in 3KB minified & gzipped"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "DOM",
    "HTML5"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"p",
      "11":"p"
    },
    "edge":{
      "12":"p",
      "13":"p",
      "14":"p"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n d #1",
      "24":"n d #1",
      "25":"n d #1",
      "26":"n d #1",
      "27":"n d #1",
      "28":"n d #1",
      "29":"n d #1",
      "30":"p d #1",
      "31":"p d #1",
      "32":"p d #1",
      "33":"p d #1",
      "34":"p d #1",
      "35":"p d #1",
      "36":"p d #1",
      "37":"p d #1",
      "38":"p d #1",
      "39":"p d #1",
      "40":"p d #1",
      "41":"p d #1",
      "42":"p d #1",
      "43":"p d #1",
      "44":"p d #1",
      "45":"p d #1",
      "46":"p d #1",
      "47":"p d #1",
      "48":"p d #1",
      "49":"p d #1",
      "50":"p d #1"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n d",
      "28":"n d",
      "29":"n d",
      "30":"n d",
      "31":"n d",
      "32":"n d",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"p",
      "6.1":"p",
      "7":"p",
      "7.1":"p",
      "8":"p",
      "9":"p",
      "9.1":"p",
      "10":"p",
      "TP":"p"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n d",
      "16":"n d",
      "17":"n d",
      "18":"n d",
      "19":"n d",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"p",
      "8":"p",
      "8.1-8.4":"p",
      "9.0-9.2":"p",
      "9.3":"p"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"p d #1"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Enabled through the \"dom.webcomponents.enabled\" preference in about:config"
  },
  "usage_perc_y":53.83,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"web components,registerElement",
  "ie_id":"customelements",
  "chrome_id":"4642138092470272",
  "firefox_id":"custom-elements",
  "webkit_id":"feature-custom-elements",
  "shown":true
}

},{}],143:[function(require,module,exports){
module.exports={
  "title":"CustomEvent",
  "description":"A DOM event interface that can carry custom application-defined data.",
  "spec":"https://dom.spec.whatwg.org/#interface-customevent",
  "status":"ls",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent",
      "title":"Mozilla Developer Network"
    },
    {
      "url":"https://github.com/krambuhl/custom-event-polyfill",
      "title":"Polyfill based on the MDN snippet"
    },
    {
      "url":"https://github.com/jonathantneal/EventListener",
      "title":"EventListener polyfill which includes a CustomEvent polyfill"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "DOM",
    "JS API"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"a #1",
      "10":"a #1",
      "11":"a #1"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"a #1",
      "7":"a #1",
      "8":"a #1",
      "9":"a #1",
      "10":"a #1",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"u",
      "6":"u",
      "7":"u",
      "8":"u",
      "9":"a #1 #2",
      "10":"a #1 #2",
      "11":"a #1 #2",
      "12":"a #1 #2",
      "13":"u",
      "14":"u",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"u",
      "5.1":"a #1 #2",
      "6":"u",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"a #1",
      "11.1":"a #1",
      "11.5":"a #1",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"u",
      "4.0-4.1":"n",
      "4.2-4.3":"u",
      "5.0-5.1":"a #1 #2",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"y"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"a #1 #2",
      "4":"a #1 #2",
      "4.1":"a #1 #2",
      "4.2-4.3":"a #1 #2",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"a #1 #2",
      "10":"y"
    },
    "op_mob":{
      "10":"n",
      "11":"a #1",
      "11.1":"a #1",
      "11.5":"a #1",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"a #1",
      "11":"a #1"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"Not supported in some versions of Android's old WebKit-based WebView.",
  "notes_by_num":{
    "1":"While a `window.CustomEvent` object exists, it cannot be called as a constructor. Instead of `new CustomEvent(...)`, you must use `e = document.createEvent('CustomEvent')` and then `e.initCustomEvent(...)`",
    "2":"There is no `window.CustomEvent` object, but `document.createEvent('CustomEvent')` still works."
  },
  "usage_perc_y":89.2,
  "usage_perc_a":7.82,
  "ucprefix":false,
  "parent":"",
  "keywords":"custom events,custom,event",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],144:[function(require,module,exports){
module.exports={
  "title":"Datalist element",
  "description":"Method of setting a list of options for a user to select in a text field, while leaving the ability to enter a custom value.",
  "spec":"https://html.spec.whatwg.org/multipage/forms.html#the-datalist-element",
  "status":"ls",
  "links":[
    {
      "url":"http://hacks.mozilla.org/2010/11/firefox-4-html5-forms/",
      "title":"Mozilla Hacks article"
    },
    {
      "url":"http://afarkas.github.com/webshim/demos/",
      "title":"HTML5 Library including datalist support"
    },
    {
      "url":"https://developer.mozilla.org/en/HTML/Element/datalist",
      "title":"MDN reference"
    },
    {
      "url":"http://docs.webplatform.org/wiki/html/elements/datalist",
      "title":"WebPlatform Docs"
    },
    {
      "url":"http://demo.agektmr.com/datalist/",
      "title":"Eiji Kitamura's options demos & tests"
    },
    {
      "url":"http://github.com/thgreasi/datalist-polyfill",
      "title":"Minimal Datalist polyfill w/tutorial"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "HTML5"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"p",
      "7":"p",
      "8":"p",
      "9":"p",
      "10":"a #2",
      "11":"a #2"
    },
    "edge":{
      "12":"a #2",
      "13":"a #2",
      "14":"a #2"
    },
    "firefox":{
      "2":"p",
      "3":"p",
      "3.5":"p",
      "3.6":"p",
      "4":"a #3",
      "5":"a #3",
      "6":"a #3",
      "7":"a #3",
      "8":"a #3",
      "9":"a #3",
      "10":"a #3",
      "11":"a #3",
      "12":"a #3",
      "13":"a #3",
      "14":"a #3",
      "15":"a #3",
      "16":"a #3",
      "17":"a #3",
      "18":"a #3",
      "19":"a #3",
      "20":"a #3",
      "21":"a #3",
      "22":"a #3",
      "23":"a #3",
      "24":"a #3",
      "25":"a #3",
      "26":"a #3",
      "27":"a #3",
      "28":"a #3",
      "29":"a #3",
      "30":"a #3",
      "31":"a #3",
      "32":"a #3",
      "33":"a #3",
      "34":"a #3",
      "35":"a #3",
      "36":"a #3",
      "37":"a #3",
      "38":"a #3",
      "39":"a #3",
      "40":"a #3",
      "41":"a #3",
      "42":"a #3",
      "43":"a #3",
      "44":"a #3",
      "45":"a #3",
      "46":"a #3",
      "47":"a #3",
      "48":"a #3",
      "49":"a #3",
      "50":"a #3"
    },
    "chrome":{
      "4":"p",
      "5":"p",
      "6":"p",
      "7":"p",
      "8":"p",
      "9":"p",
      "10":"p",
      "11":"p",
      "12":"p",
      "13":"p",
      "14":"p",
      "15":"p",
      "16":"p",
      "17":"p",
      "18":"p",
      "19":"p",
      "20":"a #1",
      "21":"a #1",
      "22":"a #1",
      "23":"a #1",
      "24":"a #1",
      "25":"a #1",
      "26":"a #1",
      "27":"a #1",
      "28":"a #1",
      "29":"a #1",
      "30":"a #1",
      "31":"a #1",
      "32":"a #1",
      "33":"a #1",
      "34":"a #1",
      "35":"a #1",
      "36":"a #1",
      "37":"a #1",
      "38":"a #1",
      "39":"a #1",
      "40":"a #1",
      "41":"a #1",
      "42":"a #1",
      "43":"a #1",
      "44":"a #1",
      "45":"a #1",
      "46":"a #1",
      "47":"a #1",
      "48":"a #1",
      "49":"a #1",
      "50":"a #1",
      "51":"a #1",
      "52":"a #1",
      "53":"a #1",
      "54":"a #1"
    },
    "safari":{
      "3.1":"p",
      "3.2":"p",
      "4":"p",
      "5":"p",
      "5.1":"p",
      "6":"p",
      "6.1":"p",
      "7":"p",
      "7.1":"p",
      "8":"p",
      "9":"p",
      "9.1":"p",
      "10":"p",
      "TP":"p"
    },
    "opera":{
      "9":"y",
      "9.5-9.6":"y",
      "10.0-10.1":"y",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"a #1",
      "16":"a #1",
      "17":"a #1",
      "18":"a #1",
      "19":"a #1",
      "20":"a #1",
      "21":"a #1",
      "22":"a #1",
      "23":"a #1",
      "24":"a #1",
      "25":"a #1",
      "26":"a #1",
      "27":"a #1",
      "28":"a #1",
      "29":"a #1",
      "30":"a #1",
      "31":"a #1",
      "32":"a #1",
      "33":"a #1",
      "34":"a #1",
      "35":"a #1",
      "36":"a #1",
      "37":"a #1",
      "38":"a #1",
      "39":"a #1",
      "40":"a #1"
    },
    "ios_saf":{
      "3.2":"p",
      "4.0-4.1":"p",
      "4.2-4.3":"p",
      "5.0-5.1":"p",
      "6.0-6.1":"p",
      "7.0-7.1":"p",
      "8":"p",
      "8.1-8.4":"p",
      "9.0-9.2":"p",
      "9.3":"p"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"p",
      "2.2":"p",
      "2.3":"p",
      "3":"p",
      "4":"p",
      "4.1":"p",
      "4.2-4.3":"p",
      "4.4":"p",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"p",
      "10":"y"
    },
    "op_mob":{
      "10":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"p"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"a #3"
    },
    "ie_mob":{
      "10":"p",
      "11":"p"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"While most commonly used on text fields, datalists can also be used on other input types. IE11 supports the element on `range` fields. Chrome and Opera also support datalists to suggest given values on `range`, `color` and date/time fields. ",
  "notes_by_num":{
    "1":"Partial support refers to [a bug](https://code.google.com/p/chromium/issues/detail?id=375637) where long lists of items are unscrollable resulting in unselectable options.",
    "2":"Partial support in IE refers to [significantly buggy behavior](http://playground.onereason.eu/2013/04/ie10s-lousy-support-for-datalists/) (IE11+ does send the input and change events upon selection). ",
    "3":"Partial support refers to no support for datalists on non-text fields (e.g. number, [range](https://bugzilla.mozilla.org/show_bug.cgi?id=841942), [color](https://bugzilla.mozilla.org/show_bug.cgi?id=960984))."
  },
  "usage_perc_y":30.26,
  "usage_perc_a":46.57,
  "ucprefix":false,
  "parent":"forms",
  "keywords":"list attribute",
  "ie_id":"datalistelement",
  "chrome_id":"6090950820495360",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],145:[function(require,module,exports){
module.exports={
  "title":"dataset & data-* attributes",
  "description":"Method of applying and accessing custom data to elements.",
  "spec":"https://html.spec.whatwg.org/multipage/dom.html#embedding-custom-non-visible-data-with-the-data-*-attributes",
  "status":"ls",
  "links":[
    {
      "url":"http://html5doctor.com/html5-custom-data-attributes/",
      "title":"HTML5 Doctor article"
    },
    {
      "url":"http://html5demos.com/dataset",
      "title":"Demo using dataset"
    },
    {
      "url":"https://raw.github.com/phiggins42/has.js/master/detect/dom.js#dom-dataset",
      "title":"has.js test"
    },
    {
      "url":"http://docs.webplatform.org/wiki/html/attributes/data-*",
      "title":"WebPlatform Docs"
    },
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/API/HTMLElement.dataset",
      "title":"MDN Reference - dataset"
    },
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/Using_data_attributes",
      "title":"MDN Guide - Using data-* attributes"
    }
  ],
  "bugs":[
    {
      "description":"Android 2.3 cannot read `data-*` properties from `select` elements.\r\n"
    }
  ],
  "categories":[
    "HTML5"
  ],
  "stats":{
    "ie":{
      "5.5":"a",
      "6":"a",
      "7":"a",
      "8":"a",
      "9":"a",
      "10":"a",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"a",
      "3":"a",
      "3.5":"a",
      "3.6":"a",
      "4":"a",
      "5":"a",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"a",
      "5":"a",
      "6":"a",
      "7":"y #1",
      "8":"y #1",
      "9":"y #1",
      "10":"y #1",
      "11":"y #1",
      "12":"y #1",
      "13":"y #1",
      "14":"y #1",
      "15":"y #1",
      "16":"y #1",
      "17":"y #1",
      "18":"y #1",
      "19":"y #1",
      "20":"y #1",
      "21":"y #1",
      "22":"y #1",
      "23":"y #1",
      "24":"y #1",
      "25":"y #1",
      "26":"y #1",
      "27":"y #1",
      "28":"y #1",
      "29":"y #1",
      "30":"y #1",
      "31":"y #1",
      "32":"y #1",
      "33":"y #1",
      "34":"y #1",
      "35":"y #1",
      "36":"y #1",
      "37":"y #1",
      "38":"y #1",
      "39":"y #1",
      "40":"y #1",
      "41":"y #1",
      "42":"y #1",
      "43":"y #1",
      "44":"y #1",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"a",
      "3.2":"a",
      "4":"a",
      "5":"a",
      "5.1":"y #1",
      "6":"y #1",
      "6.1":"y #1",
      "7":"y #1",
      "7.1":"y #1",
      "8":"y #1",
      "9":"y #1",
      "9.1":"y #1",
      "10":"y #1",
      "TP":"y #1"
    },
    "opera":{
      "9":"a",
      "9.5-9.6":"a",
      "10.0-10.1":"a",
      "10.5":"a",
      "10.6":"a",
      "11":"a",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y #1",
      "16":"y #1",
      "17":"y #1",
      "18":"y #1",
      "19":"y #1",
      "20":"y #1",
      "21":"y #1",
      "22":"y #1",
      "23":"y #1",
      "24":"y #1",
      "25":"y #1",
      "26":"y #1",
      "27":"y #1",
      "28":"y #1",
      "29":"y #1",
      "30":"y #1",
      "31":"y #1",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"a",
      "4.0-4.1":"a",
      "4.2-4.3":"a",
      "5.0-5.1":"y #1",
      "6.0-6.1":"y #1",
      "7.0-7.1":"y #1",
      "8":"y #1",
      "8.1-8.4":"y #1",
      "9.0-9.2":"y #1",
      "9.3":"y #1"
    },
    "op_mini":{
      "all":"a"
    },
    "android":{
      "2.1":"a",
      "2.2":"a",
      "2.3":"a",
      "3":"y #1",
      "4":"y #1",
      "4.1":"y #1",
      "4.2-4.3":"y #1",
      "4.4":"y #1",
      "4.4.3-4.4.4":"y #1",
      "50":"y #1"
    },
    "bb":{
      "7":"y #1",
      "10":"y #1"
    },
    "op_mob":{
      "10":"a",
      "11":"a",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y #1"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"a",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y #1"
    },
    "samsung":{
      "4":"y #1"
    }
  },
  "notes":"Partial support refers to being able to use `data-*` attributes and access them using `getAttribute`. \r\n\r\n\"Supported\" refers to accessing the values using the `dataset` property. Current spec only refers to support on HTML elements, only some browsers also have support for SVG/MathML elements.",
  "notes_by_num":{
    "1":"While the HTML spec doesn't require it, these browsers also support `dataset` and `data-*` attributes on SVG elements, in compliance with [current plans for SVG2](http://www.w3.org/2015/01/15-svg-minutes.html#item03)"
  },
  "usage_perc_y":91.33,
  "usage_perc_a":6.72,
  "ucprefix":false,
  "parent":"",
  "keywords":"DOMStringMap",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],146:[function(require,module,exports){
module.exports={
  "title":"Data URIs",
  "description":"Method of embedding images and other files in webpages as a string of text, generally using base64 encoding.",
  "spec":"https://tools.ietf.org/html/rfc2397",
  "status":"other",
  "links":[
    {
      "url":"http://css-tricks.com/data-uris/",
      "title":"Information page"
    },
    {
      "url":"http://en.wikipedia.org/wiki/data_URI_scheme",
      "title":"Wikipedia"
    },
    {
      "url":"http://www.websiteoptimization.com/speed/tweak/inline-images/",
      "title":"Data URL converter"
    },
    {
      "url":"http://klevjers.com/papers/phishing.pdf",
      "title":"Information on security issues"
    }
  ],
  "bugs":[
    {
      "description":"Non-base64-encoded SVG data URIs need to be uriencoded to work in IE and Firefox as according to the specification."
    }
  ],
  "categories":[
    "Other"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"a #1",
      "9":"a #2",
      "10":"a #2",
      "11":"a #2"
    },
    "edge":{
      "12":"a #2",
      "13":"a #2",
      "14":"a #2"
    },
    "firefox":{
      "2":"y",
      "3":"y",
      "3.5":"y",
      "3.6":"y",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"y",
      "3.2":"y",
      "4":"y",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"y",
      "9.5-9.6":"y",
      "10.0-10.1":"y",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"y",
      "4.0-4.1":"y",
      "4.2-4.3":"y",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"y"
    },
    "android":{
      "2.1":"y",
      "2.2":"y",
      "2.3":"y",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"a #2",
      "11":"a #2"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Support is limited to images and linked resources like CSS files, not HTML or JS files. Max URI length is 32KB.",
    "2":"Support is limited to images and linked resources like CSS or JS, not HTML files. Maximum size limit is 4GB."
  },
  "usage_perc_y":89.38,
  "usage_perc_a":8.58,
  "ucprefix":false,
  "parent":"",
  "keywords":"data url,datauris,data uri,dataurl,dataurls,base64",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],147:[function(require,module,exports){
module.exports={
  "title":"Details & Summary elements",
  "description":"The <details> element generates a simple no-JavaScript widget to show/hide element contents, optionally by clicking on its child <summary> element.",
  "spec":"https://html.spec.whatwg.org/multipage/forms.html#the-details-element",
  "status":"ls",
  "links":[
    {
      "url":"https://mathiasbynens.be/notes/html5-details-jquery",
      "title":"jQuery fallback script"
    },
    {
      "url":"https://gist.github.com/370590",
      "title":"Fallback script"
    },
    {
      "url":"http://html5doctor.com/summary-figcaption-element/",
      "title":"HTML5 Doctor article"
    },
    {
      "url":"https://raw.github.com/phiggins42/has.js/master/detect/features.js#native-details",
      "title":"has.js test"
    },
    {
      "url":"http://docs.webplatform.org/wiki/html/elements/details",
      "title":"WebPlatform Docs"
    },
    {
      "url":"https://bugzilla.mozilla.org/show_bug.cgi?id=591737",
      "title":"Bug on Firefox support"
    }
  ],
  "bugs":[
    {
      "description":"`<select>` within `<details>` elements won't have their value changed on the Android browser shipped with most of Samsung's devices (i.e. Note 3, Galaxy 5)\r\nThe picker will appear, but attempting to select any option won't update the `<select>` or trigger any event."
    },
    {
      "description":"In Chrome, when using the common inherit box-sizing fix (http://www.paulirish.com/2012/box-sizing-border-box-ftw/) in combination with a `<details>` element, the children of the `<details>` element get rendered as if they were `box-sizing: content-box;`. See: http://codepen.io/jochemnabuurs/pen/yYzYqM"
    }
  ],
  "categories":[
    "HTML5"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"p",
      "7":"p",
      "8":"p",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"p",
      "3.5":"p",
      "3.6":"p",
      "4":"p",
      "5":"p",
      "6":"p",
      "7":"p",
      "8":"p",
      "9":"p",
      "10":"p",
      "11":"p",
      "12":"p",
      "13":"p",
      "14":"p",
      "15":"p",
      "16":"p",
      "17":"p",
      "18":"p",
      "19":"p",
      "20":"p",
      "21":"p",
      "22":"p",
      "23":"p",
      "24":"p",
      "25":"p",
      "26":"p",
      "27":"p",
      "28":"p",
      "29":"p",
      "30":"p",
      "31":"p",
      "32":"p",
      "33":"p",
      "34":"p",
      "35":"p",
      "36":"p",
      "37":"p",
      "38":"p",
      "39":"p",
      "40":"p",
      "41":"p",
      "42":"p",
      "43":"p",
      "44":"p",
      "45":"p",
      "46":"p",
      "47":"n d #1",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"p",
      "5":"p",
      "6":"p",
      "7":"p",
      "8":"p",
      "9":"p",
      "10":"p",
      "11":"p",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"p",
      "3.2":"p",
      "4":"p",
      "5":"p",
      "5.1":"p",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"p",
      "9.5-9.6":"p",
      "10.0-10.1":"p",
      "10.5":"p",
      "10.6":"p",
      "11":"p",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"p",
      "4.0-4.1":"p",
      "4.2-4.3":"p",
      "5.0-5.1":"p",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"p"
    },
    "android":{
      "2.1":"p",
      "2.2":"p",
      "2.3":"p",
      "3":"p",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"p",
      "10":"y"
    },
    "op_mob":{
      "10":"p",
      "11":"p",
      "11.1":"p",
      "11.5":"p",
      "12":"p",
      "12.1":"p",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"p"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Enabled in Firefox through the `dom.details_element.enabled` flag"
  },
  "usage_perc_y":75.97,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"",
  "ie_id":"detailssummary",
  "chrome_id":"5348024557502464",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],148:[function(require,module,exports){
module.exports={
  "title":"DeviceOrientation & DeviceMotion events",
  "description":"API for detecting orientation and motion events from the device running the browser.",
  "spec":"http://www.w3.org/TR/orientation-event/",
  "status":"wd",
  "links":[
    {
      "url":"http://www.html5rocks.com/en/tutorials/device/orientation/",
      "title":"HTML5 Rocks tutorial"
    },
    {
      "url":"https://raw.github.com/phiggins42/has.js/master/detect/features.js#native-orientation",
      "title":"has.js test"
    },
    {
      "url":"http://html5labs.interoperabilitybridges.com/prototypes/device-orientation-events/device-orientation-events/info",
      "title":"DeviceOrientation implementation prototype for IE10"
    },
    {
      "url":"http://aurelio.audero.it/demo/device-orientation-api-demo.html",
      "title":"Demo"
    }
  ],
  "bugs":[
    {
      "description":"`DeviceOrientationEvent.beta` has values between -90 and 90 on mobile Safari and between 180 and -180 on Firefox.\r\n`DeviceOrientationEvent.gamma` has values between -180 and 180 on mobile Safari and between 90 and -90 on Firefox.\r\nSee [Firefox reference](https://developer.mozilla.org/en-US/docs/Web/API/DeviceOrientationEvent)\r\nand [Safari reference](https://developer.apple.com/library/safari/documentation/SafariDOMAdditions/Reference/DeviceOrientationEventClassRef/DeviceOrientationEvent/DeviceOrientationEvent.html#//apple_ref/javascript/instp/DeviceOrientationEvent/beta)"
    },
    {
      "description":"Safari on iOS doesn't implement the spec correctly, because alpha is arbitrary instead of relative to true north. Safari instead offers webkitCompassHeading`, which has the opposite sign to alpha and is also relative to magnetic north instead of true north. (see [details](https://github.com/w3c/deviceorientation/issues/6))"
    }
  ],
  "categories":[
    "JS API"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"a #1"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"p",
      "4":"p",
      "5":"p",
      "6":"a",
      "7":"a",
      "8":"a",
      "9":"a",
      "10":"a",
      "11":"a",
      "12":"a",
      "13":"a",
      "14":"a",
      "15":"a",
      "16":"a",
      "17":"a",
      "18":"a",
      "19":"a",
      "20":"a",
      "21":"a",
      "22":"a",
      "23":"a",
      "24":"a",
      "25":"a",
      "26":"a",
      "27":"a",
      "28":"a",
      "29":"a",
      "30":"a",
      "31":"a",
      "32":"a",
      "33":"a",
      "34":"a",
      "35":"a",
      "36":"a",
      "37":"a",
      "38":"a",
      "39":"a",
      "40":"a",
      "41":"a",
      "42":"a",
      "43":"a",
      "44":"a",
      "45":"a",
      "46":"a",
      "47":"a",
      "48":"a",
      "49":"a",
      "50":"a"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"a",
      "8":"a",
      "9":"a",
      "10":"a",
      "11":"a",
      "12":"a",
      "13":"a",
      "14":"a",
      "15":"a",
      "16":"a",
      "17":"a",
      "18":"a",
      "19":"a",
      "20":"a",
      "21":"a",
      "22":"a",
      "23":"a",
      "24":"a",
      "25":"a",
      "26":"a",
      "27":"a",
      "28":"a",
      "29":"a",
      "30":"a",
      "31":"a",
      "32":"a",
      "33":"a",
      "34":"a",
      "35":"a",
      "36":"a",
      "37":"a",
      "38":"a",
      "39":"a",
      "40":"a",
      "41":"a",
      "42":"a",
      "43":"a",
      "44":"a",
      "45":"a",
      "46":"a",
      "47":"a",
      "48":"a",
      "49":"a",
      "50":"a",
      "51":"a",
      "52":"a",
      "53":"a",
      "54":"a"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n",
      "TP":"n"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"a",
      "16":"a",
      "17":"a",
      "18":"a",
      "19":"a",
      "20":"a",
      "21":"a",
      "22":"a",
      "23":"a",
      "24":"a",
      "25":"a",
      "26":"a",
      "27":"a",
      "28":"a",
      "29":"a",
      "30":"a",
      "31":"a",
      "32":"a",
      "33":"a",
      "34":"a",
      "35":"a",
      "36":"a",
      "37":"a",
      "38":"a",
      "39":"a",
      "40":"a"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"a",
      "5.0-5.1":"a",
      "6.0-6.1":"a",
      "7.0-7.1":"a",
      "8":"a",
      "8.1-8.4":"a",
      "9.0-9.2":"a",
      "9.3":"a"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"a",
      "4":"a",
      "4.1":"a",
      "4.2-4.3":"a",
      "4.4":"a",
      "4.4.3-4.4.4":"a",
      "50":"a"
    },
    "bb":{
      "7":"n",
      "10":"a"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"y",
      "12.1":"y",
      "37":"a"
    },
    "and_chr":{
      "50":"a"
    },
    "and_ff":{
      "46":"a"
    },
    "ie_mob":{
      "10":"n",
      "11":"y"
    },
    "and_uc":{
      "9.9":"a"
    },
    "samsung":{
      "4":"a"
    }
  },
  "notes":"Partial support refers to the lack of compassneedscalibration event. Partial support also refers to the lack of devicemotion event support for Chrome 30- and Opera. Opera Mobile 14 lost the ondevicemotion event support. Firefox 3.6, 4 and 5 support the non-standard [MozOrientation](https://developer.mozilla.org/en/DOM/MozOrientation) event.",
  "notes_by_num":{
    "1":"`compassneedscalibration` supported in IE11 only for compatible devices with Windows 8.1+."
  },
  "usage_perc_y":2.05,
  "usage_perc_a":86.7,
  "ucprefix":false,
  "parent":"",
  "keywords":"",
  "ie_id":"deviceorientation,devicemotion",
  "chrome_id":"5874690627207168,5556931766779904",
  "firefox_id":"device-orientation",
  "webkit_id":"",
  "shown":true
}

},{}],149:[function(require,module,exports){
module.exports={
  "title":"Window.devicePixelRatio",
  "description":"Read-only property that returns the ratio of the (vertical) size of one physical pixel on the current display device to the size of one CSS pixel.",
  "spec":"http://dev.w3.org/csswg/cssom-view/#dom-window-devicepixelratio",
  "status":"wd",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/API/Window/devicePixelRatio",
      "title":"MDN"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "CSS",
    "DOM"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"y",
      "3.2":"y",
      "4":"y",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"y",
      "4.0-4.1":"y",
      "4.2-4.3":"y",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"y"
    },
    "android":{
      "2.1":"y",
      "2.2":"y",
      "2.3":"y",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"As the page is zoomed in the number of device pixels that one CSS pixel covers increases, and therefore the value of devicePixelRatio will also increase.",
  "notes_by_num":{
    
  },
  "usage_perc_y":95.91,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"device,pixel,ratio,size",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],150:[function(require,module,exports){
module.exports={
  "title":"Dialog element",
  "description":"Method of easily creating custom dialog boxes to display to the user with modal or non-modal options. Also includes a `::backdrop` pseudo-element for behind the element.",
  "spec":"https://html.spec.whatwg.org/multipage/forms.html#the-dialog-element",
  "status":"ls",
  "links":[
    {
      "url":"https://github.com/GoogleChrome/dialog-polyfill",
      "title":"Polyfill"
    }
  ],
  "bugs":[
    {
      "description":"[Firefox tracking bug](https://bugzilla.mozilla.org/show_bug.cgi?id=840640)"
    },
    {
      "description":"[WebKit tracking bug](https://bugs.webkit.org/show_bug.cgi?id=84635)"
    }
  ],
  "categories":[
    "DOM",
    "HTML5"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n d #1",
      "33":"n d #1",
      "34":"n d #1",
      "35":"n d #1",
      "36":"n d #1",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n",
      "TP":"n"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n d #2",
      "20":"n d #2",
      "21":"n d #2",
      "22":"n d #2",
      "23":"n d #2",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Enabled through the \"Experimental Web Platform features\" flag in `chrome://flags`",
    "2":"Enabled through the \"Experimental Web Platform features\" flag in `opera://flags`"
  },
  "usage_perc_y":52.53,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"HTMLDialogElement,showModal,backdrop",
  "ie_id":"dialogelementformodals",
  "chrome_id":"5770237022568448",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],151:[function(require,module,exports){
module.exports={
  "title":"EventTarget.dispatchEvent",
  "description":"Method to programmatically trigger a DOM event.",
  "spec":"https://dom.spec.whatwg.org/#dom-eventtarget-dispatchevent",
  "status":"ls",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent",
      "title":"Mozilla Developer Network"
    },
    {
      "url":"https://github.com/Financial-Times/polyfill-service/blob/master/polyfills/Event/polyfill-ie8.js",
      "title":"Financial Times IE8 polyfill"
    },
    {
      "url":"https://github.com/WebReflection/ie8",
      "title":"WebReflection ie8 polyfill"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "DOM"
  ],
  "stats":{
    "ie":{
      "5.5":"u",
      "6":"n #1",
      "7":"n #1",
      "8":"n #1",
      "9":"y #1",
      "10":"y #1",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"y",
      "3":"y",
      "3.5":"y",
      "3.6":"y",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"u",
      "3.2":"y",
      "4":"y",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"u",
      "9.5-9.6":"y",
      "10.0-10.1":"y",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"u",
      "4.0-4.1":"y",
      "4.2-4.3":"y",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"y"
    },
    "android":{
      "2.1":"u",
      "2.2":"u",
      "2.3":"y",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y #1",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Supports Microsoft's proprietary [`EventTarget.fireEvent() method`](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/fireEvent)."
  },
  "usage_perc_y":97.32,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"dispatch,event,target,fire,trigger,dom",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],152:[function(require,module,exports){
module.exports={
  "title":"document.currentScript",
  "description":"`document.currentScript` returns the `<script>` element whose script is currently being processed.",
  "spec":"https://html.spec.whatwg.org/multipage/dom.html#dom-document-currentscript",
  "status":"ls",
  "links":[
    {
      "url":"https://github.com/JamesMGreene/document.currentScript",
      "title":"Polyfill (IE 6-10 only)"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "JS API"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":77.15,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],153:[function(require,module,exports){
module.exports={
  "title":"Document.execCommand()",
  "description":"Allows running commands to manipulate the contents of an editable region in a document switched to designMode",
  "spec":"https://dvcs.w3.org/hg/editing/raw-file/tip/editing.html#execcommand()",
  "status":"unoff",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/API/Document/execCommand",
      "title":"MDN"
    },
    {
      "url":"http://codepen.io/netsi1964/pen/QbLLGW",
      "title":"execCommand and queryCommandSupported demo"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "JS API"
  ],
  "stats":{
    "ie":{
      "5.5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"u",
      "3.2":"u",
      "4":"u",
      "5":"u",
      "5.1":"u",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"u",
      "9.5-9.6":"u",
      "10.0-10.1":"y",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"u",
      "5.0-5.1":"u",
      "6.0-6.1":"u",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"y"
    },
    "op_mob":{
      "10":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"y"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"To determine what commands are supported, see `Document.queryCommandSupported()`",
  "notes_by_num":{
    
  },
  "usage_perc_y":85.95,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"document,text,editor,commands,designMode",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],154:[function(require,module,exports){
module.exports={
  "title":"document.head",
  "description":"Convenience property for accessing the `<head>` element",
  "spec":"https://html.spec.whatwg.org/multipage/#dom-document-head",
  "status":"ls",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/API/Document/head",
      "title":"Mozilla Developer Network"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "DOM"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"u",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"u",
      "4.0-4.1":"y",
      "4.2-4.3":"y",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"y"
    },
    "android":{
      "2.1":"u",
      "2.2":"u",
      "2.3":"y",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"n",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":97.11,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"document,head",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],155:[function(require,module,exports){
module.exports={
  "title":"DOM manipulation convenience methods",
  "description":"jQuery-like methods on DOM nodes to insert nodes around or within a node, or to replace one node with another. These methods accept any number of DOM nodes or HTML strings as arguments. Includes: `ChildNode.before`, `ChildNode.after`, `ChildNode.replaceWith`, `ParentNode.prepend`, and `ParentNode.append`.",
  "spec":"https://dom.spec.whatwg.org/#interface-childnode",
  "status":"ls",
  "links":[
    {
      "url":"https://dom.spec.whatwg.org/#interface-childnode",
      "title":"WHATWG DOM Specification for ChildNode"
    },
    {
      "url":"https://dom.spec.whatwg.org/#interface-parentnode",
      "title":"WHATWG DOM Specification for ParentNode"
    },
    {
      "url":"http://jsbin.com/fiqacod/edit?html,js,output",
      "title":"JS Bin testcase"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "DOM"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n",
      "51":"n",
      "52":"n d #1",
      "53":"n d #1",
      "54":"n d #1"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Enabled through the \"Enable Experimental Web Platform Features\" flag in chrome://flags"
  },
  "usage_perc_y":0.12,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"dom,manipulation,convenience,convenient,before,after,replaceWith,prepend,append",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],156:[function(require,module,exports){
module.exports={
  "title":"Document Object Model Range",
  "description":"A contiguous range of content in a Document, DocumentFragment or Attr",
  "spec":"https://dom.spec.whatwg.org/#ranges",
  "status":"ls",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/API/Range",
      "title":"MDN"
    },
    {
      "url":"http://www.quirksmode.org/dom/range_intro.html",
      "title":"QuirksMode"
    },
    {
      "url":"https://github.com/timdown/rangy",
      "title":"\"Rangy\" Range library with old IE support"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "DOM",
    "JS API"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"p",
      "7":"p",
      "8":"p",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"y",
      "3":"y",
      "3.5":"y",
      "3.6":"y",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"y",
      "3.2":"y",
      "4":"y",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"y",
      "9.5-9.6":"y",
      "10.0-10.1":"y",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"y",
      "4.0-4.1":"y",
      "4.2-4.3":"y",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"y"
    },
    "android":{
      "2.1":"y",
      "2.2":"y",
      "2.3":"y",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"See [MDN](https://developer.mozilla.org/en-US/docs/Web/API/Range) for feature support details",
  "notes_by_num":{
    
  },
  "usage_perc_y":97.33,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"DOM,range,selection",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],157:[function(require,module,exports){
module.exports={
  "title":"DOMContentLoaded",
  "description":"JavaScript event that fires when the DOM is loaded, but before all page assets are loaded (CSS, images, etc.).",
  "spec":"https://html.spec.whatwg.org/multipage/syntax.html#stop-parsing",
  "status":"ls",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/Reference/Events/DOMContentLoaded",
      "title":"MDN: DOMContentLoaded"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "DOM"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"y",
      "3":"y",
      "3.5":"y",
      "3.6":"y",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"y",
      "3.2":"y",
      "4":"y",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"y",
      "9.5-9.6":"y",
      "10.0-10.1":"y",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"y",
      "4.0-4.1":"y",
      "4.2-4.3":"y",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"y"
    },
    "android":{
      "2.1":"y",
      "2.2":"y",
      "2.3":"y",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":97.33,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"dom,domready,onload,contentloaded,document",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],158:[function(require,module,exports){
module.exports={
  "title":"DOMFocusIn & DOMFocusOut events",
  "description":"These deprecated events fire after the `focus` and `blur` events (respectively), but bubble (unlike `focus` and `blur`).",
  "spec":"https://www.w3.org/TR/DOM-Level-3-Events/#event-type-DOMFocusIn",
  "status":"wd",
  "links":[
    {
      "url":"http://help.dottoro.com/ljuoivsj.php",
      "title":"DOMFocusIn event at Dottoro Web Reference"
    },
    {
      "url":"http://help.dottoro.com/ljcdqtiv.php",
      "title":"DOMFocusOut event at Dottoro Web Reference"
    },
    {
      "url":"https://bugzilla.mozilla.org/show_bug.cgi?id=396927",
      "title":"Mozilla Bug 396927 (INVALID) - Implement the DOMFocusIn and DOMFocusOut events"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "DOM"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n"
    },
    "chrome":{
      "4":"u",
      "5":"u",
      "6":"u",
      "7":"u",
      "8":"u",
      "9":"u",
      "10":"u",
      "11":"u",
      "12":"u",
      "13":"u",
      "14":"u",
      "15":"u",
      "16":"u",
      "17":"u",
      "18":"u",
      "19":"u",
      "20":"u",
      "21":"u",
      "22":"u",
      "23":"u",
      "24":"u",
      "25":"u",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"u",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"u",
      "9.5-9.6":"u",
      "10.0-10.1":"u",
      "10.5":"u",
      "10.6":"u",
      "11":"u",
      "11.1":"u",
      "11.5":"u",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"u",
      "4.0-4.1":"u",
      "4.2-4.3":"u",
      "5.0-5.1":"u",
      "6.0-6.1":"u",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"u"
    },
    "android":{
      "2.1":"u",
      "2.2":"u",
      "2.3":"u",
      "3":"u",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"u",
      "10":"u"
    },
    "op_mob":{
      "10":"u",
      "11":"u",
      "11.1":"u",
      "11.5":"u",
      "12":"u",
      "12.1":"u",
      "37":"u"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"u",
      "11":"u"
    },
    "and_uc":{
      "9.9":"u"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"These events are deprecated. Use the `focus`/`blur`/`focusin`/`focusout` events instead if possible.",
  "notes_by_num":{
    
  },
  "usage_perc_y":68.84,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"domfocusin,domfocusout,focus,event",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":false
}

},{}],159:[function(require,module,exports){
module.exports={
  "title":"Download attribute",
  "description":"When used on an anchor, this attribute signifies that the browser should download the resource the anchor points to rather than navigate to it.",
  "spec":"https://html.spec.whatwg.org/multipage/semantics.html#downloading-resources",
  "status":"ls",
  "links":[
    {
      "url":"http://updates.html5rocks.com/2011/08/Downloading-resources-in-HTML5-a-download",
      "title":"HTML5Rocks post"
    },
    {
      "url":"http://html5-demos.appspot.com/static/a.download.html",
      "title":"Demo: creating a text file and downloading it."
    },
    {
      "url":"https://bugs.webkit.org/show_bug.cgi?id=102914",
      "title":"WebKit feature request bug"
    }
  ],
  "bugs":[
    {
      "description":"Firefox only supports [same-origin](https://bugzilla.mozilla.org/show_bug.cgi?id=874009) download links."
    }
  ],
  "categories":[
    "HTML5"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n",
      "TP":"n"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"y"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":66.36,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"download,a.download,a[download],download attribute",
  "ie_id":"adownloadattribute",
  "chrome_id":"6473924464345088",
  "firefox_id":"",
  "webkit_id":"feature-download-attribute",
  "shown":true
}

},{}],160:[function(require,module,exports){
module.exports={
  "title":"Drag and Drop",
  "description":"Method of easily dragging and dropping elements on a page, requiring minimal JavaScript.",
  "spec":"https://html.spec.whatwg.org/multipage/interaction.html#dnd",
  "status":"ls",
  "links":[
    {
      "url":"http://html5doctor.com/native-drag-and-drop/",
      "title":"HTML5 Doctor article"
    },
    {
      "url":"http://nettutsplus.s3.amazonaws.com/64_html5dragdrop/demo/index.html",
      "title":"Shopping cart demo"
    },
    {
      "url":"http://html5demos.com/drag",
      "title":"Demo with link blocks"
    },
    {
      "url":"http://docs.webplatform.org/wiki/dom/DragEvent",
      "title":"WebPlatform Docs"
    },
    {
      "url":"https://github.com/MihaiValentin/setDragImage-IE",
      "title":"Polyfill for setDragImage in IE"
    },
    {
      "url":"http://blog.teamtreehouse.com/implementing-native-drag-and-drop",
      "title":"Implementing Native Drag and Drop"
    },
    {
      "url":"https://github.com/timruffles/ios-html5-drag-drop-shim",
      "title":"iOS/Android shim for HTML 5 drag'n'drop"
    },
    {
      "url":"https://wpdev.uservoice.com/forums/257854-microsoft-edge-developer/suggestions/6542268-setdragimage-on-datatransfer-of-dragevent",
      "title":"Microsoft Edge setDragImage feature request on UserVoice"
    }
  ],
  "bugs":[
    {
      "description":"In Chrome, DataTransfer.addElement is not implemented. There is no other way to implement a draggable object, that updates during the drag due to some other circumstances (e.g. changes color on a valid drop spot), as it is just a static image if addElement is not supported.\r\n"
    },
    {
      "description":"In Firefox, the dragstart event does not fire on button elements. This effectively disables drag and drop for button elements.\r\n"
    },
    {
      "description":"In IE9-10 draggable attribute could be effectively applied for link and image elements. For div and span elements you should call 'element.dragDrop()' to start drag event.\r\n"
    },
    {
      "description":"In Safari 8, after setting `event.dataTransfer.dropEffect`, the value in the `drop` event is always `'none'`"
    },
    {
      "description":"Safari doesn't implement the `DragEvent` interface. It adds a `dataTransfer` property to `MouseEvent` instead. See [WebKit bug #103423](https://bugs.webkit.org/show_bug.cgi?id=103423)."
    },
    {
      "description":"Chrome strips out newlines from `text/uri-list` [see bug](https://code.google.com/p/chromium/issues/detail?id=239745)"
    },
    {
      "description":"Reportedly, using \"text/plain\" as the format for `event.dataTransfer.setData` and `event.dataTransfer.getData` does not work in IE9-11 and causes a JS error. The format needs to be \"text\", which seems to work in all the mainstream browsers (Chrome, Safari, Firefox, IE9-11, Edge)."
    }
  ],
  "categories":[
    "HTML5"
  ],
  "stats":{
    "ie":{
      "5.5":"a #1 #3",
      "6":"a #1 #3",
      "7":"a #1 #3",
      "8":"a #1 #3",
      "9":"a #1 #3",
      "10":"a #2 #3",
      "11":"a #2 #3"
    },
    "edge":{
      "12":"a #2",
      "13":"a #2",
      "14":"a #2"
    },
    "firefox":{
      "2":"p",
      "3":"p",
      "3.5":"y",
      "3.6":"y",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"y",
      "3.2":"y",
      "4":"y",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"p",
      "9.5-9.6":"p",
      "10.0-10.1":"p",
      "10.5":"p",
      "10.6":"p",
      "11":"p",
      "11.1":"p",
      "11.5":"p",
      "11.6":"p",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"p",
      "11":"p",
      "11.1":"p",
      "11.5":"p",
      "12":"p",
      "12.1":"y",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"`dataTransfer.items` only supported by Chrome.\r\n\r\nCurrently no browser supports the `dropzone` attribute.\r\n\r\nFirefox supports any kind of DOM elements for `.setDragImage`. Chrome must have either an `HTMLImageElement` or any kind of DOM elements attached to the DOM and within the viewport of the browser for `.setDragImage`.",
  "notes_by_num":{
    "1":"Partial support refers to no support for the `dataTransfer.files` or `.types` objects",
    "2":"Partial support refers to not supporting `.setDragImage`",
    "3":"Partial support refers to limited supported formats for `dataTransfer.setData`/`getData`."
  },
  "usage_perc_y":43.27,
  "usage_perc_a":7.91,
  "ucprefix":false,
  "parent":"",
  "keywords":"draganddrop",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],161:[function(require,module,exports){
module.exports={
  "title":"Element.closest()",
  "description":"DOM method that returns the current element if it matches the given selector, or else the closest ancestor element that matches the given selector, or else null.",
  "spec":"https://dom.spec.whatwg.org/#dom-element-closest",
  "status":"ls",
  "links":[
    {
      "url":"https://developer.mozilla.org/en-US/docs/Web/API/Element/closest",
      "title":"Mozilla Developer Network"
    },
    {
      "url":"https://github.com/jonathantneal/closest",
      "title":"Polyfill"
    },
    {
      "url":"https://wpdev.uservoice.com/forums/257854-microsoft-edge-developer/suggestions/10119510-element-closest",
      "title":"Microsoft Edge feature request on UserVoice"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "DOM"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":66.82,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"",
  "keywords":"element,closest,dom",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],162:[function(require,module,exports){
module.exports={
  "title":"EOT - Embedded OpenType fonts",
  "description":"Type of font that can be derived from a regular font, allowing small files and legal use of high-quality fonts. Usage is restricted by the file being tied to the website",
  "spec":"http://www.w3.org/Submission/EOT/",
  "status":"unoff",
  "links":[
    {
      "url":"http://en.wikipedia.org/wiki/Embedded_OpenType",
      "title":"Wikipedia"
    },
    {
      "url":"http://www.microsoft.com/typography/web/embedding/default.aspx",
      "title":"Example pages"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "Other"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"n"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n",
      "41":"n",
      "42":"n",
      "43":"n",
      "44":"n",
      "45":"n",
      "46":"n",
      "47":"n",
      "48":"n",
      "49":"n",
      "50":"n",
      "51":"n",
      "52":"n",
      "53":"n",
      "54":"n"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n",
      "TP":"n"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"n"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"n"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"n"
    },
    "and_chr":{
      "50":"n"
    },
    "and_ff":{
      "46":"n"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"n"
    }
  },
  "notes":"Proposal by Microsoft, being considered for W3C standardization.",
  "notes_by_num":{
    
  },
  "usage_perc_y":6.41,
  "usage_perc_a":0,
  "ucprefix":false,
  "parent":"fontface",
  "keywords":"",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],163:[function(require,module,exports){
module.exports={
  "title":"ECMAScript 5",
  "description":"Full support for the ECMAScript 5 specification. Features include `Function.prototype.bind`, Array methods like `indexOf`, `forEach`, `map` & `filter`, Object methods like `defineProperty`, `create` & `keys`, the `trim` method on Strings and many more.",
  "spec":"http://www.ecma-international.org/ecma-262/5.1/",
  "status":"other",
  "links":[
    {
      "url":"http://kangax.github.io/compat-table/es5/",
      "title":"Detailed compatibility tables & tests"
    },
    {
      "url":"http://ejohn.org/blog/ecmascript-5-objects-and-properties/",
      "title":"Overview of objects & properties"
    },
    {
      "url":"https://github.com/es-shims/es5-shim",
      "title":"ES5 polyfill"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "JS API"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n #4",
      "9":"a #2",
      "10":"y",
      "11":"y"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"a",
      "3":"a",
      "3.5":"a",
      "3.6":"a",
      "4":"a #1",
      "5":"a #1",
      "6":"a #1",
      "7":"a #1",
      "8":"a #1",
      "9":"a #1",
      "10":"a #1",
      "11":"a #1",
      "12":"a #1",
      "13":"a #1",
      "14":"a #1",
      "15":"a #1",
      "16":"a #1",
      "17":"a #1",
      "18":"a #1",
      "19":"a #1",
      "20":"a #1",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"a",
      "5":"a",
      "6":"a",
      "7":"a",
      "8":"a",
      "9":"a",
      "10":"a",
      "11":"a",
      "12":"a",
      "13":"a",
      "14":"a",
      "15":"a",
      "16":"a",
      "17":"a",
      "18":"a",
      "19":"a #1",
      "20":"a #1",
      "21":"a #1",
      "22":"a #1",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"a",
      "3.2":"a",
      "4":"a",
      "5":"a",
      "5.1":"a",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"a",
      "9.5-9.6":"a",
      "10.0-10.1":"a",
      "10.5":"a",
      "10.6":"a",
      "11":"a",
      "11.1":"a",
      "11.5":"a",
      "11.6":"a",
      "12":"a",
      "12.1":"a #1",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"a",
      "4.0-4.1":"a",
      "4.2-4.3":"a",
      "5.0-5.1":"a",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"a #1"
    },
    "android":{
      "2.1":"a",
      "2.2":"a",
      "2.3":"a",
      "3":"a",
      "4":"a #1 #2 #3",
      "4.1":"a #1",
      "4.2-4.3":"a #1",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"a",
      "10":"y"
    },
    "op_mob":{
      "10":"a",
      "11":"a",
      "11.1":"a",
      "11.5":"a",
      "12":"a",
      "12.1":"a #1",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"As the specification includes many JavaScript features, un-numbered partial support varies widely and is shown in detail on the [ECMAScript 5 compatibilty tables](http://kangax.github.io/compat-table/es5/) by Kangax.",
  "notes_by_num":{
    "1":"Does not support `parseInt()` ignoring leading zeros. ",
    "2":"Does not support Strict mode",
    "3":"Does not support zero-width chars in identifiers & Immutable `undefined`",
    "4":"IE8 has virtually no ES5 support, but does support `Object.defineProperty`, `Object.getOwnPropertyDescriptor`, JSON parsing & Property access on strings"
  },
  "usage_perc_y":90.13,
  "usage_perc_a":7.2,
  "ucprefix":false,
  "parent":"",
  "keywords":"es5,function.bind,array.foreach,array.indexof,array.map,date.now,defineproperties,getprototypeof,keys,seal,freeze,preventextensions,issealed,isfrozen,isextensible,getownpropertydescriptorgetownpropertynames,toisostringc,isarray,lastindexof,every,some,reduce,reduceright,getter,setter",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],164:[function(require,module,exports){
module.exports={
  "title":"ES6 Number",
  "description":"Extensions to the `Number` built-in object in ES6, including constant properties `EPSILON`, `MIN_SAFE_INTEGER`, and `MAX_SAFE_INTEGER`, and methods ` isFinite`, `isInteger`, `isSafeInteger`, and `isNaN`.",
  "spec":"http://www.ecma-international.org/ecma-262/6.0/#sec-number-objects",
  "status":"other",
  "links":[
    {
      "url":"http://www.2ality.com/2015/04/numbers-math-es6.html",
      "title":"New number and Math features in ES6"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "JS API"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"a #1",
      "17":"a #1",
      "18":"a #1",
      "19":"a #1",
      "20":"a #1",
      "21":"a #1",
      "22":"a #1",
      "23":"a #1",
      "24":"a #1",
      "25":"a #2",
      "26":"a #2",
      "27":"a #2",
      "28":"a #2",
      "29":"a #2",
      "30":"a #2",
      "31":"a #3",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"a #4",
      "20":"a #4",
      "21":"a #4",
      "22":"a #4",
      "23":"a #4",
      "24":"a #4",
      "25":"a #4",
      "26":"a #4",
      "27":"a #4",
      "28":"a #4",
      "29":"a #4",
      "30":"a #4",
      "31":"a #4",
      "32":"a #4",
      "33":"a #4",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"a #4",
      "16":"a #4",
      "17":"a #4",
      "18":"a #4",
      "19":"a #4",
      "20":"a #4",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"a #4",
      "4.2-4.3":"a #4",
      "4.4":"a #4",
      "4.4.3-4.4.4":"a #4",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"a #4"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Partial refers to only supporting the `isFinite`, `isInteger`, and `isNaN` methods.",
    "2":"Partial refers to supporting the same as #1 and the addition of the `EPSILON` property.",
    "3":"Partial refers to supporting all new features except the `isSafeInteger` method.",
    "4":"Partial refers to only supporting the `isFinite` and `isNaN` methods."
  },
  "usage_perc_y":71.87,
  "usage_perc_a":12.26,
  "ucprefix":false,
  "parent":"",
  "keywords":"ES6,JavaScript,number,built-in,EPSILON,MIN_SAFE_INTEGER,MAX_SAFE_INTEGER,isFinite,isInteger,isSafeInteger,isNaN",
  "ie_id":"numberbuiltinses6",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],165:[function(require,module,exports){
module.exports={
  "title":"Server-sent events",
  "description":"Method of continuously sending data from a server to the browser, rather than repeatedly requesting it (EventSource interface, used to fall under HTML5)",
  "spec":"https://html.spec.whatwg.org/multipage/comms.html#server-sent-events",
  "status":"ls",
  "links":[
    {
      "url":"http://www.html5rocks.com/tutorials/eventsource/basics/",
      "title":"HTML5 Rocks tutorial"
    },
    {
      "url":"http://samshull.blogspot.com/2010/10/ajax-push-in-ios-safari-and-chrome-with.html",
      "title":"Blog post with demo"
    },
    {
      "url":"https://raw.github.com/phiggins42/has.js/master/detect/features.js#native-eventsource",
      "title":"has.js test"
    },
    {
      "url":"https://github.com/Yaffle/EventSource",
      "title":"Polyfill"
    }
  ],
  "bugs":[
    {
      "description":"Reportedly, CORS in EventSource is currently supported in Firefox 10+, Opera 12+, Chrome 26+, Safari 7.0+."
    },
    {
      "description":"In Firefox prior to version 36 server-sent events do not reconnect automatically in case of a connection interrupt ([bug](https://bugzilla.mozilla.org/show_bug.cgi?id=831392))"
    },
    {
      "description":"Firefox currently does not support [EventSource in web/shared workers](https://bugzilla.mozilla.org/show_bug.cgi?id=876498)"
    },
    {
      "description":"Antivirus software may block the event streaming data chunks."
    }
  ],
  "categories":[
    "JS API"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"u"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"y",
      "5.1":"y",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"a",
      "9.5-9.6":"a",
      "10.0-10.1":"a",
      "10.5":"a",
      "10.6":"a",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"y",
      "4.2-4.3":"y",
      "5.0-5.1":"y",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"y",
      "10":"y"
    },
    "op_mob":{
      "10":"a",
      "11":"a",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    
  },
  "usage_perc_y":83.47,
  "usage_perc_a":0.05,
  "ucprefix":false,
  "parent":"",
  "keywords":"serversent,s-sent-events",
  "ie_id":"serversenteventseventsource",
  "chrome_id":"5311740673785856",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],166:[function(require,module,exports){
module.exports={
  "title":"Fetch",
  "description":"A modern replacement for XMLHttpRequest.",
  "spec":"https://fetch.spec.whatwg.org/",
  "status":"ls",
  "links":[
    {
      "url":"https://github.com/github/fetch",
      "title":"Polyfill"
    },
    {
      "url":"http://addyosmani.com/demos/fetch-api/",
      "title":"Demo"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "JS API"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n"
    },
    "edge":{
      "12":"n",
      "13":"n",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n d #1 #4",
      "35":"n d #1 #4",
      "36":"n d #1 #4",
      "37":"n d #1 #4",
      "38":"n d #1 #4",
      "39":"y #4",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"n",
      "28":"n",
      "29":"n",
      "30":"n",
      "31":"n",
      "32":"n",
      "33":"n",
      "34":"n",
      "35":"n",
      "36":"n",
      "37":"n",
      "38":"n",
      "39":"n",
      "40":"a #2",
      "41":"a #2 #3",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"n",
      "6.1":"n",
      "7":"n",
      "7.1":"n",
      "8":"n",
      "9":"n",
      "9.1":"n",
      "10":"n #5",
      "TP":"n #5"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "11.6":"n",
      "12":"n",
      "12.1":"n",
      "15":"n",
      "16":"n",
      "17":"n",
      "18":"n",
      "19":"n",
      "20":"n",
      "21":"n",
      "22":"n",
      "23":"n",
      "24":"n",
      "25":"n",
      "26":"n",
      "27":"a #2",
      "28":"a #2 #3",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"n",
      "7.0-7.1":"n",
      "8":"n",
      "8.1-8.4":"n",
      "9.0-9.2":"n",
      "9.3":"n"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"n",
      "4.4.3-4.4.4":"n",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"n"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"n",
      "11.5":"n",
      "12":"n",
      "12.1":"n",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"n"
    },
    "and_uc":{
      "9.9":"n"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Partial support can be enabled in Firefox with the `dom.fetch.enabled` flag.",
    "2":"Only available in Chrome and Opera within ServiceWorkers.",
    "3":"Available in Chrome and Opera within Window and Workers by enabling the \"Experimental Web Platform Features\" flag in `chrome://flags`",
    "4":"Firefox <40 is not completely conforming to the specs and does not respect the <base> tag for relative URIs in fetch requests. https://bugzilla.mozilla.org/show_bug.cgi?id=1161625",
    "5":"Appears to exist in Safari Technical Preview but does not work in current build. Should work in [next preview build](https://twitter.com/xeenon/status/715379838081576960)",
    "6":"Can be enabled in `about:flags`"
  },
  "usage_perc_y":59.33,
  "usage_perc_a":0.2,
  "ucprefix":false,
  "parent":"",
  "keywords":"fetch,service,workers,xhr,xmlhttprequest",
  "ie_id":"fetchapi",
  "chrome_id":"6730533392351232",
  "firefox_id":"fetch",
  "webkit_id":"specification-fetch-api",
  "shown":true
}

},{}],167:[function(require,module,exports){
module.exports={
  "title":"disabled attribute of the fieldset element",
  "description":"Allows disabling all of the form control descendants of a fieldset via a `disabled` attribute on the fieldset element itself.",
  "spec":"https://html.spec.whatwg.org/multipage/forms.html#attr-fieldset-disabled",
  "status":"ls",
  "links":[
    {
      "url":"http://output.jsbin.com/bibiqi/1/edit",
      "title":"JS Bin Testcase/Demo"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "DOM",
    "HTML5"
  ],
  "stats":{
    "ie":{
      "5.5":"u",
      "6":"a #1 #2",
      "7":"a #1 #2",
      "8":"a #1",
      "9":"a #1",
      "10":"a #1 #2",
      "11":"a #1 #2"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"n",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"n",
      "11":"n",
      "12":"n",
      "13":"n",
      "14":"n",
      "15":"n",
      "16":"u",
      "17":"u",
      "18":"u",
      "19":"u",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"u",
      "9.5-9.6":"u",
      "10.0-10.1":"y",
      "10.5":"y",
      "10.6":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"a #1 #2"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"n",
      "4":"n",
      "4.1":"n",
      "4.2-4.3":"n",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"y"
    },
    "op_mob":{
      "10":"y",
      "11":"y",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"a #2"
    },
    "and_uc":{
      "9.9":"y"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Text inputs that are descendants of a disabled fieldset appear disabled but the user can still interact with them. [See IE bug #962368.](https://connect.microsoft.com/IE/feedbackdetail/view/962368/can-still-edit-input-type-text-within-fieldset-disabled)",
    "2":"File inputs that are descendants of a disabled fieldset appear disabled but the user can still interact with them. [See IE bug #817488.](https://connect.microsoft.com/IE/feedbackdetail/view/817488)"
  },
  "usage_perc_y":84.82,
  "usage_perc_a":11.66,
  "ucprefix":false,
  "parent":"",
  "keywords":"HTMLFieldSetElement,fieldset,disabled",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],168:[function(require,module,exports){
module.exports={
  "title":"File API",
  "description":"Method of manipulating file objects in web applications client-side, as well as programmatically selecting them and accessing their data.",
  "spec":"http://www.w3.org/TR/FileAPI/",
  "status":"wd",
  "links":[
    {
      "url":"https://developer.mozilla.org/en/Using_files_from_web_applications",
      "title":"MDN article"
    },
    {
      "url":"http://docs.webplatform.org/wiki/apis/file",
      "title":"WebPlatform Docs"
    },
    {
      "url":"https://github.com/moxiecode/moxie",
      "title":"Polyfill"
    }
  ],
  "bugs":[
    
  ],
  "categories":[
    "JS API"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"a #2",
      "11":"a #2"
    },
    "edge":{
      "12":"a #2",
      "13":"a #2",
      "14":"a #2"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"a #2",
      "4":"a #2",
      "5":"a #2",
      "6":"a #2",
      "7":"a #2",
      "8":"a #2",
      "9":"a #2",
      "10":"a #2",
      "11":"a #2",
      "12":"a #2",
      "13":"a #2",
      "14":"a #2",
      "15":"a #2",
      "16":"a #2",
      "17":"a #2",
      "18":"a #2",
      "19":"a #2",
      "20":"a #2",
      "21":"a #2",
      "22":"a #2",
      "23":"a #2",
      "24":"a #2",
      "25":"a #2",
      "26":"a #2",
      "27":"a #2",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"a #1 #2",
      "7":"a #1 #2",
      "8":"a #1 #2",
      "9":"a #1 #2",
      "10":"a #1 #2",
      "11":"a #1 #2",
      "12":"a #1 #2",
      "13":"a #2",
      "14":"a #2",
      "15":"a #2",
      "16":"a #2",
      "17":"a #2",
      "18":"a #2",
      "19":"a #2",
      "20":"a #2",
      "21":"a #2",
      "22":"a #2",
      "23":"a #2",
      "24":"a #2",
      "25":"a #2",
      "26":"a #2",
      "27":"a #2",
      "28":"a #2",
      "29":"a #2",
      "30":"a #2",
      "31":"a #2",
      "32":"a #2",
      "33":"a #2",
      "34":"a #2",
      "35":"a #2",
      "36":"a #2",
      "37":"a #2",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"a #1 #2",
      "6":"a #2",
      "6.1":"a #2",
      "7":"a #2",
      "7.1":"a #2",
      "8":"a #2",
      "9":"a #2",
      "9.1":"a #2",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"a #2",
      "11.5":"a #2",
      "11.6":"a #2",
      "12":"a #2",
      "12.1":"a #2",
      "15":"a #2",
      "16":"a #2",
      "17":"a #2",
      "18":"a #2",
      "19":"a #2",
      "20":"a #2",
      "21":"a #2",
      "22":"a #2",
      "23":"a #2",
      "24":"a #2",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"a #2",
      "7.0-7.1":"a #2",
      "8":"a #2",
      "8.1-8.4":"a #2",
      "9.0-9.2":"a #2",
      "9.3":"a #2"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"a #1 #2",
      "4":"a #1 #2",
      "4.1":"a #1 #2",
      "4.2-4.3":"a #1 #2",
      "4.4":"a #2",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"a #1 #2",
      "10":"a #2"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"a #2",
      "11.5":"a #2",
      "12":"a #2",
      "12.1":"a #2",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"n",
      "11":"a #2"
    },
    "and_uc":{
      "9.9":"a #2"
    },
    "samsung":{
      "4":"y"
    }
  },
  "notes":"",
  "notes_by_num":{
    "1":"Does not have `FileReader` support. ",
    "2":"Does not support the `File` constructor"
  },
  "usage_perc_y":61.17,
  "usage_perc_a":30.61,
  "ucprefix":false,
  "parent":"",
  "keywords":"FileReader",
  "ie_id":"",
  "chrome_id":"",
  "firefox_id":"",
  "webkit_id":"",
  "shown":true
}

},{}],169:[function(require,module,exports){
module.exports={
  "title":"FileReader API",
  "description":"Method of reading the contents of a File or Blob object into memory",
  "spec":"http://www.w3.org/TR/FileAPI/#dfn-filereader",
  "status":"wd",
  "links":[
    {
      "url":"https://developer.mozilla.org/en/DOM/FileReader",
      "title":"FileReader API"
    },
    {
      "url":"http://docs.webplatform.org/wiki/apis/file/FileReader",
      "title":"WebPlatform Docs"
    }
  ],
  "bugs":[
    {
      "description":"The FileReader object is not available in Firefox to web workers. [A fix is in progress](https://bugzilla.mozilla.org/show_bug.cgi?id=901097)."
    },
    {
      "description":"iOS 8 had some [fileReader bugs](http://blog.fineuploader.com/2014/09/10/ios8-presents-serious-issues-that-prevent-file-uploading/) of which some were fixed in 8.0.2 but others still remain."
    }
  ],
  "categories":[
    "JS API"
  ],
  "stats":{
    "ie":{
      "5.5":"n",
      "6":"n",
      "7":"n",
      "8":"n",
      "9":"n",
      "10":"a #1",
      "11":"a #1"
    },
    "edge":{
      "12":"y",
      "13":"y",
      "14":"y"
    },
    "firefox":{
      "2":"n",
      "3":"n",
      "3.5":"n",
      "3.6":"y",
      "4":"y",
      "5":"y",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y"
    },
    "chrome":{
      "4":"n",
      "5":"n",
      "6":"y",
      "7":"y",
      "8":"y",
      "9":"y",
      "10":"y",
      "11":"y",
      "12":"y",
      "13":"y",
      "14":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y",
      "41":"y",
      "42":"y",
      "43":"y",
      "44":"y",
      "45":"y",
      "46":"y",
      "47":"y",
      "48":"y",
      "49":"y",
      "50":"y",
      "51":"y",
      "52":"y",
      "53":"y",
      "54":"y"
    },
    "safari":{
      "3.1":"n",
      "3.2":"n",
      "4":"n",
      "5":"n",
      "5.1":"n",
      "6":"y",
      "6.1":"y",
      "7":"y",
      "7.1":"y",
      "8":"y",
      "9":"y",
      "9.1":"y",
      "10":"y",
      "TP":"y"
    },
    "opera":{
      "9":"n",
      "9.5-9.6":"n",
      "10.0-10.1":"n",
      "10.5":"n",
      "10.6":"n",
      "11":"n",
      "11.1":"y",
      "11.5":"y",
      "11.6":"y",
      "12":"y",
      "12.1":"y",
      "15":"y",
      "16":"y",
      "17":"y",
      "18":"y",
      "19":"y",
      "20":"y",
      "21":"y",
      "22":"y",
      "23":"y",
      "24":"y",
      "25":"y",
      "26":"y",
      "27":"y",
      "28":"y",
      "29":"y",
      "30":"y",
      "31":"y",
      "32":"y",
      "33":"y",
      "34":"y",
      "35":"y",
      "36":"y",
      "37":"y",
      "38":"y",
      "39":"y",
      "40":"y"
    },
    "ios_saf":{
      "3.2":"n",
      "4.0-4.1":"n",
      "4.2-4.3":"n",
      "5.0-5.1":"n",
      "6.0-6.1":"y",
      "7.0-7.1":"y",
      "8":"y",
      "8.1-8.4":"y",
      "9.0-9.2":"y",
      "9.3":"y"
    },
    "op_mini":{
      "all":"n"
    },
    "android":{
      "2.1":"n",
      "2.2":"n",
      "2.3":"n",
      "3":"y",
      "4":"y",
      "4.1":"y",
      "4.2-4.3":"y",
      "4.4":"y",
      "4.4.3-4.4.4":"y",
      "50":"y"
    },
    "bb":{
      "7":"n",
      "10":"y"
    },
    "op_mob":{
      "10":"n",
      "11":"n",
      "11.1":"y",
      "11.5":"y",
      "12":"y",
      "12.1":"y",
      "37":"y"
    },
    "and_chr":{
      "50":"y"
    },
    "and_ff":{
      "46":"y"
    },
    "ie_mob":{
      "10":"y",
      "11":"y"
    },
    "and_uc":{
    }