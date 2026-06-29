# fastscraper-js

[![CI](https://github.com/pycabbage/fastscraper-js/actions/workflows/CI.yml/badge.svg)](https://github.com/pycabbage/fastscraper-js/actions/workflows/CI.yml)

Fast HTML parser with CSS selector API for Node.js and browsers, powered by Rust ([scraper](https://github.com/causal-agent/scraper) crate).

## Installation

```bash
npm install fastscraper-js
# or
pnpm add fastscraper-js
```

## Usage

```ts
import { parseDocument, parseFragment } from "fastscraper-js"

// Parse a full HTML document
const doc = parseDocument(`
  <html>
    <body>
      <h1 class="title">Hello</h1>
      <ul>
        <li><a href="https://example.com">Link 1</a></li>
        <li><a href="https://example.org">Link 2</a></li>
      </ul>
    </body>
  </html>
`)

// Select all matching elements
const links = doc.select("a")
for (const link of links) {
  console.log(link.attr("href")) // "https://example.com", "https://example.org"
  console.log(link.text())       // "Link 1", "Link 2"
}

// Select the first matching element
const h1 = doc.selectFirst("h1")
console.log(h1?.text())      // "Hello"
console.log(h1?.tagName())   // "h1"
console.log(h1?.hasClass("title")) // true

// Parse an HTML fragment
const frag = parseFragment('<p class="note">Hello <strong>world</strong></p>')
const p = frag.selectFirst("p")
console.log(p?.innerHtml())  // "Hello <strong>world</strong>"
console.log(p?.outerHtml())  // '<p class="note">Hello <strong>world</strong></p>'
```

## API

### `parseDocument(html: string): HtmlDocument`

Parses a full HTML document. The parser follows the HTML5 specification.

### `parseFragment(html: string): HtmlDocument`

Parses an HTML fragment.

### `HtmlDocument`

| Method | Returns | Description |
|--------|---------|-------------|
| `select(selector)` | `HtmlElement[]` | Returns all elements matching the CSS selector |
| `selectFirst(selector)` | `HtmlElement \| null` | Returns the first matching element, or `null` |

### `HtmlElement`

| Method | Returns | Description |
|--------|---------|-------------|
| `tagName()` | `string` | Tag name in lowercase (e.g. `"div"`) |
| `text()` | `string` | Concatenated text content of the element and its descendants |
| `innerHtml()` | `string` | Inner HTML of the element |
| `outerHtml()` | `string` | Outer HTML including the element's own tag |
| `attr(name)` | `string \| null` | Value of the named attribute, or `null` if absent |
| `attrs()` | `Record<string, string>` | All attributes as a key-value object |
| `hasClass(className)` | `boolean` | Whether the element has the given class |
| `select(selector)` | `HtmlElement[]` | Selects descendants matching the CSS selector |
| `selectFirst(selector)` | `HtmlElement \| null` | Selects the first matching descendant |
| `children()` | `HtmlElement[]` | Direct element children (text nodes excluded) |

Both `select` and `selectFirst` throw if the selector is invalid.

## WebAssembly support

### Browser

Bundlers (Vite, webpack, etc.) automatically select the WASM build via the `browser` condition in `package.json`. No configuration needed.

```ts
import { parseDocument } from "fastscraper-js"
// → resolves to the WASM build automatically in browser environments
```

The WASM runtime is provided by the optional dependency `fastscraper-js-wasm32-wasi`, which is installed automatically alongside the main package.

### Node.js

By default, the native binary is used. To force the WASM build in Node.js:

```bash
NAPI_RS_FORCE_WASI=true node your-script.js
```

## Build from source

Requires Rust and Node.js 18+.

```bash
pnpm install
pnpm build
pnpm test
```
