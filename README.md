# Caniuse Component

Instant, up-to-date, and theme-able browser statistics for your presentations (so you don't have to update your slides the night before!)

### [Here is a Demo 😄](https://una.im/caniuse-component/)

- customizable style based on a variable system
- adaptive text color based on background [source](https://codepen.io/una/pen/oXgRYz)
- automatic browser logos & caniuse data
- not compatible with IE 6/7

## Usage

### Node Implementation

Install via NPM: `npm install caniuse-component` -- include the js and css source.

### Reveal.js Implementation

To use this with [Reveal.js](https://github.com/hakimel/reveal.js/), npm install, then apply this source as a plugin:

```
Reveal.initialize({
  // setup things here:
  // ...

  // plugins here:
  dependencies: [
    { src: '../node_modules/caniuse-component/scripts.js', async: true },
    { src: '../node_modules/caniuse-component/styles.css' }
  ]
});
```

Then, include this element on your page:

```
<ul id="caniuse--result-list"
    data-propName="css-filters"
    data-browsers="opera safari firefox chrome edge">
</ul>
```

| name | function | usage | options |
|--- |--- |--- |--- |
| **id** | Applies styles to list | `id="caniuse--result-list"` | You only get one option unless you make your own |
| **propName** | CSS Property Name | `data-propName="css-filters"` | See [Caniuse API](https://github.com/nyalab/caniuse-api) and [options](https://github.com/Fyrd/caniuse/tree/master/features-json) |
| **browsers** | Browsers to check support from | `data-browsers="firefox chrome safari"`  | `edge`, `chrome`, `safari`, `ie`, `firefox`, `opera` |


## Development & Contribution

NPM scripts are used as the build system, so to develop, run: `npm run dev`. Consumable files are distributed in the root, and source files live within `/src`.

To contribute: Please clone this down and submit a PR, or open an issue. 😘

## Credits

- [Caniuse API](https://github.com/nyalab/caniuse-api)
- [Browser Logos](https://github.com/alrra/browser-logos/)
