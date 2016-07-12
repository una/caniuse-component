const caniuse = require('caniuse-api');
const DOMContainer = document.querySelector('#caniuse-container')

class ResultBlock {
  constructor(name) {
    this.name = name;
  }

  supportCall() {
    return caniuse.getSupport(this.name);
  };

  browserResults(browsers) {

    // iterate through each browser and show its support via caniuse info:
    // y: Since which browser version the feature is available
    // n: Up to which browser version the feature is unavailable
    // a: Up to which browser version the feature is partially supported
    // X: Up to which browser version the feature is prefixed
    for (let browser of browsers) {
      let browserName = browser;
      let propName = this.name;
      let returnedResult = '';
      let supportResults = this.supportCall()[browser];

      if (supportResults.y) {
        returnedResult = supportResults.y;
      } else {
        returnedResult = 'not supported';
      }

      console.log(`${browser} support for ${propName}: ${returnedResult}`);
      this.buildBlock(browserName, returnedResult);
    }

    // return browserSupport;
  }

  parseSupport(browserSupport) {

  }

  buildBlock(browserName, publishedResult) {
    // get individual browerser
    // get their infos
    document.write(
    `<h1 class="caniuse--browser-name">${browserName}</h1>
    <img src="http://placehold.it/50"/>
    <p class="caniuse--browser-results">${publishedResult}
    `)
  }
}

// console.log(new ResultBlock('border-radius', true).allSupport());
new ResultBlock('font-stretch', true).browserResults(['chrome', 'firefox', 'safari']);

// Outline
// ---
// have user specify which browsers they want to use:
// caniuseBuilder('prop-name', ['browser1', 'browser2', 'browser3'])
// if prop-name is invalid, list the property options
