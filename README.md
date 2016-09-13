# Caniuse Component

Instant, up-to-date, and theme-able browser statistics for your presentations (so you don't have to update your slides the night before!)

- customizable style based on a variable system
- adaptive text color based on background [source](http://codepen.io/una/pen/oXgRYz)
- automatic browser logos & caniuse data
- not compatible with IE 6/7

## Usage

Your browser logo options are [here](https://github.com/alrra/browser-logos).

- chrome
- firefox
- opera
- edge

Your feature options are based on the [Caniuse API](https://github.com/nyalab/caniuse-api)

You just need to include this element on your page:

```
<ul id="caniuse--result-list"
    data-propName="css-filters"
    data-browsers="opera safari firefox chrome edge">
</ul>
```

| name | function | usage | options |
|--- |--- |--- |--- |
| **id** | Applies styles to list | `id="caniuse--result-list"` | You only get one option unless you make your own |
| **propName** | CSS Property Name | `data-propName="css-filters"` | See [Caniuse API](https://github.com/nyalab/caniuse-api) |
| **browsers** | Browsers to check support from | `data-browsers="firefox chrome safari"`  | See [Caniuse API](https://github.com/nyalab/caniuse-api) and [logos ](https://github.com/alrra/browser-logos) |


## Development & Contribution

To develop: `npm run dev`
To contribute: Please clone this down and submit a PR, or open an issue.

## Credits

- [Caniuse API](https://github.com/nyalab/caniuse-api)
- [Browser Logos](https://github.com/alrra/browser-logos/)
