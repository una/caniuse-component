const caniuse = require('caniuse-api');

class ResultBlock {
  constructor(name) {
    this.name = name;
  }

  listSupport() {
    return caniuse.getSupport(this.name)
  };
}

console.log(new ResultBlock('border-radius').listSupport());
