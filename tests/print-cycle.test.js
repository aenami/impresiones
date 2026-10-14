const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");

function element(value = "") {
  const classes = new Set();
  return {
    value,
    checked: false,
    disabled: false,
    hidden: false,
    textContent: "",
    listeners: {},
    attributes: {},
    classList: {
      contains: (name) => classes.has(name),
      toggle: (name, force) => {
        const shouldAdd = force === undefined ? !classes.has(name) : force;
        if (shouldAdd) classes.add(name);
        else classes.delete(name);
        return shouldAdd;
      },
    },
    addEventListener(name, handler) { this.listeners[name] = handler; },
    setAttribute(name, value) { this.attributes[name] = value; },
    focus() { this.focused = true; },
    matches() { return false; },
    closest(selector) { return selector === "#cycle-actions" && this.inCycleActions ? {} : null; },
    append(...children) { this.children.push(...children); },
    replaceChildren(...children) { this.children = children; },
    children: [],
  };
}

function productItem() {
  const fields = Object.fromEntries(
    ["code", "description", "quantity", "unitPrice"].map((name) => {
      const field = element();
      field.dataset = { field: name };
      return [name, field];
    }),
  );
  const labels = Object.fromEntries(Object.keys(fields).map((name) => [name, element()]));
  const label = element();
  const remove = element();
  return {
    fields,
    remove,
    querySelector(selector) {
      if (selector === ".product-item__label") return label;
      if (selector === ".remove-product") return remove;
      const field = selector.match(/^\[data-field="(.+)"\]$/);
      if (field) return fields[field[1]];
      const fieldLabel = selector.match(/^\[data-label="(.+)"\]$/);
      if (fieldLabel) return labels[fieldLabel[1]];
      throw new Error(`Unexpected product selector: ${selector}`);
    },
    querySelectorAll(selector) {
      if (selector === "[data-field]") return Object.values(fields);
      throw new Error(`Unexpected product selector: ${selector}`);
    },
  };
}

function startApp() {
  const ids = [
    "receipt-form", "print-mode", "print-button", "print-step", "cycle-actions",
    "note", "cashier", "products-list", "blackout-toggle", "reset-after-print",
    "blackout-after-print", "receipt", "receipt-note", "receipt-section-title",
    "receipt-products", "receipt-total", "receipt-cash", "receipt-change",
    "receipt-date", "receipt-time", "footer-datetime", "receipt-cashier", "form-message",
    "add-product", "repeat-command", "cancel-cycle",
  ];
  const nodes = Object.fromEntries(ids.map((id) => [id, element()]));
  nodes["print-step"].hidden = true;
  nodes["cycle-actions"].hidden = true;
  nodes["repeat-command"].inCycleActions = true;
  nodes["cancel-cycle"].inCycleActions = true;
  nodes["receipt-form"].reportValidity = () => true;

  const items = [];
  const products = nodes["products-list"];
  products.children = items;
  products.querySelectorAll = (selector) => {
    assert.equal(selector, ".product-item");
    return items;
  };
  products.append = (fragment) => items.push(fragment.item);
  products.replaceChildren = () => { items.length = 0; };
  nodes["product-template"] = {
    content: { cloneNode: () => {
      const item = productItem();
      return { item, querySelector: () => item };
    } },
  };

  nodes["receipt-form"].querySelectorAll = () => [
    nodes["print-mode"], nodes.note, nodes.cashier,
    ...items.flatMap((item) => [...Object.values(item.fields), item.remove]),
    nodes["add-product"], nodes["reset-after-print"], nodes["blackout-after-print"],
    nodes["print-button"], nodes["repeat-command"], nodes["cancel-cycle"],
  ];

  const body = element();
  body.classList.toggle("blackout", true);
  const document = {
    body,
    querySelector: (selector) => nodes[selector.slice(1)],
    createElement: () => element(),
  };
  const storage = new Map();
  const localStorage = {
    getItem: (key) => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, value),
  };
  const window = {
    listeners: {},
    printCalls: 0,
    addEventListener(name, handler) { this.listeners[name] = handler; },
    print() { this.printCalls += 1; },
  };
  const source = fs.readFileSync(path.join(__dirname, "..", "app.js"), "utf8");
  vm.runInNewContext(source, { document, window, localStorage, setInterval() {} });

  const click = (id) => nodes[id].listeners.click();
  const closePrintDialog = () => window.listeners.afterprint();
  return { nodes, items, body, window, storage, click, closePrintDialog };
}

test("comanda y factura conservan el pedido y finalizan después del segundo diálogo", () => {
  const app = startApp();
  app.click("blackout-toggle");
  app.nodes["reset-after-print"].checked = true;
  app.nodes["blackout-after-print"].checked = true;
  assert.equal(app.nodes["print-mode"].value, "both");

  app.click("print-button");
  assert.equal(app.window.printCalls, 1);
  assert.equal(app.nodes.receipt.classList.contains("receipt--command"), true);
  assert.equal(app.items[0].fields.description.value, "EJECUTIVO");
  app.closePrintDialog();

  assert.equal(app.nodes["print-button"].textContent, "Imprimir factura (2/2)");
  assert.equal(app.nodes.receipt.classList.contains("receipt--command"), false);
  assert.equal(app.nodes["print-mode"].disabled, true);
  assert.equal(app.items[0].fields.description.value, "EJECUTIVO");
  assert.equal(app.body.classList.contains("blackout"), false);
  assert.equal(app.nodes["print-button"].focused, true);

  app.click("print-button");
  assert.equal(app.window.printCalls, 2);
  app.closePrintDialog();
  assert.equal(app.items[0].fields.description.value, "");
  assert.equal(app.nodes.note.value, "");
  assert.equal(app.body.classList.contains("blackout"), true);
  assert.equal(app.nodes["print-mode"].disabled, false);
  assert.equal(app.nodes["print-button"].textContent, "Imprimir comanda (1/2)");
});

test("se puede repetir la comanda o cancelar el ciclo sin limpiar", () => {
  const app = startApp();
  app.click("blackout-toggle");
  app.nodes["reset-after-print"].checked = true;
  app.nodes["blackout-after-print"].checked = true;
  app.click("print-button");
  app.closePrintDialog();
  app.click("repeat-command");
  assert.equal(app.window.printCalls, 2);
  assert.equal(app.nodes.receipt.classList.contains("receipt--command"), true);
  app.closePrintDialog();
  assert.equal(app.nodes["print-button"].textContent, "Imprimir factura (2/2)");

  app.click("cancel-cycle");
  assert.equal(app.items[0].fields.description.value, "EJECUTIVO");
  assert.equal(app.body.classList.contains("blackout"), false);
  assert.equal(app.nodes["print-mode"].disabled, false);
});

test("la impresión individual conserva un único diálogo", () => {
  const app = startApp();
  app.click("blackout-toggle");
  app.nodes["print-mode"].value = "invoice";
  app.nodes["receipt-form"].listeners.input({ target: app.nodes["print-mode"] });
  assert.equal(app.nodes["print-button"].textContent, "Imprimir factura");

  app.click("print-button");
  assert.equal(app.nodes.receipt.classList.contains("receipt--command"), false);
  app.closePrintDialog();
  assert.equal(app.window.printCalls, 1);
  assert.equal(app.nodes["cycle-actions"].hidden, true);
  assert.equal(app.items[0].fields.description.value, "EJECUTIVO");
});
