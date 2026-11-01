/* Minimal renderer for the LPW2A page template ({{holes}}, sc-for, sc-if, on* handlers). */
(function () {
  'use strict';
  function lookup(scope, path) {
    path = path.trim();
    if (path === 'true') return true;
    if (path === 'false') return false;
    var parts = path.split('.'), v = scope;
    for (var i = 0; i < parts.length; i++) { if (v == null) return undefined; v = v[parts[i]]; }
    return v;
  }
  var ONE = /^\s*\{\{([^}]+)\}\}\s*$/, ANY = /\{\{([^}]+)\}\}/g;
  var BOOL = { disabled: 1, required: 1, checked: 1, hidden: 1 };

  function renderNodes(tplParent, outParent, scope) {
    for (var n = tplParent.firstChild; n; n = n.nextSibling) renderNode(n, outParent, scope);
  }
  function renderNode(t, out, scope) {
    if (t.nodeType === 3) {
      out.appendChild(document.createTextNode(t.nodeValue.replace(ANY, function (_, p) { var v = lookup(scope, p); return v == null ? '' : String(v); })));
      return;
    }
    if (t.nodeType !== 1) return;
    var tag = t.localName;
    if (tag === 'sc-for') {
      var list = lookup(scope, (t.getAttribute('list').match(ONE) || [])[1] || '') || [];
      var as = t.getAttribute('as');
      for (var i = 0; i < list.length; i++) { var s = Object.create(scope); s[as] = list[i]; renderNodes(t, out, s); }
      return;
    }
    if (tag === 'sc-if') {
      if (lookup(scope, (t.getAttribute('value').match(ONE) || [])[1] || '')) renderNodes(t, out, scope);
      return;
    }
    var el = t.namespaceURI === 'http://www.w3.org/2000/svg' ? document.createElementNS(t.namespaceURI, tag) : document.createElement(tag);
    for (var a = 0; a < t.attributes.length; a++) {
      var at = t.attributes[a], name = at.name, val = at.value, m = val.match(ONE);
      if (name.indexOf('hint-') === 0) continue;
      if (/^on[a-z]+$/i.test(name) && m) {
        var fn = m ? lookup(scope, m[1]) : null;
        if (typeof fn === 'function') {
          var ev = name.slice(2).toLowerCase();
          if (ev === 'doubleclick') ev = 'dblclick';
          el.addEventListener(ev, fn);
        }
        continue;
      }
      if (m) {
        var v = lookup(scope, m[1]);
        if (BOOL[name]) { if (v === true || v === 'true') el.setAttribute(name, ''); continue; }
        if (v == null || v === false) continue;
        if (name === 'value' && tag === 'input') { el.value = String(v); }
        el.setAttribute(name, String(v));
      } else if (val.indexOf('{{') >= 0) {
        el.setAttribute(name, val.replace(ANY, function (_, p) { var x = lookup(scope, p); return x == null ? '' : String(x); }));
      } else {
        el.setAttribute(name, val);
      }
    }
    renderNodes(t.content ? t.content : t, el, scope);
    out.appendChild(el);
  }

  window.DCLogic = function (props) { this.props = props || {}; this.state = {}; };
  window.DCLogic.prototype.setState = function (patch) {
    var self = this;
    for (var k in patch) self.state[k] = patch[k];
    if (!self.__pending) { self.__pending = true; Promise.resolve().then(function () { self.__pending = false; self.__render(); }); }
  };

  window.mountPage = function (Comp, tplEl, root) {
    var c = new Comp({});
    c.__render = function () {
      // keep what visitors typed and where focus was
      var keep = {}, active = document.activeElement && document.activeElement.id;
      root.querySelectorAll('input[id],textarea[id]').forEach(function (i) {
        keep[i.id] = i.type === 'checkbox' ? { c: i.checked } : { v: i.value };
      });
      var frag = document.createDocumentFragment();
      renderNodes(tplEl.content, frag, c.renderVals());
      root.replaceChildren(frag);
      Object.keys(keep).forEach(function (id) {
        var i = document.getElementById(id); if (!i) return;
        if ('c' in keep[id]) i.checked = keep[id].c;
        else if (!i.hasAttribute('value') || i.getAttribute('value') === '') i.value = keep[id].v;
      });
      if (active) { var a = document.getElementById(active); if (a) a.focus({ preventScroll: true }); }
    };
    c.__render();
    return c;
  };
})();
