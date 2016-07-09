const caniuse = require('caniuse-api');
const DOMContainer = document.querySelector('#caniuse-container')

class ResultBlock {
  constructor(name) {
    this.name = name;
  }

  allSupport() {
    return caniuse.getSupport(this.name)
  };

  specificSupport(browsers) {

    // iterate through each browser and show its support via caniuse info:
    // y: Since which browser version the feature is available
    // n: Up to which browser version the feature is unavailable
    // a: Up to which browser version the feature is partially supported
    // X: Up to which browser version the feature is prefixed
    let browserSupport = browsers.map( browser => this.allSupport()[browser]);

    return browserSupport;
  }

  parseSupport(browserSupport) {

  }

  buildBlock(browsers) {
    // get individual browerser
    // get their infos
    DOMContainer.innerHTML =
    `<table>
      <tr>
        // for each brower
        <th>${browser}</th>
      </tr>
      <tr>
        // browesr info
      </tr>
    </table>`;
  }
}

// console.log(new ResultBlock('border-radius', true).allSupport());
console.log(new ResultBlock('border-radius', true).specificSupport(['chrome', 'firefox', 'safari']));

// Outline
// ---
// have user specify which browsers they want to use:
// caniuseBuilder('prop-name', ['browser1', 'browser2', 'browser3'])
// if prop-name is invalid, list the property options
