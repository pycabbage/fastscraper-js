import { describe, expect, test } from "vitest"
import { parseDocument, parseFragment } from ".."

const sampleHtml = `
<!DOCTYPE html>
<html>
  <head><title>Test</title></head>
  <body>
    <div id="main" class="container primary">
      <h1>Hello World</h1>
      <p class="intro">First paragraph</p>
      <p class="content">Second paragraph</p>
      <ul>
        <li><a href="https://example.com">Link 1</a></li>
        <li><a href="https://example.org" class="external">Link 2</a></li>
      </ul>
    </div>
    <footer>Footer content</footer>
  </body>
</html>
`

describe("parseDocument", () => {
  test("returns an HtmlDocument", () => {
    const doc = parseDocument(sampleHtml)
    expect(doc).toBeDefined()
  })

  test("select returns matching elements", () => {
    const doc = parseDocument(sampleHtml)
    const paragraphs = doc.select("p")
    expect(paragraphs).toHaveLength(2)
  })

  test("select returns empty array for no match", () => {
    const doc = parseDocument(sampleHtml)
    const items = doc.select("section")
    expect(items).toHaveLength(0)
  })

  test("selectFirst returns first matching element", () => {
    const doc = parseDocument(sampleHtml)
    const first = doc.selectFirst("p")
    expect(first).not.toBeNull()
    expect(first?.text()).toBe("First paragraph")
  })

  test("selectFirst returns null for no match", () => {
    const doc = parseDocument(sampleHtml)
    const result = doc.selectFirst("section")
    expect(result).toBeNull()
  })

  test("throws on invalid selector", () => {
    const doc = parseDocument(sampleHtml)
    expect(() => doc.select("###invalid")).toThrow()
  })
})

describe("parseFragment", () => {
  test("parses an HTML fragment", () => {
    const doc = parseFragment('<span class="tag">Hello</span>')
    const span = doc.selectFirst("span")
    expect(span).not.toBeNull()
    expect(span?.text()).toBe("Hello")
  })

  test("select on fragment returns elements", () => {
    const doc = parseFragment("<ul><li>one</li><li>two</li></ul>")
    const items = doc.select("li")
    expect(items).toHaveLength(2)
  })
})

describe("HtmlElement.tagName", () => {
  test("returns lowercase tag name", () => {
    const doc = parseDocument(sampleHtml)
    const h1 = doc.selectFirst("h1")
    expect(h1?.tagName()).toBe("h1")
  })

  test("returns correct tags for different elements", () => {
    const doc = parseDocument(sampleHtml)
    const links = doc.select("a")
    for (const link of links) {
      expect(link.tagName()).toBe("a")
    }
  })
})

describe("HtmlElement.text", () => {
  test("returns text content", () => {
    const doc = parseDocument(sampleHtml)
    const h1 = doc.selectFirst("h1")
    expect(h1?.text()).toBe("Hello World")
  })

  test("concatenates descendant text nodes", () => {
    const doc = parseDocument(sampleHtml)
    const ul = doc.selectFirst("ul")
    const text = ul?.text() ?? ""
    expect(text).toContain("Link 1")
    expect(text).toContain("Link 2")
  })
})

describe("HtmlElement.innerHtml / outerHtml", () => {
  test("innerHtml returns content without the wrapping tag", () => {
    const doc = parseDocument(sampleHtml)
    const h1 = doc.selectFirst("h1")
    const inner = h1?.innerHtml() ?? ""
    expect(inner).toBe("Hello World")
    expect(inner).not.toContain("<h1>")
  })

  test("outerHtml includes the element tag itself", () => {
    const doc = parseDocument(sampleHtml)
    const h1 = doc.selectFirst("h1")
    const outer = h1?.outerHtml() ?? ""
    expect(outer).toContain("<h1>")
    expect(outer).toContain("Hello World")
    expect(outer).toContain("</h1>")
  })
})

describe("HtmlElement.attr", () => {
  test("returns attribute value", () => {
    const doc = parseDocument(sampleHtml)
    const link = doc.selectFirst("a")
    expect(link?.attr("href")).toBe("https://example.com")
  })

  test("returns null for missing attribute", () => {
    const doc = parseDocument(sampleHtml)
    const h1 = doc.selectFirst("h1")
    expect(h1?.attr("href")).toBeNull()
  })

  test("returns id attribute", () => {
    const doc = parseDocument(sampleHtml)
    const div = doc.selectFirst("#main")
    expect(div?.attr("id")).toBe("main")
  })
})

describe("HtmlElement.attrs", () => {
  test("returns all attributes as a record", () => {
    const doc = parseDocument(sampleHtml)
    const div = doc.selectFirst("#main")
    const attrs = div?.attrs() ?? {}
    expect(attrs.id).toBe("main")
    expect(attrs.class).toContain("container")
  })

  test("returns empty object for element with no attributes", () => {
    const doc = parseDocument(sampleHtml)
    const h1 = doc.selectFirst("h1")
    const attrs = h1?.attrs() ?? {}
    expect(Object.keys(attrs)).toHaveLength(0)
  })
})

describe("HtmlElement.hasClass", () => {
  test("returns true when class is present", () => {
    const doc = parseDocument(sampleHtml)
    const div = doc.selectFirst("#main")
    expect(div?.hasClass("container")).toBe(true)
    expect(div?.hasClass("primary")).toBe(true)
  })

  test("returns false when class is absent", () => {
    const doc = parseDocument(sampleHtml)
    const div = doc.selectFirst("#main")
    expect(div?.hasClass("missing")).toBe(false)
  })

  test("does not do partial matches", () => {
    const doc = parseDocument(sampleHtml)
    const link = doc.selectFirst("a.external")
    expect(link?.hasClass("extern")).toBe(false)
    expect(link?.hasClass("external")).toBe(true)
  })
})

describe("HtmlElement.select (nested)", () => {
  test("selects descendants relative to the element", () => {
    const doc = parseDocument(sampleHtml)
    const div = doc.selectFirst("#main")
    const links = div?.select("a") ?? []
    expect(links).toHaveLength(2)
  })

  test("returns empty array for no match", () => {
    const doc = parseDocument(sampleHtml)
    const h1 = doc.selectFirst("h1")
    const items = h1?.select("span") ?? []
    expect(items).toHaveLength(0)
  })

  test("throws on invalid selector", () => {
    const doc = parseDocument(sampleHtml)
    const div = doc.selectFirst("#main")
    expect(() => div?.select("###bad")).toThrow()
  })
})

describe("HtmlElement.selectFirst (nested)", () => {
  test("returns first matching descendant", () => {
    const doc = parseDocument(sampleHtml)
    const div = doc.selectFirst("#main")
    const p = div?.selectFirst("p")
    expect(p?.text()).toBe("First paragraph")
  })

  test("returns null for no match", () => {
    const doc = parseDocument(sampleHtml)
    const div = doc.selectFirst("#main")
    expect(div?.selectFirst("section")).toBeNull()
  })
})

describe("HtmlElement.children", () => {
  test("returns only element children (not text nodes)", () => {
    const doc = parseDocument(sampleHtml)
    const ul = doc.selectFirst("ul")
    const children = ul?.children() ?? []
    expect(children).toHaveLength(2)
    for (const child of children) {
      expect(child.tagName()).toBe("li")
    }
  })

  test("returns empty array for leaf element", () => {
    const doc = parseDocument(sampleHtml)
    const h1 = doc.selectFirst("h1")
    const children = h1?.children() ?? []
    expect(children).toHaveLength(0)
  })
})
