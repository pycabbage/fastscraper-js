use std::rc::Rc;

use ego_tree::NodeId;
use napi::bindgen_prelude::Generator;
use napi_derive::napi;
use scraper::Html;

use crate::HtmlElement;

#[napi(iterator)]
pub struct NativeNodeList {
  html: Rc<Html>,
  node_ids: Vec<NodeId>,
  index: usize,
}

impl NativeNodeList {
  pub(crate) fn new(html: Rc<Html>, node_ids: Vec<NodeId>) -> Self {
    Self {
      html,
      node_ids,
      index: 0,
    }
  }
}

#[napi]
impl Generator for NativeNodeList {
  type Yield = HtmlElement;
  type Next = ();
  type Return = ();

  fn next(&mut self, _value: Option<Self::Next>) -> Option<Self::Yield> {
    if self.index < self.node_ids.len() {
      let node_id = self.node_ids[self.index];
      self.index += 1;
      Some(HtmlElement::new(Rc::clone(&self.html), node_id))
    } else {
      None
    }
  }
}

#[napi]
impl NativeNodeList {
  #[napi(getter)]
  pub fn length(&self) -> u32 {
    self.node_ids.len() as u32
  }

  #[napi]
  pub fn item(&self, index: u32) -> Option<HtmlElement> {
    self
      .node_ids
      .get(index as usize)
      .map(|&node_id| HtmlElement::new(Rc::clone(&self.html), node_id))
  }
}
