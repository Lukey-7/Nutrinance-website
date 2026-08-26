/**
 * Nutrinance E2E & Component Test Utilities
 * A lightweight, high-fidelity DOM & browser simulation harness built on Node.js
 */

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT_DIR = path.resolve(__dirname, '..');
const HTML_PATH = path.join(ROOT_DIR, 'index.html');
const CSS_PATH = path.join(ROOT_DIR, 'styles.css');
const JS_PATH = path.join(ROOT_DIR, 'script.js');

function loadHtml() {
  return fs.readFileSync(HTML_PATH, 'utf-8');
}

function loadCss() {
  return fs.readFileSync(CSS_PATH, 'utf-8');
}

function loadJs() {
  return fs.readFileSync(JS_PATH, 'utf-8');
}

/**
 * Lightweight DOM Token List implementation (classList)
 */
class DOMTokenList {
  constructor(element) {
    this.element = element;
    this._tokens = new Set();
    const className = element.getAttribute('class') || '';
    if (className.trim()) {
      className.trim().split(/\s+/).forEach(t => this._tokens.add(t));
    }
  }

  _sync() {
    this.element.setAttribute('class', Array.from(this._tokens).join(' '));
  }

  add(...tokens) {
    tokens.forEach(t => { if (t) this._tokens.add(t); });
    this._sync();
  }

  remove(...tokens) {
    tokens.forEach(t => this._tokens.delete(t));
    this._sync();
  }

  contains(token) {
    return this._tokens.has(token);
  }

  toggle(token, force) {
    if (typeof force !== 'undefined') {
      if (force) {
        this.add(token);
        return true;
      } else {
        this.remove(token);
        return false;
      }
    }
    if (this._tokens.has(token)) {
      this.remove(token);
      return false;
    } else {
      this.add(token);
      return true;
    }
  }

  toString() {
    return Array.from(this._tokens).join(' ');
  }
}

/**
 * Lightweight Text Node
 */
class DOMTextNode {
  constructor(text, ownerDocument) {
    this.nodeType = 3;
    this.tagName = '';
    this.textContent = text || '';
    this.ownerDocument = ownerDocument;
    this.parentElement = null;
    this.children = [];
    this.classList = { contains: () => false };
  }
  getAttribute() { return null; }
  hasAttribute() { return false; }
}

/**
 * Lightweight DOM Element
 */
class DOMElement {
  constructor(tagName, ownerDocument) {
    this.nodeType = 1;
    this.tagName = (tagName || 'div').toUpperCase();
    this.ownerDocument = ownerDocument;
    this.attributes = new Map();
    this.children = [];
    this.parentElement = null;
    this.eventListeners = new Map();
    this.style = {};
    this.dataset = {};
    this._classList = null;
    this._value = '';
    this._textContent = '';
    this.offsetTop = 0;
    this.offsetLeft = 0;
    this.offsetHeight = 50;
    this.offsetWidth = 100;
    this.clientWidth = 100;
    this.clientHeight = 50;
    this.scrollWidth = 100;
    this.scrollHeight = 50;
    this.scrollLeft = 0;
    this.scrollTop = 0;
    this._isFocused = false;
  }

  getBoundingClientRect() {
    return {
      top: this.offsetTop,
      left: this.offsetLeft,
      width: this.offsetWidth,
      height: this.offsetHeight,
      bottom: this.offsetTop + this.offsetHeight,
      right: this.offsetLeft + this.offsetWidth
    };
  }

  get textContent() {
    if (this.children.length > 0) {
      return this.children.map(c => c.textContent).join('');
    }
    return this._textContent || '';
  }
  set textContent(val) {
    this._textContent = String(val);
    this.children = [];
  }

  get id() {
    return this.getAttribute('id') || '';
  }
  set id(val) {
    this.setAttribute('id', val);
  }

  get className() {
    return this.getAttribute('class') || '';
  }
  set className(val) {
    this.setAttribute('class', val);
    this._classList = null;
  }

  get classList() {
    if (!this._classList) {
      this._classList = new DOMTokenList(this);
    }
    return this._classList;
  }

  get value() {
    if (this.tagName === 'SELECT' && !this._value && this.children.length > 0) {
      const opt = this.children.find(c => c.tagName === 'OPTION');
      return opt ? opt.textContent.trim() : '';
    }
    return this._value || this.getAttribute('value') || '';
  }
  set value(val) {
    this._value = String(val);
  }

  getAttribute(name) {
    return this.attributes.get(name.toLowerCase()) || null;
  }

  setAttribute(name, value) {
    const key = name.toLowerCase();
    const strVal = String(value);
    this.attributes.set(key, strVal);
    if (key.startsWith('data-')) {
      const camel = key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      this.dataset[camel] = strVal;
    }
    if (key === 'class' && this._classList) {
      this._classList._tokens = new Set(strVal.trim().split(/\s+/).filter(Boolean));
    }
  }

  hasAttribute(name) {
    return this.attributes.has(name.toLowerCase());
  }

  removeAttribute(name) {
    const key = name.toLowerCase();
    this.attributes.delete(key);
    if (key.startsWith('data-')) {
      const camel = key.slice(5).replace(/-([a-z])/g, (_, c) => c.toUpperCase());
      delete this.dataset[camel];
    }
    if (key === 'class' && this._classList) {
      this._classList._tokens.clear();
    }
  }

  appendChild(child) {
    if (child.parentElement) {
      child.parentElement.removeChild(child);
    }
    child.parentElement = this;
    this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) {
      this.children.splice(idx, 1);
      child.parentElement = null;
    }
    return child;
  }

  addEventListener(type, listener) {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type).push(listener);
  }

  removeEventListener(type, listener) {
    if (this.eventListeners.has(type)) {
      const list = this.eventListeners.get(type).filter(l => l !== listener);
      this.eventListeners.set(type, list);
    }
  }

  dispatchEvent(event) {
    event.target = this;
    event.currentTarget = this;
    const listeners = this.eventListeners.get(event.type) || [];
    for (const l of listeners) {
      l.call(this, event);
    }
    if (this.parentElement && !event._propagationStopped) {
      this.parentElement.dispatchEvent(event);
    }
    return !event.defaultPrevented;
  }

  click() {
    const ev = {
      type: 'click',
      target: this,
      currentTarget: this,
      preventDefault: () => {},
      stopPropagation: function() { this._propagationStopped = true; },
      _propagationStopped: false
    };
    this.dispatchEvent(ev);
  }

  focus() {
    this._isFocused = true;
    this.dispatchEvent({
      type: 'focus',
      target: this,
      currentTarget: this,
      preventDefault: () => {},
      stopPropagation: () => {}
    });
  }

  blur() {
    this._isFocused = false;
    this.dispatchEvent({
      type: 'blur',
      target: this,
      currentTarget: this,
      preventDefault: () => {},
      stopPropagation: () => {}
    });
  }

  scrollTo(options) {
    if (typeof options === 'object' && options !== null) {
      if (typeof options.left === 'number') this.scrollLeft = options.left;
      if (typeof options.top === 'number') this.scrollTop = options.top;
    }
    this.dispatchEvent({
      type: 'scroll',
      target: this,
      currentTarget: this,
      preventDefault: () => {},
      stopPropagation: () => {}
    });
  }

  get innerHTML() {
    return this._innerHTML || this.textContent;
  }
  set innerHTML(html) {
    this._innerHTML = html;
    this.children = [];
    if (html === '') {
      this.textContent = '';
    } else {
      const parsed = parseHtmlFragment(html, this.ownerDocument);
      parsed.forEach(c => this.appendChild(c));
    }
  }

  querySelector(selector) {
    const all = this.querySelectorAll(selector);
    return all.length > 0 ? all[0] : null;
  }

  querySelectorAll(selector) {
    const results = [];
    const matchFn = createSelectorMatcher(selector);
    function traverse(node) {
      for (const child of node.children) {
        if (matchFn(child)) {
          results.push(child);
        }
        traverse(child);
      }
    }
    traverse(this);
    return results;
  }
}

/**
 * Selector Matcher Compiler
 */
function createSelectorMatcher(selector) {
  const sel = selector.trim();

  // Comma-separated selectors
  if (sel.includes(',')) {
    const parts = sel.split(',').map(s => createSelectorMatcher(s.trim()));
    return el => parts.some(fn => fn(el));
  }

  // Direct child selectors (>)
  if (sel.includes('>')) {
    const parts = sel.split('>').map(s => s.trim()).filter(Boolean);
    const matchers = parts.map(createSelectorMatcher);
    return function(el) {
      if (!matchers[matchers.length - 1](el)) return false;
      let curr = el;
      for (let i = matchers.length - 2; i >= 0; i--) {
        curr = curr.parentElement;
        if (!curr || !matchers[i](curr)) return false;
      }
      return true;
    };
  }

  // Descendant selectors (space)
  if (sel.includes(' ')) {
    const segments = sel.split(/\s+/).filter(Boolean);
    const matchers = segments.map(createSingleMatcher);
    return function(el) {
      if (!matchers[matchers.length - 1](el)) return false;
      let curr = el.parentElement;
      let mIdx = matchers.length - 2;
      while (curr && mIdx >= 0) {
        if (matchers[mIdx](curr)) {
          mIdx--;
        }
        curr = curr.parentElement;
      }
      return mIdx < 0;
    };
  }

  return createSingleMatcher(sel);
}

function createSingleMatcher(s) {
  let remaining = s.trim();

  // 1. Extract and remove all attribute selectors first [attr=val]
  const attributes = [];
  const attrRegex = /\[([-a-zA-Z0-9_]+)(?:([*^$]?=)(?:"([^"]*)"|'([^']*)'|([^\]]+)))?\]/g;
  let aMatch;
  while ((aMatch = attrRegex.exec(remaining)) !== null) {
    const attrName = aMatch[1];
    const op = aMatch[2];
    const val = aMatch[3] !== undefined ? aMatch[3] : (aMatch[4] !== undefined ? aMatch[4] : aMatch[5]);
    attributes.push({ attrName, op, val });
  }
  remaining = remaining.replace(/\[([-a-zA-Z0-9_]+)(?:([*^$]?=)(?:"([^"]*)"|'([^']*)'|([^\]]+)))?\]/g, '');

  // 2. Extract tag name from beginning if present
  let tag = null;
  const tagMatch = remaining.match(/^[-a-zA-Z0-9]+/);
  if (tagMatch) {
    tag = tagMatch[0].toUpperCase();
    remaining = remaining.slice(tagMatch[0].length);
  }

  // 3. Extract ID selector (#id)
  let id = null;
  const idMatch = remaining.match(/#([-a-zA-Z0-9_]+)/);
  if (idMatch) {
    id = idMatch[1];
    remaining = remaining.replace(idMatch[0], '');
  }

  // 4. Extract class selectors (.class)
  const classes = [];
  const classRegex = /\.([-a-zA-Z0-9_]+)/g;
  let cMatch;
  while ((cMatch = classRegex.exec(remaining)) !== null) {
    classes.push(cMatch[1]);
  }
  remaining = remaining.replace(/\.([-a-zA-Z0-9_]+)/g, '');

  return function(el) {
    if (!el || el.nodeType !== 1) return false;
    if (tag && el.tagName !== tag) return false;
    if (id && el.getAttribute('id') !== id) return false;
    for (const c of classes) {
      if (!el.classList || !el.classList.contains(c)) return false;
    }
    for (const a of attributes) {
      if (!el.hasAttribute(a.attrName)) return false;
      if (a.op) {
        const actualVal = el.getAttribute(a.attrName) || '';
        if (a.op === '=' && actualVal !== a.val) return false;
        if (a.op === '^=' && !actualVal.startsWith(a.val)) return false;
        if (a.op === '$=' && !actualVal.endsWith(a.val)) return false;
        if (a.op === '*=' && !actualVal.includes(a.val)) return false;
      }
    }
    return true;
  };
}

/**
 * Lightweight HTML Parser
 */
function parseHtmlFragment(html, doc) {
  const elements = [];
  const tagRegex = /<(\/)?([a-zA-Z0-9-]+)([^>]*)>|([^<]+)/g;
  let match;
  const stack = [];

  const selfClosing = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
    'link', 'meta', 'param', 'source', 'track', 'wbr'
  ]);

  while ((match = tagRegex.exec(html)) !== null) {
    const [fullMatch, isClosing, rawTagName, rawAttrs, text] = match;

    if (text) {
      const trimmed = text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&mdash;/g, '—').replace(/&ndash;/g, '–').replace(/&bull;/g, '•');
      const textNode = new DOMTextNode(trimmed, doc);
      if (stack.length > 0) {
        stack[stack.length - 1].appendChild(textNode);
      } else {
        elements.push(textNode);
      }
      continue;
    }

    const tagName = rawTagName.toLowerCase();

    if (isClosing) {
      if (stack.length > 0) {
        let idx = stack.length - 1;
        while (idx >= 0 && stack[idx].tagName.toLowerCase() !== tagName) {
          idx--;
        }
        if (idx >= 0) {
          stack.length = idx;
        }
      }
      continue;
    }

    const el = new DOMElement(tagName, doc);

    // Parse attributes
    if (rawAttrs) {
      const attrRegex = /([a-zA-Z0-9_-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;
      let aMatch;
      while ((aMatch = attrRegex.exec(rawAttrs)) !== null) {
        const aName = aMatch[1];
        const aVal = aMatch[2] !== undefined ? aMatch[2] : (aMatch[3] !== undefined ? aMatch[3] : (aMatch[4] !== undefined ? aMatch[4] : ''));
        el.setAttribute(aName, aVal);
      }
    }

    if (stack.length > 0) {
      stack[stack.length - 1].appendChild(el);
    } else {
      elements.push(el);
    }

    if (!selfClosing.has(tagName) && !fullMatch.endsWith('/>')) {
      stack.push(el);
    }
  }

  return elements;
}

/**
 * DOM Document
 */
class DOMDocument {
  constructor() {
    this.documentElement = new DOMElement('html', this);
    this.head = new DOMElement('head', this);
    this.body = new DOMElement('body', this);
    this.documentElement.appendChild(this.head);
    this.documentElement.appendChild(this.body);
    this.eventListeners = new Map();
  }

  createElement(tagName) {
    return new DOMElement(tagName, this);
  }

  getElementById(id) {
    return this.documentElement.querySelector('#' + id);
  }

  querySelector(selector) {
    return this.documentElement.querySelector(selector);
  }

  querySelectorAll(selector) {
    return this.documentElement.querySelectorAll(selector);
  }

  addEventListener(type, listener) {
    if (!this.eventListeners.has(type)) {
      this.eventListeners.set(type, []);
    }
    this.eventListeners.get(type).push(listener);
  }

  removeEventListener(type, listener) {
    if (this.eventListeners.has(type)) {
      const list = this.eventListeners.get(type).filter(l => l !== listener);
      this.eventListeners.set(type, list);
    }
  }

  dispatchEvent(event) {
    event.target = this;
    event.currentTarget = this;
    const listeners = this.eventListeners.get(event.type) || [];
    for (const l of listeners) {
      l.call(this, event);
    }
  }
}

/**
 * Create a full Browser / Window sandbox for Nutrinance
 */
function createBrowserEnvironment(options = {}) {
  const htmlContent = loadHtml();
  const doc = new DOMDocument();

  // Parse HTML
  const parsedNodes = parseHtmlFragment(htmlContent, doc);
  const htmlNode = parsedNodes.find(n => n.tagName === 'HTML') || parsedNodes[0];

  if (htmlNode) {
    const headNode = htmlNode.children.find(c => c.tagName === 'HEAD');
    const bodyNode = htmlNode.children.find(c => c.tagName === 'BODY');
    if (headNode) doc.head = headNode;
    if (bodyNode) doc.body = bodyNode;
    doc.documentElement = htmlNode;
  }

  // Set default dimensions for sections to emulate page layout
  const allSections = doc.querySelectorAll('section, header, footer, div');
  allSections.forEach((sec, idx) => {
    sec.offsetTop = idx * 600;
    sec.offsetHeight = 500;
    sec.offsetWidth = 1200;
    sec.clientWidth = 1200;
    sec.clientHeight = 500;
    sec.scrollWidth = 1200;
    sec.scrollHeight = 500;
  });

  // Track opened URLs
  const openedUrls = [];

  // MatchMedia mock
  const mediaQueryListeners = new Map();
  const prefersReducedMotion = Boolean(options.prefersReducedMotion);

  const windowObj = {
    document: doc,
    scrollY: 0,
    scrollX: 0,
    get pageYOffset() { return this.scrollY; },
    set pageYOffset(v) { this.scrollY = v; },
    get pageXOffset() { return this.scrollX; },
    set pageXOffset(v) { this.scrollX = v; },
    innerWidth: options.innerWidth || 1280,
    innerHeight: options.innerHeight || 800,
    open: (url, target, features) => {
      openedUrls.push({ url, target, features });
      return { closed: false, close: () => {} };
    },
    scrollTo: (options) => {
      if (typeof options === 'object' && options !== null) {
        if (typeof options.top === 'number') {
          windowObj.scrollY = options.top;
        }
        if (typeof options.left === 'number') {
          windowObj.scrollX = options.left;
        }
      }
    },
    addEventListener: (type, listener, opts) => {
      doc.addEventListener(type, listener);
    },
    removeEventListener: (type, listener) => {
      doc.removeEventListener(type, listener);
    },
    dispatchEvent: (event) => {
      doc.dispatchEvent(event);
    },
    matchMedia: (query) => {
      const isReducedMotion = query.includes('prefers-reduced-motion: reduce') || query.includes('prefers-reduced-motion:reduce');
      const matches = isReducedMotion ? prefersReducedMotion : false;
      return {
        matches,
        media: query,
        addEventListener: (evt, cb) => {
          if (!mediaQueryListeners.has(query)) mediaQueryListeners.set(query, []);
          mediaQueryListeners.get(query).push(cb);
        },
        removeEventListener: (evt, cb) => {
          if (mediaQueryListeners.has(query)) {
            mediaQueryListeners.set(query, mediaQueryListeners.get(query).filter(fn => fn !== cb));
          }
        }
      };
    },
    history: {
      pushState: () => {},
      replaceState: () => {},
      back: () => {},
      forward: () => {}
    },
    location: {
      href: 'http://localhost:5599/',
      hash: '',
      pathname: '/',
      search: ''
    },
    requestAnimationFrame: (cb) => setTimeout(cb, 16),
    cancelAnimationFrame: (id) => clearTimeout(id),
    setTimeout: setTimeout,
    clearTimeout: clearTimeout,
    setInterval: setInterval,
    clearInterval: clearInterval,
    Date: Date,
    encodeURIComponent: encodeURIComponent,
    decodeURIComponent: decodeURIComponent,
    console: console,
    Array: Array,
    Object: Object,
    String: String,
    Number: Number,
    Math: Math,
    RegExp: RegExp,
    Set: Set,
    Map: Map
  };
  windowObj.window = windowObj;
  windowObj.self = windowObj;
  windowObj.globalThis = windowObj;

  // Mock IntersectionObserver
  class MockIntersectionObserver {
    constructor(callback, options) {
      this.callback = callback;
      this.options = options || {};
      this.observedElements = [];
      MockIntersectionObserver.instances.push(this);
    }
    observe(el) {
      this.observedElements.push(el);
    }
    unobserve(el) {
      this.observedElements = this.observedElements.filter(e => e !== el);
    }
    disconnect() {
      this.observedElements = [];
    }
    triggerIntersect(element, isIntersecting = true) {
      const entry = {
        target: element,
        isIntersecting,
        intersectionRatio: isIntersecting ? 1.0 : 0.0,
        boundingClientRect: { top: 0, bottom: 500, left: 0, right: 1000 }
      };
      this.callback([entry], this);
    }
  }
  MockIntersectionObserver.instances = [];
  windowObj.IntersectionObserver = MockIntersectionObserver;

  // Run script.js in this sandbox
  const scriptContent = loadJs();
  const context = vm.createContext(windowObj);

  function executeScript() {
    vm.runInContext(scriptContent, context);
    // Trigger DOMContentLoaded
    const ev = { type: 'DOMContentLoaded', target: doc, currentTarget: doc };
    doc.dispatchEvent(ev);
  }

  return {
    window: windowObj,
    document: doc,
    openedUrls,
    IntersectionObserver: MockIntersectionObserver,
    executeScript,
    getWhatsAppNumber: () => {
      return vm.runInContext('typeof WHATSAPP_NUMBER !== "undefined" ? WHATSAPP_NUMBER : null', context);
    }
  };
}

/**
 * CSS Parser for CSS rules, media queries, and token analysis
 */
function parseCssRules() {
  const css = loadCss();
  const rules = [];

  // Remove comments
  const cleanCss = css.replace(/\/\*[\s\S]*?\*\//g, '');

  // Extract CSS variables from :root
  const rootMatch = cleanCss.match(/:root\s*\{([^}]+)\}/);
  const customProperties = {};
  if (rootMatch) {
    const decls = rootMatch[1].split(';');
    decls.forEach(d => {
      const idx = d.indexOf(':');
      if (idx !== -1) {
        const prop = d.slice(0, idx).trim();
        const val = d.slice(idx + 1).trim();
        if (prop.startsWith('--')) {
          customProperties[prop] = val;
        }
      }
    });
  }

  // Extract media queries
  const mediaQueries = [];
  const mediaRegex = /@media\s*([^{]+)\{([\s\S]*?\})\s*\}/g;
  let mMatch;
  while ((mMatch = mediaRegex.exec(cleanCss)) !== null) {
    mediaQueries.push({
      condition: mMatch[1].trim(),
      body: mMatch[2].trim()
    });
  }

  // Extract keyframes
  const keyframes = [];
  const kfRegex = /@keyframes\s+([a-zA-Z0-9_-]+)\s*\{([\s\S]*?\})\s*\}/g;
  let kfMatch;
  while ((kfMatch = kfRegex.exec(cleanCss)) !== null) {
    keyframes.push({
      name: kfMatch[1],
      body: kfMatch[2].trim()
    });
  }

  return {
    raw: css,
    clean: cleanCss,
    customProperties,
    mediaQueries,
    keyframes
  };
}

/**
 * Lightweight Test Framework (describe, it, expect)
 */
class TestRunner {
  constructor() {
    this.suites = [];
    this.currentSuite = null;
    this.describe = this.describe.bind(this);
    this.it = this.it.bind(this);
    this.test = this.test.bind(this);
    this.beforeEach = this.beforeEach.bind(this);
    this.afterEach = this.afterEach.bind(this);
  }

  describe(name, fn) {
    const suite = {
      name,
      tests: [],
      beforeEach: [],
      afterEach: [],
      parent: this.currentSuite
    };
    if (this.currentSuite) {
      this.currentSuite.suites = this.currentSuite.suites || [];
      this.currentSuite.suites.push(suite);
    } else {
      this.suites.push(suite);
    }

    const prevSuite = this.currentSuite;
    this.currentSuite = suite;
    fn();
    this.currentSuite = prevSuite;
  }

  it(name, fn) {
    if (!this.currentSuite) {
      throw new Error(`Test "${name}" must be inside a describe block.`);
    }
    this.currentSuite.tests.push({ name, fn });
  }

  test(name, fn) {
    this.it(name, fn);
  }

  beforeEach(fn) {
    if (this.currentSuite) this.currentSuite.beforeEach.push(fn);
  }

  afterEach(fn) {
    if (this.currentSuite) this.currentSuite.afterEach.push(fn);
  }

  async run() {
    let total = 0;
    let passed = 0;
    let failed = 0;
    const failures = [];

    async function runSuite(suite, prefix = '') {
      const suiteName = prefix ? `${prefix} > ${suite.name}` : suite.name;

      for (const t of suite.tests) {
        total++;
        const startTime = Date.now();
        try {
          // run beforeEach
          let curr = suite;
          const beList = [];
          while (curr) {
            beList.unshift(...curr.beforeEach);
            curr = curr.parent;
          }
          for (const be of beList) await be();

          // run test
          await t.fn();

          // run afterEach
          curr = suite;
          const aeList = [];
          while (curr) {
            aeList.push(...curr.afterEach);
            curr = curr.parent;
          }
          for (const ae of aeList) await ae();

          passed++;
        } catch (err) {
          failed++;
          failures.push({
            suiteName,
            testName: t.name,
            error: err.message || String(err),
            stack: err.stack,
            duration: Date.now() - startTime
          });
        }
      }

      if (suite.suites) {
        for (const sub of suite.suites) {
          await runSuite(sub, suiteName);
        }
      }
    }

    for (const s of this.suites) {
      await runSuite(s);
    }

    return { total, passed, failed, failures };
  }
}

/**
 * Expect Assertion API with .not support
 */
function expect(actual) {
  function createMatchers(isNot = false) {
    return {
      toBe(expected) {
        const pass = actual === expected;
        if (isNot ? pass : !pass) {
          throw new Error(`Expected ${JSON.stringify(actual)} ${isNot ? 'not ' : ''}to be ${JSON.stringify(expected)}`);
        }
      },
      toEqual(expected) {
        const actJson = JSON.stringify(actual);
        const expJson = JSON.stringify(expected);
        const pass = actJson === expJson;
        if (isNot ? pass : !pass) {
          throw new Error(`Expected ${actJson} ${isNot ? 'not ' : ''}to equal ${expJson}`);
        }
      },
      toBeTruthy() {
        const pass = Boolean(actual);
        if (isNot ? pass : !pass) {
          throw new Error(`Expected ${JSON.stringify(actual)} ${isNot ? 'not ' : ''}to be truthy`);
        }
      },
      toBeFalsy() {
        const pass = !Boolean(actual);
        if (isNot ? pass : !pass) {
          throw new Error(`Expected ${JSON.stringify(actual)} ${isNot ? 'not ' : ''}to be falsy`);
        }
      },
      toBeGreaterThan(expected) {
        const pass = actual > expected;
        if (isNot ? pass : !pass) {
          throw new Error(`Expected ${actual} ${isNot ? 'not ' : ''}to be greater than ${expected}`);
        }
      },
      toBeGreaterThanOrEqual(expected) {
        const pass = actual >= expected;
        if (isNot ? pass : !pass) {
          throw new Error(`Expected ${actual} ${isNot ? 'not ' : ''}to be greater than or equal to ${expected}`);
        }
      },
      toBeLessThan(expected) {
        const pass = actual < expected;
        if (isNot ? pass : !pass) {
          throw new Error(`Expected ${actual} ${isNot ? 'not ' : ''}to be less than ${expected}`);
        }
      },
      toBeLessThanOrEqual(expected) {
        const pass = actual <= expected;
        if (isNot ? pass : !pass) {
          throw new Error(`Expected ${actual} ${isNot ? 'not ' : ''}to be less than or equal to ${expected}`);
        }
      },
      toContain(expected) {
        let pass = false;
        if (typeof actual === 'string') {
          pass = actual.includes(expected);
        } else if (Array.isArray(actual)) {
          pass = actual.includes(expected);
        } else if (actual && typeof actual.has === 'function') {
          pass = actual.has(expected);
        }
        if (isNot ? pass : !pass) {
          throw new Error(`Expected ${JSON.stringify(actual)} ${isNot ? 'not ' : ''}to contain ${JSON.stringify(expected)}`);
        }
      },
      toMatch(regex) {
        const pass = regex.test(actual);
        if (isNot ? pass : !pass) {
          throw new Error(`Expected "${actual}" ${isNot ? 'not ' : ''}to match pattern ${regex}`);
        }
      },
      toBeNull() {
        const pass = actual === null;
        if (isNot ? pass : !pass) {
          throw new Error(`Expected ${JSON.stringify(actual)} ${isNot ? 'not ' : ''}to be null`);
        }
      },
      toBeDefined() {
        const pass = typeof actual !== 'undefined';
        if (isNot ? pass : !pass) {
          throw new Error(`Expected value ${isNot ? 'not ' : ''}to be defined`);
        }
      },
      toThrow(expectedMsg) {
        if (typeof actual !== 'function') {
          throw new Error(`Expected function to test toThrow`);
        }
        let threw = false;
        let caughtErr = null;
        try {
          actual();
        } catch (err) {
          threw = true;
          caughtErr = err;
        }
        if (isNot) {
          if (threw) {
            throw new Error(`Expected function not to throw, but it threw: ${caughtErr.message}`);
          }
        } else {
          if (!threw) {
            throw new Error(`Expected function to throw, but it did not.`);
          }
          if (expectedMsg && !caughtErr.message.includes(expectedMsg)) {
            throw new Error(`Expected error message to include "${expectedMsg}", got "${caughtErr.message}"`);
          }
        }
      }
    };
  }

  const matchers = createMatchers(false);
  matchers.not = createMatchers(true);
  return matchers;
}

module.exports = {
  loadHtml,
  loadCss,
  loadJs,
  createBrowserEnvironment,
  parseCssRules,
  TestRunner,
  expect
};
