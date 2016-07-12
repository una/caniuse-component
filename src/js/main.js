const caniuse = require('caniuse-api');
const DOMContainer = document.querySelector('#caniuse--result-list')

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
      let supportLevel = '';
      let isPrefixed = false;
      let supportResults = this.supportCall()[browser];

      if (supportResults.y) { // its supported
        supportLevel = 'full';
        returnedResult = supportResults.y;

        if (supportResults.a) {
          supportLevel = 'partial';
        }

        if (supportResults.x) {
          isPrefixed = true;
        }
      } else {
        supportLevel = 'none';
        returnedResult = 'not supported';
      }

      console.log(`${browser} support for ${propName}: ${returnedResult}`);
      this.buildBlock(browserName, returnedResult, supportLevel, isPrefixed);
    }
  }

  buildBlock(browserName, publishedResult, supportLevel, isPrefixed) {
    // get individual browser
    // get their infos
    // let supportMsg = 'fully supported';
    let prefixMsg = '';
    // if !supportLevel {
    //   supportMsg == 'Not Fully Supported;
    // }

    DOMContainer.innerHTML +=
    `
    <li class="support--${supportLevel}">
      <h2 class="caniuse--browser-name">${browserName}</h2>
      <img src="http://placehold.it/50"/>
      <p class="caniuse--browser-results">${publishedResult}</p>
      <p class="caniuse--support-level">${supportLevel}</p>
    `;

    if (isPrefixed) {
      // these should be switch statements
      if (browserName == 'chrome') {
        prefixMsg = '-webkit';
      }
      else if (browserName == 'firefox') {
        prefixMsg = '-moz';
      }
      else if (browserName == 'edge') {
        prefixMsg = '-ms';
      };

      `<p class="caniuse-prefix">${prefixMsg}</p>`;
    }

    `</li>`;
  }
}

// Read the DOM to initiate
document.onreadystatechange = () => {
  if (document.readyState === 'complete') {
    let name = DOMContainer.getAttribute('data-propName');
    let browsers = DOMContainer.getAttribute('data-browsers').split(' ');
    console.log(name, browsers);
    new ResultBlock(name, true).browserResults(browsers)
  }
};

// call it in code:
// new ResultBlock('css-filters', true).browserResults(['chrome', 'firefox', 'safari', 'edge']);

// Outline
// ---
// have user specify which browsers they want to use:
// caniuseBuilder('prop-name', ['browser1', 'browser2', 'browser3'])
// if prop-name is invalid, list the property options
