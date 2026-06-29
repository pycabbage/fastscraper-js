#![deny(clippy::all)]

use std::collections::HashMap;
use std::rc::Rc;

use ego_tree::NodeId;
use napi_derive::napi;
use scraper::{ElementRef, Html, Selector};

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

fn select_from_html(html: &Rc<Html>, selector: &str) -> napi::Result<Vec<HtmlElement>> {
  let sel = Selector::parse(selector).map_err(|e| napi::Error::from_reason(e.to_string()))?;
  let ids: Vec<NodeId> = html.select(&sel).map(|e| e.id()).collect();
  Ok(
    ids
      .into_iter()
      .map(|node_id| HtmlElement {
        html: Rc::clone(html),
        node_id,
      })
      .collect(),
  )
}

fn select_first_from_html(html: &Rc<Html>, selector: &str) -> napi::Result<Option<HtmlElement>> {
  let sel = Selector::parse(selector).map_err(|e| napi::Error::from_reason(e.to_string()))?;
  let maybe_id = html.select(&sel).next().map(|e| e.id());
  Ok(maybe_id.map(|node_id| HtmlElement {
    html: Rc::clone(html),
    node_id,
  }))
}

fn select_from_element(
  html: &Rc<Html>,
  node_id: NodeId,
  selector: &str,
) -> napi::Result<Vec<HtmlElement>> {
  let sel = Selector::parse(selector).map_err(|e| napi::Error::from_reason(e.to_string()))?;
  let node_ref = html
    .tree
    .get(node_id)
    .ok_or_else(|| napi::Error::from_reason("Node not found"))?;
  let element_ref =
    ElementRef::wrap(node_ref).ok_or_else(|| napi::Error::from_reason("Node is not an element"))?;
  let ids: Vec<NodeId> = element_ref.select(&sel).map(|e| e.id()).collect();
  Ok(
    ids
      .into_iter()
      .map(|id| HtmlElement {
        html: Rc::clone(html),
        node_id: id,
      })
      .collect(),
  )
}

fn select_first_from_element(
  html: &Rc<Html>,
  node_id: NodeId,
  selector: &str,
) -> napi::Result<Option<HtmlElement>> {
  let sel = Selector::parse(selector).map_err(|e| napi::Error::from_reason(e.to_string()))?;
  let node_ref = html
    .tree
    .get(node_id)
    .ok_or_else(|| napi::Error::from_reason("Node not found"))?;
  let element_ref =
    ElementRef::wrap(node_ref).ok_or_else(|| napi::Error::from_reason("Node is not an element"))?;
  let maybe_id = element_ref.select(&sel).next().map(|e| e.id());
  Ok(maybe_id.map(|id| HtmlElement {
    html: Rc::clone(html),
    node_id: id,
  }))
}

#[napi]
impl HtmlDocument {
  #[napi]
  pub fn select(&self, selector: String) -> napi::Result<Vec<HtmlElement>> {
    select_from_html(&self.html, &selector)
  }

  #[napi]
  pub fn select_first(&self, selector: String) -> napi::Result<Option<HtmlElement>> {
    select_first_from_html(&self.html, &selector)
  }
}

#[napi]
pub struct HtmlElement {
  html: Rc<Html>,
  node_id: NodeId,
}

#[napi]
impl HtmlElement {
  #[napi]
  pub fn tag_name(&self) -> napi::Result<String> {
    let node_ref = self
      .html
      .tree
      .get(self.node_id)
      .ok_or_else(|| napi::Error::from_reason("Node not found"))?;
    let element_ref = ElementRef::wrap(node_ref)
      .ok_or_else(|| napi::Error::from_reason("Node is not an element"))?;
    Ok(element_ref.value().name().to_string())
  }

  #[napi]
  pub fn text(&self) -> napi::Result<String> {
    let node_ref = self
      .html
      .tree
      .get(self.node_id)
      .ok_or_else(|| napi::Error::from_reason("Node not found"))?;
    let element_ref = ElementRef::wrap(node_ref)
      .ok_or_else(|| napi::Error::from_reason("Node is not an element"))?;
    Ok(element_ref.text().collect::<String>())
  }

  #[napi]
  pub fn inner_html(&self) -> napi::Result<String> {
    let node_ref = self
      .html
      .tree
      .get(self.node_id)
      .ok_or_else(|| napi::Error::from_reason("Node not found"))?;
    let element_ref = ElementRef::wrap(node_ref)
      .ok_or_else(|| napi::Error::from_reason("Node is not an element"))?;
    Ok(element_ref.inner_html())
  }

  #[napi]
  pub fn outer_html(&self) -> napi::Result<String> {
    let node_ref = self
      .html
      .tree
      .get(self.node_id)
      .ok_or_else(|| napi::Error::from_reason("Node not found"))?;
    let element_ref = ElementRef::wrap(node_ref)
      .ok_or_else(|| napi::Error::from_reason("Node is not an element"))?;
    Ok(element_ref.html())
  }

  #[napi]
  pub fn attr(&self, name: String) -> napi::Result<Option<String>> {
    let node_ref = self
      .html
      .tree
      .get(self.node_id)
      .ok_or_else(|| napi::Error::from_reason("Node not found"))?;
    let element_ref = ElementRef::wrap(node_ref)
      .ok_or_else(|| napi::Error::from_reason("Node is not an element"))?;
    Ok(element_ref.value().attr(&name).map(|s| s.to_string()))
  }

  #[napi]
  pub fn attrs(&self) -> napi::Result<HashMap<String, String>> {
    let node_ref = self
      .html
      .tree
      .get(self.node_id)
      .ok_or_else(|| napi::Error::from_reason("Node not found"))?;
    let element_ref = ElementRef::wrap(node_ref)
      .ok_or_else(|| napi::Error::from_reason("Node is not an element"))?;
    Ok(
      element_ref
        .value()
        .attrs()
        .map(|(k, v)| (k.to_string(), v.to_string()))
        .collect(),
    )
  }

  #[napi]
  pub fn has_class(&self, class_name: String) -> napi::Result<bool> {
    let node_ref = self
      .html
      .tree
      .get(self.node_id)
      .ok_or_else(|| napi::Error::from_reason("Node not found"))?;
    let element_ref = ElementRef::wrap(node_ref)
      .ok_or_else(|| napi::Error::from_reason("Node is not an element"))?;
    Ok(element_ref.value().classes().any(|c| c == class_name))
  }

  #[napi]
  pub fn select(&self, selector: String) -> napi::Result<Vec<HtmlElement>> {
    select_from_element(&self.html, self.node_id, &selector)
  }

  #[napi]
  pub fn select_first(&self, selector: String) -> napi::Result<Option<HtmlElement>> {
    select_first_from_element(&self.html, self.node_id, &selector)
  }

  #[napi]
  pub fn children(&self) -> napi::Result<Vec<HtmlElement>> {
    let node_ref = self
      .html
      .tree
      .get(self.node_id)
      .ok_or_else(|| napi::Error::from_reason("Node not found"))?;
    let element_ref = ElementRef::wrap(node_ref)
      .ok_or_else(|| napi::Error::from_reason("Node is not an element"))?;
    let ids: Vec<NodeId> = element_ref
      .children()
      .filter_map(ElementRef::wrap)
      .map(|e| e.id())
      .collect();
    Ok(
      ids
        .into_iter()
        .map(|id| HtmlElement {
          html: Rc::clone(&self.html),
          node_id: id,
        })
        .collect(),
    )
  }
}
