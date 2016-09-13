const caniuse = require('caniuse-api');
const DOMContainer = document.querySelector('#caniuse--result-list');
const defaultIcon = "<svg height='150px' width='150px' viewBox='0 0 200 200' x='0px' y='0px'> <circle cx='75' cy='75' fill='#000' r='75'></circle> <circle class='eye' cx='53' cy='65' fill='#FFF' r='8.5'></circle> <circle class='eye' cx='97' cy='65' fill='#FFF' r='8.5'></circle> <path d='M99.9,103.8 c0,0-9.8,9.2-25.4,9.2s-24.4-9.2-24.4-9.2' fill='none' stroke-linecap='round' stroke-miterlimit='10' stroke-width='6' stroke='#FFF'></path></svg>";

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

      console.log(`${browser} support for ${propName}: ${returnedResult}`);
      this.buildBlock(browserName, returnedResult, supportLevel, isPrefixed);
    }
  }

  buildBlock(browserName, publishedResult, supportLevel, isPrefixed) {

    // request the browser icon
    const xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function() {
      if (xhr.readyState == XMLHttpRequest.DONE) {
        let prefixMsg = '';
        let browserImg = '';

        // capitalizing Browser name
        browserName = browserName.replace(/(^|\s)[a-z]/g, (f) => {return f.toUpperCase();});

        // error handling
        if (xhr.status == 404) {
          browserImg = defaultIcon;
        } else {
          browserImg = xhr.responseText;
        }

        DOMContainer.innerHTML +=
         `<li class="support--${supportLevel}">
          <div class="caniuse--browser-img">${browserImg}</div>
          <h2 class="caniuse--browser-name">${browserName}</h2>
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
    };

    xhr.open('GET', `https://raw.githubusercontent.com/alrra/browser-logos/master/${browserName}/${browserName}.svg`, true);

    xhr.send(null);
  }
}

// Read the DOM and initiate based on data props
document.onreadystatechange = () => {
  if (document.readyState === 'complete') {
    const name = DOMContainer.getAttribute('data-propName');
    const browsers = DOMContainer.getAttribute('data-browsers').split(' ');
    console.log(name, browsers);
    new ResultBlock(name, true).browserResults(browsers);
  }
}
