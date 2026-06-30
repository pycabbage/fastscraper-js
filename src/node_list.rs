use std::rc::Rc;

use ego_tree::NodeId;
use napi::bindgen_prelude::Generator;
use napi_derive::napi;
use scraper::Html;

use crate::HtmlElement;

/// A lazily-iterable, indexable list of `HtmlElement`s returned by `select()`/`ancestors()`/etc.
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

  /// Advances the iterator and returns the next `HtmlElement`, or `null` when exhausted.
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
  /// The number of elements in this list.
  #[napi(getter)]
  pub fn length(&self) -> u32 {
    self.node_ids.len() as u32
  }

  /// Returns the element at the given index, or `null` if out of bounds.
  #[napi]
  pub fn item(&self, index: u32) -> Option<HtmlElement> {
    self
      .node_ids
      .get(index as usize)
      .map(|&node_id| HtmlElement::new(Rc::clone(&self.html), node_id))
  }
}
