'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var caniuse = require('caniuse-api');
var DOMContainer = document.querySelector('#caniuse--result-list');
var defaultIcon = "<svg height='120px' width='120px' viewBox='0 0 150 150' x='0px' y='0px'> <circle cx='75' cy='75' fill='#000' r='75'></circle> <circle class='eye' cx='53' cy='65' fill='#FFF' r='8.5'></circle> <circle class='eye' cx='97' cy='65' fill='#FFF' r='8.5'></circle> <path d='M99.9,103.8 c0,0-9.8,9.2-25.4,9.2s-24.4-9.2-24.4-9.2' fill='none' stroke-linecap='round' stroke-miterlimit='10' stroke-width='6' stroke='#FFF'></path></svg>";

var ResultBlock = function () {
  function ResultBlock(name) {
    _classCallCheck(this, ResultBlock);

    this.name = name;
  }

  _createClass(ResultBlock, [{
    key: 'supportCall',
    value: function supportCall() {
      return caniuse.getSupport(this.name);
    }
  }, {
    key: 'browserResults',
    value: function browserResults(browsers) {

      // iterate through each browser and show its support via caniuse info:
      // y: Since which browser version the feature is available
      // n: Up to which browser version the feature is unavailable
      // a: Up to which browser version the feature is partially supported
      // X: Up to which browser version the feature is prefixed
      var _iteratorNormalCompletion = true;
      var _didIteratorError = false;
      var _iteratorError = undefined;

      try {
        for (var _iterator = browsers[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
          var browser = _step.value;

          var browserName = browser;
          var returnedResult = void 0,
              supportLevel = void 0;
          var isPrefixed = false;
          var supportResults = this.supportCall()[browser];

          if (supportResults.y) {
            // its supported
            supportLevel = 'full';
            returnedResult = supportResults.y + '+';

            if (supportResults.a) {
              supportLevel = 'partial';
            }

            if (supportResults.x) {
              isPrefixed = true;
            }
          } else {
            supportLevel = 'none';
            returnedResult = 'no support';
          }

          this.buildBlock(browserName, returnedResult, supportLevel, isPrefixed);
        }
      } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
      } finally {
        try {
          if (!_iteratorNormalCompletion && _iterator.return) {
            _iterator.return();
          }
        } finally {
          if (_didIteratorError) {
            throw _iteratorError;
          }
        }
      }
    }
  }, {
    key: 'buildBlock',
    value: function buildBlock(browserName, publishedResult, supportLevel, isPrefixed) {
      var prefixMsg = void 0;

      // IE rewrites
      if (browserName === 'ie') {
        browserName = 'internet-explorer';
      }

      // check if theres a level of support
      function supportText(supportLevel) {
        if (supportLevel != 'none') {
          return '<p class="caniuse--support-level">' + supportLevel + '</p>';
        } else return '';
      }

      // check if there is a prefix
      function prefixText(isPrefixed) {
        if (isPrefixed) {
          // these should be switch statements
          if (browserName === 'chrome' || browserName === 'safari') {
            prefixMsg = '-webkit-';
          } else if (browserName === 'firefox') {
            prefixMsg = '-moz-';
          } else if (browserName === 'edge' || browserName === 'ie') {
            prefixMsg = '-ms-';
          } else if (browserName === 'opera') {
            prefixMsg = '-o-';
          }

          return '<p class="caniuse-prefix">' + prefixMsg + '</p>';
        } else {
          if (supportLevel != 'none') {
            return '<p class="caniuse-prefix">no prefix</p>';
          } else {
            return '';
          }
        }
      }

      DOMContainer.innerHTML += '<li class="support--' + supportLevel + '">\n        <img class="caniuse--browser-img" src="https://cdnjs.cloudflare.com/ajax/libs/browser-logos/35.1.0/' + browserName + '/' + browserName + '_256x256.png"/>\n        <h2 class="caniuse--browser-name">' + browserName.replace(/-/g, ' ').replace(/(^|\s)[a-z]/g, function (f) {
        return f.toUpperCase();
      }) + '</h2>\n        <h3 class="caniuse--browser-results">' + publishedResult + '</h3>\n        ' + supportText(supportLevel) + '\n        ' + prefixText(isPrefixed) + '\n      </li>';
    }
  }]);

  return ResultBlock;
}();

// Read the DOM and initiate based on data props


document.onreadystatechange = function () {
  if (document.readyState === 'complete') {
    var name = DOMContainer.getAttribute('data-propName');
    var browsers = DOMContainer.getAttribute('data-browsers').split(' ');
    new ResultBlock(name, true).browserResults(browsers);
  }
};
