'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var caniuse = require('caniuse-api');

var ResultBlock = function () {
  function ResultBlock(name) {
    _classCallCheck(this, ResultBlock);

    this.name = name;
  }

  _createClass(ResultBlock, [{
    key: 'listSupport',
    value: function listSupport() {
      return caniuse.getSupport(this.name);
    }
  }]);

  return ResultBlock;
}();

console.log(new ResultBlock('border-radius').listSupport());