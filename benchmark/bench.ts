import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import { fileURLToPath } from "node:url"
import { load as cheerioLoad } from "cheerio"
import { JSDOM } from "jsdom"
import { parseHTML } from "linkedom"
import { parse as nhpParse } from "node-html-parser"
import { Bench } from "tinybench"
import { parseDocument } from "../index.js"

const __dirname = fileURLToPath(new URL(".", import.meta.url))
const html = readFileSync(resolve(__dirname, "fixture.html"), "utf-8")

// --- 1. parse ---
// jsdom is very memory-heavy; use a fixed iteration count to avoid OOM.

const parseBench = new Bench({ name: "parse", iterations: 20 })

parseBench
  .add("fastscraper-js", () => {
    parseDocument(html)
  })
  .add("cheerio", () => {
    cheerioLoad(html)
  })
  .add("node-html-parser", () => {
    nhpParse(html)
  })
  .add("linkedom", () => {
    parseHTML(html)
  })
  .add("jsdom", () => {
    new JSDOM(html)
  })

// Pre-parse documents once for the remaining benchmarks (no per-iteration allocation)
const fastscraper_doc = parseDocument(html)
const cheerio_doc = cheerioLoad(html)
const nhp_doc = nhpParse(html)
const { document: linkedom_doc } = parseHTML(html)
const jsdom_doc = new JSDOM(html).window.document

// --- 2. select (all <a> links) ---

const selectBench = new Bench({ name: "select (a)", time: 500 })

selectBench
  .add("fastscraper-js", () => {
    fastscraper_doc.select("a")
  })
  .add("cheerio", () => {
    cheerio_doc("a").toArray()
  })
  .add("node-html-parser", () => {
    nhp_doc.querySelectorAll("a")
  })
  .add("linkedom", () => {
    linkedom_doc.querySelectorAll("a")
  })
  .add("jsdom", () => {
    jsdom_doc.querySelectorAll("a")
  })

// --- 3. select + text (all <p>, then get text) ---

const selectTextBench = new Bench({ name: "select + text (p)", time: 500 })

selectTextBench
  .add("fastscraper-js", () => {
    for (const el of fastscraper_doc.select("p")) {
      el.text()
    }
  })
  .add("cheerio", () => {
    cheerio_doc("p").each((_i, el) => {
      cheerio_doc(el).text()
    })
  })
  .add("node-html-parser", () => {
    for (const el of nhp_doc.querySelectorAll("p")) {
      el.textContent
    }
  })
  .add("linkedom", () => {
    for (const el of linkedom_doc.querySelectorAll("p")) {
      el.textContent
    }
  })
  .add("jsdom", () => {
    for (const el of jsdom_doc.querySelectorAll("p")) {
      el.textContent
    }
  })

// --- 4. select + attr (all <a href>, then get href) ---

const selectAttrBench = new Bench({
  name: "select + attr (a[href])",
  time: 500,
})

selectAttrBench
  .add("fastscraper-js", () => {
    for (const el of fastscraper_doc.select("a[href]")) {
      el.attr("href")
    }
  })
  .add("cheerio", () => {
    cheerio_doc("a[href]").each((_i, el) => {
      cheerio_doc(el).attr("href")
    })
  })
  .add("node-html-parser", () => {
    for (const el of nhp_doc.querySelectorAll("a[href]")) {
      el.getAttribute("href")
    }
  })
  .add("linkedom", () => {
    for (const el of linkedom_doc.querySelectorAll("a[href]")) {
      el.getAttribute("href")
    }
  })
  .add("jsdom", () => {
    for (const el of jsdom_doc.querySelectorAll("a[href]")) {
      el.getAttribute("href")
    }
  })

// --- Run all benches ---

const benches = [parseBench, selectBench, selectTextBench, selectAttrBench]

for (const bench of benches) {
  await bench.run()
  console.log(`\n## ${bench.name}`)
  console.table(bench.table())
}
