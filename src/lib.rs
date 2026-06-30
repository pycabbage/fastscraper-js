#![deny(clippy::all)]

mod node_list;
pub use node_list::NativeNodeList;

use std::cell::RefCell;
use std::collections::HashMap;
use std::rc::Rc;
use std::sync::Arc;

use ego_tree::NodeId;
use napi_derive::napi;
use scraper::{ElementRef, Html, Selector};

thread_local! {
    static SELECTOR_CACHE: RefCell<HashMap<String, Arc<Selector>>> =
        RefCell::new(HashMap::new());
}

fn get_selector(selector: &str) -> napi::Result<Arc<Selector>> {
  SELECTOR_CACHE.with(|cache| {
    let mut cache = cache.borrow_mut();
    if let Some(sel) = cache.get(selector) {
      return Ok(Arc::clone(sel));
    }
    let sel = Selector::parse(selector).map_err(|e| napi::Error::from_reason(e.to_string()))?;
    let sel = Arc::new(sel);
    cache.insert(selector.to_string(), Arc::clone(&sel));
    Ok(sel)
  })
}

#[napi]
pub fn parse_document(html: String) -> HtmlDocument {
  HtmlDocument {
    html: Rc::new(Html::parse_document(&html)),
  }
}

#[napi]
pub fn parse_fragment(html: String) -> HtmlDocument {
  HtmlDocument {
    html: Rc::new(Html::parse_fragment(&html)),
  }
}

#[napi]
pub struct HtmlDocument {
  html: Rc<Html>,
}

#[napi]
impl HtmlDocument {
  #[napi]
  pub fn select(&self, selector: String) -> napi::Result<NativeNodeList> {
    let sel = get_selector(&selector)?;
    let node_ids = self.html.select(&sel).map(|e| e.id()).collect();
    Ok(NativeNodeList::new(Rc::clone(&self.html), node_ids))
  }

  #[napi]
  pub fn select_first(&self, selector: String) -> napi::Result<Option<HtmlElement>> {
    let sel = get_selector(&selector)?;
    Ok(self.html.select(&sel).next().map(|e| HtmlElement {
      html: Rc::clone(&self.html),
      node_id: e.id(),
    }))
  }
}

#[napi]
pub struct HtmlElement {
  html: Rc<Html>,
  node_id: NodeId,
}

impl HtmlElement {
  pub(crate) fn new(html: Rc<Html>, node_id: NodeId) -> Self {
    Self { html, node_id }
  }

  fn element_ref(&self) -> napi::Result<ElementRef<'_>> {
    let node_ref = self
      .html
      .tree
      .get(self.node_id)
      .ok_or_else(|| napi::Error::from_reason("Node not found"))?;
    ElementRef::wrap(node_ref).ok_or_else(|| napi::Error::from_reason("Node is not an element"))
  }
}

#[napi]
impl HtmlElement {
  #[napi]
  pub fn tag_name(&self) -> napi::Result<String> {
    Ok(self.element_ref()?.value().name().to_string())
  }

  #[napi]
  pub fn text(&self) -> napi::Result<String> {
    Ok(self.element_ref()?.text().collect::<String>())
  }

  #[napi]
  pub fn inner_html(&self) -> napi::Result<String> {
    Ok(self.element_ref()?.inner_html())
  }

  #[napi]
  pub fn outer_html(&self) -> napi::Result<String> {
    Ok(self.element_ref()?.html())
  }

  #[napi]
  pub fn attr(&self, name: String) -> napi::Result<Option<String>> {
    Ok(
      self
        .element_ref()?
        .value()
        .attr(&name)
        .map(|s| s.to_string()),
    )
  }

  #[napi]
  pub fn attrs(&self) -> napi::Result<HashMap<String, String>> {
    Ok(
      self
        .element_ref()?
        .value()
        .attrs()
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .collect(),
    )
  }

  #[napi]
  pub fn has_class(&self, class_name: String) -> napi::Result<bool> {
    Ok(
      self
        .element_ref()?
        .value()
        .classes()
        .any(|c| c == class_name),
    )
  }

  #[napi]
  pub fn select(&self, selector: String) -> napi::Result<NativeNodeList> {
    let sel = get_selector(&selector)?;
    let node_ids = self.element_ref()?.select(&sel).map(|e| e.id()).collect();
    Ok(NativeNodeList::new(Rc::clone(&self.html), node_ids))
  }

  #[napi]
  pub fn select_first(&self, selector: String) -> napi::Result<Option<HtmlElement>> {
    let sel = get_selector(&selector)?;
    Ok(
      self
        .element_ref()?
        .select(&sel)
        .next()
        .map(|e| HtmlElement {
          html: Rc::clone(&self.html),
          node_id: e.id(),
        }),
    )
  }

  #[napi]
  pub fn children(&self) -> napi::Result<NativeNodeList> {
    let node_ids = self
      .element_ref()?
      .children()
      .filter_map(ElementRef::wrap)
      .map(|e| e.id())
      .collect();
    Ok(NativeNodeList::new(Rc::clone(&self.html), node_ids))
  }
}
