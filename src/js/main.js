const caniuse = require('caniuse-api');
const DOMContainer = document.querySelector('#caniuse--result-list');
const defaultIcon = "<svg height='120px' width='120px' viewBox='0 0 150 150' x='0px' y='0px'> <circle cx='75' cy='75' fill='#000' r='75'></circle> <circle class='eye' cx='53' cy='65' fill='#FFF' r='8.5'></circle> <circle class='eye' cx='97' cy='65' fill='#FFF' r='8.5'></circle> <path d='M99.9,103.8 c0,0-9.8,9.2-25.4,9.2s-24.4-9.2-24.4-9.2' fill='none' stroke-linecap='round' stroke-miterlimit='10' stroke-width='6' stroke='#FFF'></path></svg>";

class ResultBlock {
  constructor(name) {
    this.name = name;
  }

  supportCall() {
    return caniuse.getSupport(this.name);
  }

  browserResults(browsers) {

    // iterate through each browser and show its support via caniuse info:
    // y: Since which browser version the feature is available
    // n: Up to which browser version the feature is unavailable
    // a: Up to which browser version the feature is partially supported
    // X: Up to which browser version the feature is prefixed
    for (let browser of browsers) {
      const browserName = browser;
      const propName = this.name;
      let returnedResult = '';
      let supportLevel = '';
      let isPrefixed = false;
      const supportResults = this.supportCall()[browser];

      if (supportResults.y) { // its supported
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
  }

  buildBlock(browserName, publishedResult, supportLevel, isPrefixed) {

    let prefixMsg = '';

    DOMContainer.innerHTML +=
     `<li class="support--${supportLevel}">
      <img class="caniuse--browser-img" src="https://cdnjs.cloudflare.com/ajax/libs/browser-logos/35.1.0/${browserName}/${browserName}_256x256.png"/>
      <h2 class="caniuse--browser-name">${browserName.replace(/(^|\s)[a-z]/g, (f) => {return f.toUpperCase();})}</h2>
      <h3 class="caniuse--browser-results">${publishedResult}</h3>
      <p class="caniuse--support-level">support: ${supportLevel}</p>`;

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
      }

      `<p class="caniuse-prefix">${prefixMsg}</p>`;
    }

    `</li>`;
  }
}

// Read the DOM and initiate based on data props
document.onreadystatechange = () => {
  if (document.readyState === 'complete') {
    const name = DOMContainer.getAttribute('data-propName');
    const browsers = DOMContainer.getAttribute('data-browsers').split(' ');
    new ResultBlock(name, true).browserResults(browsers);
  }
}
