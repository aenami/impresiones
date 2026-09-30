const PRODUCT_CATALOG = [
  { name: "EJECUTIVO", code: "78", unitPrice: 12000 },
  { name: "CAFÉ ALCAZAR", code: "33", unitPrice: 6000 },
  { name: "ALMOJABANAS", code: "171", unitPrice: 2400 },
  { name: "TINTO", code: "33", unitPrice: 2800 },
  { name: "PINTADO", code: "39", unitPrice: 5300 },
];

const EXAMPLE = {
  printType: "invoice",
  note: "SOPA, PAPA, CERDO, LLEVAR",
  cashier: "Yeison Jimenez",
  resetAfterPrint: false,
  products: [
    {
      code: "78",
      description: "EJECUTIVO",
      quantity: 1,
      unitPrice: 12000,
    },
  ],
};

const form = document.querySelector("#receipt-form");
const printTypeField = document.querySelector("#print-type");
const noteField = document.querySelector("#note");
const cashierField = document.querySelector("#cashier");
const productsList = document.querySelector("#products-list");
const productTemplate = document.querySelector("#product-template");
const blackoutToggle = document.querySelector("#blackout-toggle");
const resetAfterPrintField = document.querySelector("#reset-after-print");
let resetAfterPrintPending = false;

const output = {
  receipt: document.querySelector("#receipt"),
  note: document.querySelector("#receipt-note"),
  sectionTitle: document.querySelector("#receipt-section-title"),
  products: document.querySelector("#receipt-products"),
  total: document.querySelector("#receipt-total"),
  cash: document.querySelector("#receipt-cash"),
  change: document.querySelector("#receipt-change"),
  date: document.querySelector("#receipt-date"),
  time: document.querySelector("#receipt-time"),
  footerDatetime: document.querySelector("#footer-datetime"),
  cashier: document.querySelector("#receipt-cashier"),
  message: document.querySelector("#form-message"),
};

const money = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const quantityFormat = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });

function normalizeText(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ").toLocaleUpperCase("es-CO");
}

function productNameKey(value) {
  return normalizeText(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const catalogByName = new Map(
  PRODUCT_CATALOG.map((product) => [productNameKey(product.name), product]),
);

function receiptDate(now = new Date()) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(now);
}

function receiptTime(now = new Date()) {
  return new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);
}

function nextCashAmount(total) {
  if (total <= 0) return 0;
  if (total <= 20000) return 20000;
  return Math.ceil(total / 10000) * 10000;
}

function productValues(item, normalized = true) {
  const code = item.querySelector('[data-field="code"]').value;
  const description = item.querySelector('[data-field="description"]').value;
  const quantity = Number(item.querySelector('[data-field="quantity"]').value) || 0;
  const unitPrice = Number(item.querySelector('[data-field="unitPrice"]').value) || 0;

  return {
    code: normalized ? normalizeText(code) : code,
    description: normalized ? normalizeText(description) : description,
    quantity,
    unitPrice,
    total: quantity * unitPrice,
  };
}

function readProducts(normalized = true) {
  return [...productsList.querySelectorAll(".product-item")]
    .map((item) => productValues(item, normalized));
}

function readForm() {
  const products = readProducts();
  return {
    note: normalizeText(noteField.value),
    products,
    total: products.reduce((sum, product) => sum + product.total, 0),
  };
}

function updateDateTime() {
  const now = new Date();
  const date = receiptDate(now);
  const time = receiptTime(now);
  output.date.textContent = date;
  output.time.textContent = time;
  output.footerDatetime.textContent = `${date}  ${time}`;
}

function createReceiptProduct(product) {
  const row = document.createElement("div");
  row.className = "product-row";

  const values = [
    product.code || "—",
    product.description || "—",
    "",
    quantityFormat.format(product.quantity),
    money.format(product.unitPrice),
    money.format(product.total),
  ];

  values.forEach((value, index) => {
    const element = index === 1 ? document.createElement("strong") : document.createElement("span");
    element.textContent = value;
    row.append(element);
  });

  return row;
}

function render() {
  const data = readForm();
  const cash = nextCashAmount(data.total);
  const isCommand = printTypeField.value === "command";

  output.receipt.classList.toggle("receipt--command", isCommand);
  output.sectionTitle.textContent = isCommand ? "COMANDA" : "PRODUCTOS";
  output.note.textContent = data.note || "—";
  output.cashier.textContent = cashierField.value;
  output.products.replaceChildren(...data.products.map(createReceiptProduct));
  output.total.textContent = money.format(data.total);
  output.cash.textContent = money.format(cash);
  output.change.textContent = money.format(Math.max(0, cash - data.total));
  output.message.textContent = "";

  localStorage.setItem("grano-plancha-receipt", JSON.stringify({
    printType: printTypeField.value,
    note: noteField.value,
    cashier: cashierField.value,
    resetAfterPrint: resetAfterPrintField.checked,
    products: readProducts(false).map(({ code, description, quantity, unitPrice }) => ({
      code,
      description,
      quantity,
      unitPrice,
    })),
  }));
}

function renumberProducts() {
  const items = [...productsList.querySelectorAll(".product-item")];

  items.forEach((item, index) => {
    item.querySelector(".product-item__label").textContent = `Producto ${index + 1}`;
    item.querySelector(".remove-product").disabled = items.length === 1;

    item.querySelectorAll("[data-field]").forEach((field) => {
      const fieldName = field.dataset.field;
      const id = `product-${index + 1}-${fieldName}`;
      field.id = id;
      field.name = `products[${index}][${fieldName}]`;
      item.querySelector(`[data-label="${fieldName}"]`).htmlFor = id;
    });
  });
}

function addProduct(product = {}) {
  const fragment = productTemplate.content.cloneNode(true);
  const item = fragment.querySelector(".product-item");

  item.querySelector('[data-field="code"]').value = product.code ?? "";
  item.querySelector('[data-field="description"]').value = product.description ?? "";
  item.querySelector('[data-field="quantity"]').value = product.quantity ?? 1;
  item.querySelector('[data-field="unitPrice"]').value = product.unitPrice ?? "";

  productsList.append(fragment);
  renumberProducts();
  return item;
}

function fillProductFromCatalog(descriptionField) {
  const product = catalogByName.get(productNameKey(descriptionField.value));
  if (!product) return;

  const item = descriptionField.closest(".product-item");
  descriptionField.value = product.name;
  item.querySelector('[data-field="code"]').value = product.code;
  item.querySelector('[data-field="unitPrice"]').value = product.unitPrice;
}

function migrateSavedProducts(values) {
  if (Array.isArray(values?.products) && values.products.length > 0) return values.products;
  if (values && (values.code || values.description || values.unitPrice)) {
    return [{
      code: values.code,
      description: values.description,
      quantity: values.quantity,
      unitPrice: values.unitPrice,
    }];
  }
  return EXAMPLE.products;
}

function loadValues(values) {
  printTypeField.value = values?.printType === "command" ? "command" : EXAMPLE.printType;
  noteField.value = values?.note ?? EXAMPLE.note;
  cashierField.value = values?.cashier === "Julian Andres" ? "Julian Andres" : EXAMPLE.cashier;
  resetAfterPrintField.checked = Boolean(values?.resetAfterPrint);
  productsList.replaceChildren();
  migrateSavedProducts(values).forEach(addProduct);
  render();
}

function resetOrderForm() {
  noteField.value = "";
  productsList.replaceChildren();
  const item = addProduct({ quantity: 1 });
  render();
  item.querySelector('[data-field="description"]').focus();
}

function navigationControls() {
  return [...form.querySelectorAll("input, textarea, select, #add-product, #print-button")]
    .filter((element) => !element.disabled && element.offsetParent !== null);
}

function canLeaveTextField(element, direction) {
  if (!element.matches('input[type="text"], textarea')) return true;
  if (element.selectionStart !== element.selectionEnd) return false;
  return direction < 0
    ? element.selectionStart === 0
    : element.selectionEnd === element.value.length;
}

function loadSavedOrExample() {
  try {
    const saved = JSON.parse(localStorage.getItem("grano-plancha-receipt"));
    loadValues(saved && typeof saved === "object" ? saved : EXAMPLE);
  } catch {
    loadValues(EXAMPLE);
  }
}

form.addEventListener("input", (event) => {
  if (event.target.matches('[data-field="description"]')) {
    fillProductFromCatalog(event.target);
  }
  render();
});

form.addEventListener("keydown", (event) => {
  const directions = {
    ArrowUp: -1,
    ArrowLeft: -1,
    ArrowDown: 1,
    ArrowRight: 1,
  };
  const direction = directions[event.key];
  if (!direction) return;

  const isHorizontal = event.key === "ArrowLeft" || event.key === "ArrowRight";
  if (isHorizontal && !canLeaveTextField(event.target, direction)) return;

  const controls = navigationControls();
  const currentIndex = controls.indexOf(event.target);
  if (currentIndex === -1) return;

  event.preventDefault();
  const nextIndex = (currentIndex + direction + controls.length) % controls.length;
  controls[nextIndex].focus();
});

document.querySelector("#add-product").addEventListener("click", () => {
  const item = addProduct();
  render();
  item.querySelector('[data-field="description"]').focus();
});

productsList.addEventListener("click", (event) => {
  const removeButton = event.target.closest("[data-remove-product]");
  if (!removeButton || productsList.children.length === 1) return;
  removeButton.closest(".product-item").remove();
  renumberProducts();
  render();
});

blackoutToggle.addEventListener("click", () => {
  const isBlackout = document.body.classList.toggle("blackout");
  blackoutToggle.setAttribute("aria-pressed", String(isBlackout));
  blackoutToggle.setAttribute(
    "aria-label",
    isBlackout ? "Restaurar página" : "Activar pantalla negra",
  );
});

document.querySelector("#print-button").addEventListener("click", () => {
  if (!form.reportValidity()) {
    output.message.textContent = "Completá los datos de todos los productos antes de imprimir.";
    return;
  }
  resetAfterPrintPending = resetAfterPrintField.checked;
  updateDateTime();
  window.print();
});

window.addEventListener("beforeprint", updateDateTime);
window.addEventListener("afterprint", () => {
  if (!resetAfterPrintPending) return;
  resetAfterPrintPending = false;
  resetOrderForm();
});
setInterval(updateDateTime, 1000);
updateDateTime();
loadSavedOrExample();
