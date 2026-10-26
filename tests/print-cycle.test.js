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
    click() { this.listeners.click?.(); },
    setAttribute(name, value) { this.attributes[name] = value; },
    focus() { this.focused = true; },
    select() { this.selected = true; },
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
  const outputs = { units: element(), gross: element(), total: element() };
  const item = {
    fields,
    removeButton: remove,
    outputs,
    querySelector(selector) {
      if (selector === ".product-item__label") return label;
      if (selector === ".remove-product") return remove;
      const field = selector.match(/^\[data-field="(.+)"\]$/);
      if (field) return fields[field[1]];
      const fieldLabel = selector.match(/^\[data-label="(.+)"\]$/);
      if (fieldLabel) return labels[fieldLabel[1]];
      const output = selector.match(/^\[data-output="(.+)"\]$/);
      if (output) return outputs[output[1]];
      throw new Error(`Unexpected product selector: ${selector}`);
    },
    querySelectorAll(selector) {
      if (selector === "[data-field]") return Object.values(fields);
      throw new Error(`Unexpected product selector: ${selector}`);
    },
  };
  Object.values(fields).forEach((field) => {
    field.matches = (selector) => selector === "[data-field]"
      || (selector === '[data-field="description"]' && field === fields.description)
      || (selector === 'input[type="text"], textarea' && [fields.code, fields.description].includes(field));
    field.closest = (selector) => selector === ".product-item" ? item : null;
  });
  remove.closest = (selector) => selector === "[data-remove-product]" ? remove
    : selector === ".product-item" ? item : null;
  return item;
}

function startApp() {
  const ids = [
    "receipt-form", "print-mode", "print-button", "print-step", "cycle-actions",
    "note", "cashier", "products-list", "blackout-toggle", "reset-after-print",
    "blackout-after-print", "receipt", "receipt-note", "receipt-section-title",
    "receipt-products", "receipt-total", "receipt-cash", "receipt-change",
    "receipt-date", "receipt-time", "footer-datetime", "receipt-cashier", "form-message",
    "add-product", "repeat-print", "cancel-cycle", "screen-date", "screen-hour",
    "screen-internal-date", "screen-internal-hour", "screen-gross",
    "screen-total", "screen-items", "item-count",
  ];
  const nodes = Object.fromEntries(ids.map((id) => [id, element()]));
  nodes["print-step"].hidden = true;
  nodes["cycle-actions"].hidden = true;
  nodes["repeat-print"].inCycleActions = true;
  nodes["cancel-cycle"].inCycleActions = true;
  nodes["receipt-form"].reportValidity = () => true;

  const items = [];
  const products = nodes["products-list"];
  products.children = items;
  products.querySelectorAll = (selector) => {
    assert.equal(selector, ".product-item");
    return items;
  };
  products.querySelector = (selector) => {
    assert.equal(selector, ".product-item");
    return items[0];
  };
  products.append = (fragment) => items.push(fragment.item);
  products.replaceChildren = () => { items.length = 0; };
  nodes["product-template"] = {
    content: { cloneNode: () => {
      const item = productItem();
      item.remove = () => { items.splice(items.indexOf(item), 1); };
      return { item, querySelector: () => item };
    } },
  };

  nodes["receipt-form"].querySelectorAll = () => [
    nodes["print-mode"], nodes.note, nodes.cashier,
    ...items.flatMap((item) => [...Object.values(item.fields), item.removeButton]),
    nodes["add-product"], nodes["reset-after-print"], nodes["blackout-after-print"],
    nodes["print-button"], nodes["repeat-print"], nodes["cancel-cycle"],
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

function fillExampleProduct(app) {
  const fields = app.items[0].fields;
  fields.code.value = "78";
  fields.description.value = "EJECUTIVO";
  fields.quantity.value = 1;
  fields.unitPrice.value = 12000;
  app.nodes["receipt-form"].listeners.input({ target: fields.code });
}

test("cerrar un diálogo no avanza: solo las confirmaciones completan ambas impresiones", () => {
  const app = startApp();
  app.click("blackout-toggle");
  fillExampleProduct(app);
  app.nodes["reset-after-print"].checked = true;
  app.nodes["blackout-after-print"].checked = true;
  assert.equal(app.nodes["print-mode"].value, "both");

  app.click("print-button");
  assert.equal(app.window.printCalls, 1);
  assert.equal(app.nodes.receipt.classList.contains("receipt--command"), true);
  assert.equal(app.items[0].fields.description.value, "EJECUTIVO");
  app.closePrintDialog();

  assert.equal(app.nodes["print-button"].textContent, "Factura");
  assert.equal(app.nodes.receipt.classList.contains("receipt--command"), true);
  assert.equal(app.nodes["print-mode"].disabled, true);
  assert.equal(app.items[0].fields.description.value, "EJECUTIVO");
  assert.equal(app.body.classList.contains("blackout"), false);
  assert.equal(app.nodes["print-button"].focused, true);

  app.click("print-button");
  assert.equal(app.window.printCalls, 2);
  assert.equal(app.nodes.receipt.classList.contains("receipt--command"), false);
  app.closePrintDialog();
  assert.equal(app.nodes["print-button"].textContent, "Finalizar");
  assert.equal(app.items[0].fields.description.value, "EJECUTIVO");
  assert.equal(app.body.classList.contains("blackout"), false);

  app.click("print-button");
  assert.equal(app.items[0].fields.description.value, "");
  assert.equal(app.nodes.note.value, "");
  assert.equal(app.body.classList.contains("blackout"), true);
  assert.equal(app.nodes["print-mode"].disabled, false);
  assert.equal(app.nodes["print-button"].textContent, "Guardar");
});

test("se puede reimprimir la comanda o cancelar el ciclo sin limpiar", () => {
  const app = startApp();
  app.click("blackout-toggle");
  fillExampleProduct(app);
  app.nodes["reset-after-print"].checked = true;
  app.nodes["blackout-after-print"].checked = true;
  app.click("print-button");
  app.closePrintDialog();
  assert.equal(app.nodes.receipt.classList.contains("receipt--command"), true);
  app.click("repeat-print");
  assert.equal(app.window.printCalls, 2);
  assert.equal(app.nodes.receipt.classList.contains("receipt--command"), true);
  app.closePrintDialog();
  assert.equal(app.nodes["print-button"].textContent, "Factura");

  app.click("cancel-cycle");
  assert.equal(app.items[0].fields.description.value, "EJECUTIVO");
  assert.equal(app.body.classList.contains("blackout"), false);
  assert.equal(app.nodes["print-mode"].disabled, false);
});

test("cancelar la factura permite reimprimirla antes de finalizar", () => {
  const app = startApp();
  app.click("blackout-toggle");
  fillExampleProduct(app);
  app.nodes["reset-after-print"].checked = true;
  app.nodes["blackout-after-print"].checked = true;
  app.click("print-button");
  app.closePrintDialog();
  app.click("print-button");
  app.closePrintDialog();

  assert.equal(app.nodes["repeat-print"].textContent, "Reimprimir factura");
  assert.equal(app.items[0].fields.description.value, "EJECUTIVO");
  assert.equal(app.body.classList.contains("blackout"), false);
  app.click("repeat-print");
  assert.equal(app.window.printCalls, 3);
  app.closePrintDialog();
  assert.equal(app.nodes["print-button"].textContent, "Finalizar");
  app.click("print-button");
  assert.equal(app.body.classList.contains("blackout"), true);
});

test("la impresión individual también requiere confirmación", () => {
  const app = startApp();
  app.click("blackout-toggle");
  fillExampleProduct(app);
  app.nodes["print-mode"].value = "invoice";
  app.nodes["receipt-form"].listeners.input({ target: app.nodes["print-mode"] });
  assert.equal(app.nodes["print-button"].textContent, "Guardar");

  app.click("print-button");
  assert.equal(app.nodes.receipt.classList.contains("receipt--command"), false);
  app.closePrintDialog();
  assert.equal(app.window.printCalls, 1);
  assert.equal(app.nodes["print-button"].textContent, "Finalizar");
  assert.equal(app.nodes["cycle-actions"].hidden, false);
  assert.equal(app.items[0].fields.description.value, "EJECUTIVO");
  app.click("print-button");
  assert.equal(app.nodes["cycle-actions"].hidden, true);
});

test("los nuevos productos completan código y precio", () => {
  const app = startApp();
  const description = app.items[0].fields.description;
  description.matches = (selector) => selector === '[data-field="description"]';
  description.closest = () => app.items[0];

  for (const [name, code, price] of [
    ["MILO CALIENTE", "38", 7300],
    ["BUNUELO", "173", 1300],
    ["ADICIONAL VARIOS", "101", 500],
  ]) {
    description.value = name;
    app.nodes["receipt-form"].listeners.input({ target: description });
    assert.equal(app.items[0].fields.code.value, code);
    assert.equal(app.items[0].fields.unitPrice.value, price);
  }
});

test("F2 abre la impresión inicial solo con la pantalla visible", () => {
  const app = startApp();
  const key = () => app.window.listeners.keydown({ key: "F2", preventDefault() {} });
  key();
  assert.equal(app.window.printCalls, 0);
  app.click("blackout-toggle");
  key();
  assert.equal(app.window.printCalls, 1);
  app.closePrintDialog();
  key();
  assert.equal(app.window.printCalls, 1);
  assert.equal(app.nodes["print-button"].textContent, "Factura");
});

test("la tabla agrega y quita filas y navega por columna con flechas", () => {
  const app = startApp();
  app.click("add-product");
  assert.equal(app.items.length, 2);
  assert.equal(app.nodes["screen-items"].textContent, "0");
  const key = (target, name) => app.nodes["receipt-form"].listeners.keydown({
    target, key: name, preventDefault() {},
  });
  key(app.items[0].fields.code, "ArrowDown");
  assert.equal(app.items[1].fields.code.focused, true);
  app.items[1].fields.code.selectionStart = 0;
  app.items[1].fields.code.selectionEnd = 0;
  key(app.items[1].fields.code, "ArrowLeft");
  assert.equal(app.items[0].fields.unitPrice.focused, true);
  app.nodes["products-list"].listeners.click({ target: app.items[1].removeButton });
  assert.equal(app.items.length, 1);
  assert.equal(app.nodes["screen-items"].textContent, "0");
});

test("la fila inicial queda vacía y Insert agrega otra fila", () => {
  const app = startApp();
  assert.equal(app.items[0].fields.quantity.value, "");
  assert.equal(app.nodes["screen-items"].textContent, "0");
  app.click("blackout-toggle");
  app.window.listeners.keydown({ key: "Insert", preventDefault() {} });
  assert.equal(app.items.length, 2);
  assert.equal(app.items[1].fields.quantity.value, "");
});
