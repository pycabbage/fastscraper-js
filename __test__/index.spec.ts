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

const whitespaceHtml = `<div>
  <p>  Hello   World  </p>
  <span>
    foo
    bar
  </span>
</div>`

describe("HtmlElement.parent", () => {
  test("returns parent element", () => {
    const doc = parseDocument(sampleHtml)
    const p = doc.selectFirst("p.intro")
    const parent = p?.parent()
    expect(parent?.attr("id")).toBe("main")
  })

  test("returns null for root element", () => {
    const doc = parseDocument(sampleHtml)
    const html = doc.selectFirst("html")
    // html's parent is the document root (non-element) → null
    expect(html?.parent()).toBeNull()
  })
})

describe("HtmlElement.nextSibling / prevSibling", () => {
  test("nextSibling returns the next element sibling", () => {
    const doc = parseDocument(sampleHtml)
    const first = doc.selectFirst("p.intro")
    const next = first?.nextSibling()
    expect(next?.attr("class")).toBe("content")
  })

  test("prevSibling returns the previous element sibling", () => {
    const doc = parseDocument(sampleHtml)
    const second = doc.selectFirst("p.content")
    const prev = second?.prevSibling()
    expect(prev?.attr("class")).toBe("intro")
  })

  test("nextSibling returns null for last sibling", () => {
    const doc = parseDocument(sampleHtml)
    const footer = doc.selectFirst("footer")
    expect(footer?.nextSibling()).toBeNull()
  })

  test("prevSibling returns null for first sibling", () => {
    const doc = parseDocument(sampleHtml)
    const h1 = doc.selectFirst("h1")
    expect(h1?.prevSibling()).toBeNull()
  })
})

describe("HtmlElement.classes", () => {
  test("returns all class names as an array", () => {
    const doc = parseDocument(sampleHtml)
    const div = doc.selectFirst("#main")
    expect(div?.classes()).toEqual(["container", "primary"])
  })

  test("returns empty array for element with no class", () => {
    const doc = parseDocument(sampleHtml)
    const h1 = doc.selectFirst("h1")
    expect(h1?.classes()).toEqual([])
  })

  test("returns single class", () => {
    const doc = parseDocument(sampleHtml)
    const p = doc.selectFirst("p.intro")
    expect(p?.classes()).toEqual(["intro"])
  })
})

describe("HtmlElement.textTrimmed", () => {
  test("collapses whitespace and trims", () => {
    const doc = parseDocument(whitespaceHtml)
    const p = doc.selectFirst("p")
    expect(p?.textTrimmed()).toBe("Hello World")
  })

  test("normalizes multi-line text", () => {
    const doc = parseDocument(whitespaceHtml)
    const span = doc.selectFirst("span")
    expect(span?.textTrimmed()).toBe("foo bar")
  })

  test("concatenates descendant text with single spaces", () => {
    const doc = parseDocument(whitespaceHtml)
    const div = doc.selectFirst("div")
    expect(div?.textTrimmed()).toBe("Hello World foo bar")
  })
})

describe("HtmlElement.closest", () => {
  test("returns self when it matches the selector", () => {
    const doc = parseDocument(sampleHtml)
    const p = doc.selectFirst("p.intro")
    expect(p?.closest("p")?.attr("class")).toBe("intro")
  })

  test("returns ancestor matching the selector", () => {
    const doc = parseDocument(sampleHtml)
    const a = doc.selectFirst("a")
    expect(a?.closest("#main")?.attr("id")).toBe("main")
  })

  test("returns null when no ancestor matches", () => {
    const doc = parseDocument(sampleHtml)
    const p = doc.selectFirst("p.intro")
    expect(p?.closest("section")).toBeNull()
  })

  test("stops at the first matching ancestor", () => {
    const doc = parseDocument(sampleHtml)
    const a = doc.selectFirst("a")
    // <a> → <li> → <ul> → <div#main> → ...
    expect(a?.closest("li")?.tagName()).toBe("li")
  })

  test("throws on invalid selector", () => {
    const doc = parseDocument(sampleHtml)
    const p = doc.selectFirst("p")
    expect(() => p?.closest("###bad")).toThrow()
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

describe("HtmlDocument.rootElement", () => {
  test("returns the <html> element", () => {
    const doc = parseDocument(sampleHtml)
    expect(doc.rootElement().tagName()).toBe("html")
  })
})

describe("HtmlDocument.html", () => {
  test("serializes the document back to HTML", () => {
    const doc = parseDocument("<p>hello</p>")
    const out = doc.html()
    expect(out).toContain("<p>hello</p>")
  })

  test("round-trips through parse → html", () => {
    const doc = parseDocument(sampleHtml)
    const out = doc.html()
    expect(out).toContain("Hello World")
    expect(out).toContain("https://example.com")
  })
})

describe("HtmlElement.id", () => {
  test("returns the id attribute value", () => {
    const doc = parseDocument(sampleHtml)
    const div = doc.selectFirst("#main")
    expect(div?.id()).toBe("main")
  })

  test("returns null for element without id", () => {
    const doc = parseDocument(sampleHtml)
    const p = doc.selectFirst("p.intro")
    expect(p?.id()).toBeNull()
  })
})

describe("HtmlElement.matches", () => {
  test("returns true when element matches selector", () => {
    const doc = parseDocument(sampleHtml)
    const div = doc.selectFirst("#main")
    expect(div?.matches("#main")).toBe(true)
    expect(div?.matches(".container")).toBe(true)
    expect(div?.matches("div")).toBe(true)
  })

  test("returns false when element does not match", () => {
    const doc = parseDocument(sampleHtml)
    const div = doc.selectFirst("#main")
    expect(div?.matches("p")).toBe(false)
    expect(div?.matches(".missing")).toBe(false)
  })

  test("throws on invalid selector", () => {
    const doc = parseDocument(sampleHtml)
    const div = doc.selectFirst("#main")
    expect(() => div?.matches("###bad")).toThrow()
  })
})

describe("HtmlElement.firstChild / lastChild", () => {
  test("firstChild returns the first element child", () => {
    const doc = parseDocument(sampleHtml)
    const div = doc.selectFirst("#main")
    expect(div?.firstChild()?.tagName()).toBe("h1")
  })

  test("lastChild returns the last element child", () => {
    const doc = parseDocument(sampleHtml)
    const div = doc.selectFirst("#main")
    expect(div?.lastChild()?.tagName()).toBe("ul")
  })

  test("firstChild returns null for leaf element", () => {
    const doc = parseDocument(sampleHtml)
    const h1 = doc.selectFirst("h1")
    expect(h1?.firstChild()).toBeNull()
  })

  test("lastChild returns null for leaf element", () => {
    const doc = parseDocument(sampleHtml)
    const h1 = doc.selectFirst("h1")
    expect(h1?.lastChild()).toBeNull()
  })
})

describe("HtmlElement.ancestors", () => {
  test("returns ancestors from nearest to farthest", () => {
    const doc = parseDocument(sampleHtml)
    const a = doc.selectFirst("a")
    const tags = [...(a?.ancestors() ?? [])].map((e) => e.tagName())
    // <a> is inside <li> → <ul> → <div#main> → <body> → <html>
    expect(tags[0]).toBe("li")
    expect(tags).toContain("ul")
    expect(tags).toContain("body")
    expect(tags[tags.length - 1]).toBe("html")
  })

  test("returns empty list for root element", () => {
    const doc = parseDocument(sampleHtml)
    const html = doc.selectFirst("html")
    expect(html?.ancestors()).toHaveLength(0)
  })
})

describe("HtmlElement.descendants", () => {
  test("returns all descendant elements", () => {
    const doc = parseDocument(sampleHtml)
    const ul = doc.selectFirst("ul")
    const tags = [...(ul?.descendants() ?? [])].map((e) => e.tagName())
    // <ul> contains <li>, <li>, <a>, <a>
    expect(tags).toContain("li")
    expect(tags).toContain("a")
    expect(tags).toHaveLength(4)
  })

  test("returns empty list for leaf element", () => {
    const doc = parseDocument(sampleHtml)
    const h1 = doc.selectFirst("h1")
    expect(h1?.descendants()).toHaveLength(0)
  })

  test("order is depth-first", () => {
    const doc = parseDocument(sampleHtml)
    const ul = doc.selectFirst("ul")
    const tags = [...(ul?.descendants() ?? [])].map((e) => e.tagName())
    // depth-first: li, a, li, a
    expect(tags).toEqual(["li", "a", "li", "a"])
  })
})
