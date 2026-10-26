const PRODUCT_CATALOG = [
  { name: "EJECUTIVO", code: "78", unitPrice: 12000 },
  { name: "CAFÉ ALCAZAR", code: "33", unitPrice: 6000 },
  { name: "ALMOJABANAS", code: "171", unitPrice: 2400 },
  { name: "TINTO", code: "33", unitPrice: 2800 },
  { name: "PINTADO", code: "39", unitPrice: 5300 },
  { name: "MILO CALIENTE", code: "38", unitPrice: 7300 },
  { name: "BUÑUELO", code: "173", unitPrice: 1300 },
  { name: "ADICIONAL VARIOS", code: "101", unitPrice: 500 },
];

const EXAMPLE = {
  printMode: "both",
  note: "",
  cashier: "Yeison Jimenez",
  resetAfterPrint: false,
  blackoutAfterPrint: true,
  products: [
    {
      code: "",
      description: "",
      quantity: "",
      unitPrice: "",
    },
  ],
};

const form = document.querySelector("#receipt-form");
const printModeField = document.querySelector("#print-mode");
const printButton = document.querySelector("#print-button");
const printStep = document.querySelector("#print-step");
const cycleActions = document.querySelector("#cycle-actions");
const repeatPrintButton = document.querySelector("#repeat-print");
const noteField = document.querySelector("#note");
const cashierField = document.querySelector("#cashier");
const productsList = document.querySelector("#products-list");
const productTemplate = document.querySelector("#product-template");
const blackoutToggle = document.querySelector("#blackout-toggle");
const resetAfterPrintField = document.querySelector("#reset-after-print");
const blackoutAfterPrintField = document.querySelector("#blackout-after-print");
const gridFields = ["code", "description", "quantity", "unitPrice"];
let activePrintFormat = null;
let pendingPrint = null;
let printReview = null;
let cyclePreferences = null;

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
  screenDate: document.querySelector("#screen-date"),
  screenHour: document.querySelector("#screen-hour"),
  screenInternalDate: document.querySelector("#screen-internal-date"),
  screenInternalHour: document.querySelector("#screen-internal-hour"),
  screenGross: document.querySelector("#screen-gross"),
  screenTotal: document.querySelector("#screen-total"),
  screenItems: document.querySelector("#screen-items"),
  itemCount: document.querySelector("#item-count"),
  message: document.querySelector("#form-message"),
};

const money = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const screenMoney = new Intl.NumberFormat("es-CO", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});
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
  const quantityFieldValue = item.querySelector('[data-field="quantity"]').value;
  const unitPriceFieldValue = item.querySelector('[data-field="unitPrice"]').value;
  const quantity = Number(quantityFieldValue) || 0;
  const unitPrice = Number(unitPriceFieldValue) || 0;

  return {
    code: normalized ? normalizeText(code) : code,
    description: normalized ? normalizeText(description) : description,
    quantity: normalized ? quantity : quantityFieldValue,
    unitPrice: normalized ? unitPrice : unitPriceFieldValue,
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
  const screenTime = new Intl.DateTimeFormat("es-CO", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(now);
  output.screenDate.textContent = date;
  output.screenHour.textContent = screenTime;
  output.screenInternalDate.textContent = date;
  output.screenInternalHour.textContent = screenTime;
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
  const format = activePrintFormat ?? (printModeField.value === "invoice" ? "invoice" : "command");
  const isCommand = format === "command";

  output.receipt.classList.toggle("receipt--command", isCommand);
  output.sectionTitle.textContent = "PRODUCTOS";
  output.note.textContent = data.note || "—";
  output.cashier.textContent = cashierField.value;
  output.products.replaceChildren(...data.products.map(createReceiptProduct));
  output.total.textContent = money.format(data.total);
  output.cash.textContent = money.format(cash);
  output.change.textContent = money.format(Math.max(0, cash - data.total));
  [...productsList.querySelectorAll(".product-item")].forEach((item, index) => {
    const filled = Boolean(data.products[index].code || data.products[index].description);
    const value = filled ? screenMoney.format(data.products[index].total) : "";
    item.querySelector('[data-output="units"]').textContent = filled ? "UND" : "";
    item.querySelector('[data-output="gross"]').textContent = value;
    item.querySelector('[data-output="total"]').textContent = value;
  });
  const filledCount = data.products.filter((product) => product.code || product.description).length;
  output.screenGross.textContent = `$ ${screenMoney.format(data.total)}`;
  output.screenTotal.textContent = `$ ${screenMoney.format(data.total)}`;
  output.screenItems.textContent = String(filledCount);
  output.itemCount.textContent = String(filledCount);
  output.message.textContent = "";

  localStorage.setItem("grano-plancha-receipt", JSON.stringify({
    printMode: printModeField.value,
    note: noteField.value,
    cashier: cashierField.value,
    resetAfterPrint: resetAfterPrintField.checked,
    blackoutAfterPrint: blackoutAfterPrintField.checked,
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
    item.querySelector(".product-item__label").textContent = String(index + 1);
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
  item.querySelector('[data-field="quantity"]').value = product.quantity ?? "";
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
  printModeField.value = ["both", "command", "invoice"].includes(values?.printMode)
    ? values.printMode
    : EXAMPLE.printMode;
  noteField.value = values?.note ?? EXAMPLE.note;
  cashierField.value = values?.cashier === "Julian Andres" ? "Julian Andres" : EXAMPLE.cashier;
  resetAfterPrintField.checked = Boolean(values?.resetAfterPrint);
  blackoutAfterPrintField.checked = Boolean(
    values?.blackoutAfterPrint ?? values?.startBlackout ?? EXAMPLE.blackoutAfterPrint,
  );
  productsList.replaceChildren();
  migrateSavedProducts(values).forEach(addProduct);
  render();
  updatePrintControls();
}

function resetOrderForm() {
  noteField.value = "";
  productsList.replaceChildren();
  const item = addProduct({ quantity: "" });
  render();
  item.querySelector('[data-field="description"]').focus();
}

function setOrderEditingLocked(locked) {
  form.querySelectorAll("input, textarea, select, button").forEach((control) => {
    if (control === printButton || control.closest("#cycle-actions")) return;
    control.disabled = locked;
  });
  if (!locked) renumberProducts();
}

function updatePrintControls() {
  if (printReview) {
    const isCommand = printReview.format === "command";
    const name = isCommand ? "comanda" : "factura";
    printButton.textContent = isCommand && printReview.inCycle ? "Factura" : "Finalizar";
    printButton.title = isCommand && printReview.inCycle
      ? "Confirmar comanda e imprimir factura (2/2)"
      : `Confirmar ${name} impresa`;
    const nextStep = isCommand && printReview.inCycle
      ? "continuar con la factura"
      : "terminar el pedido";
    printStep.textContent = `¿Se imprimió la ${name}? Confirmá para ${nextStep} o repetí la impresión.`;
    repeatPrintButton.textContent = `Reimprimir ${name}`;
    printStep.hidden = false;
    cycleActions.hidden = false;
    return;
  }

  printButton.textContent = "Guardar";
  printButton.title = {
    both: "F2: imprimir comanda y factura",
    command: "F2: imprimir comanda",
    invoice: "F2: imprimir factura",
  }[printModeField.value];
  printStep.hidden = true;
  cycleActions.hidden = true;
}

function startPrint(format, inCycle) {
  if (pendingPrint) return;
  printReview = null;
  pendingPrint = { format, inCycle };
  activePrintFormat = format;
  render();
  updateDateTime();
  window.print();
}

function endPrintCycle() {
  const preferences = cyclePreferences;
  cyclePreferences = null;
  printReview = null;
  activePrintFormat = null;
  setOrderEditingLocked(false);
  updatePrintControls();

  if (preferences?.reset) resetOrderForm();
  else render();
  if (preferences?.blackout) setBlackout(true);
}

function navigationControls() {
  return [...form.querySelectorAll("input, textarea, select, #add-product, #print-button")]
    .filter((element) => !element.disabled && element.offsetParent !== null);
}

function navigateProductGrid(event) {
  const field = event.target;
  const currentRow = field.closest(".product-item");
  if (!currentRow) return;

  const rows = [...productsList.querySelectorAll(".product-item")];
  const rowIndex = rows.indexOf(currentRow);
  const columnIndex = gridFields.indexOf(field.dataset.field);
  if (rowIndex < 0 || columnIndex < 0) return;

  const horizontal = event.key === "ArrowLeft" || event.key === "ArrowRight";
  const direction = event.key === "ArrowUp" || event.key === "ArrowLeft" ? -1 : 1;
  if (horizontal && !canLeaveTextField(field, direction)) return;

  let nextRow = rowIndex;
  let nextColumn = columnIndex;
  if (horizontal) {
    nextColumn += direction;
    if (nextColumn < 0 || nextColumn >= gridFields.length) {
      nextRow += direction;
      nextColumn = direction < 0 ? gridFields.length - 1 : 0;
    }
  } else {
    nextRow += direction;
  }

  event.preventDefault();
  const target = rows[nextRow]?.querySelector(`[data-field="${gridFields[nextColumn]}"]`);
  if (target && !target.disabled) {
    target.focus();
    target.select?.();
  }
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
  if (event.target.matches("[data-field]") &&
      ["code", "description"].includes(event.target.dataset.field)) {
    const item = event.target.closest(".product-item");
    const quantity = item.querySelector('[data-field="quantity"]');
    if (!quantity.value && (
      item.querySelector('[data-field="code"]').value ||
      item.querySelector('[data-field="description"]').value
    )) quantity.value = 1;
  }
  render();
  if (event.target === printModeField) updatePrintControls();
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

  if (event.target.matches("[data-field]")) {
    navigateProductGrid(event);
    return;
  }

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
  const items = [...productsList.querySelectorAll(".product-item")];
  const item = removeButton.closest(".product-item");
  const index = items.indexOf(item);
  item.remove();
  renumberProducts();
  render();
  const remaining = [...productsList.querySelectorAll(".product-item")];
  remaining[Math.min(index, remaining.length - 1)].querySelector('[data-field="description"]').focus();
});

window.addEventListener("keydown", (event) => {
  if (!["F2", "Insert"].includes(event.key) || event.altKey || event.ctrlKey || event.metaKey) return;
  event.preventDefault();
  if (document.body.classList.contains("blackout") || pendingPrint || printReview) return;
  if (event.key === "F2") printButton.click();
  else document.querySelector("#add-product").click();
});

function setBlackout(isBlackout) {
  document.body.classList.toggle("blackout", isBlackout);
  blackoutToggle.setAttribute("aria-pressed", String(isBlackout));
  blackoutToggle.setAttribute(
    "aria-label",
    isBlackout ? "Restaurar página" : "Activar pantalla negra",
  );
  if (!isBlackout && !pendingPrint && !printReview) {
    productsList.querySelector(".product-item")?.querySelector('[data-field="code"]')?.focus();
  }
}

blackoutToggle.addEventListener("click", () => {
  setBlackout(!document.body.classList.contains("blackout"));
});

printButton.addEventListener("click", () => {
  if (pendingPrint) return;
  if (printReview) {
    if (printReview.format === "command" && printReview.inCycle) {
      startPrint("invoice", true);
    } else {
      endPrintCycle();
    }
    return;
  }

  if (!form.reportValidity()) {
    output.message.textContent = "Completá los datos de todos los productos antes de imprimir.";
    return;
  }

  cyclePreferences = {
    reset: resetAfterPrintField.checked,
    blackout: blackoutAfterPrintField.checked,
  };
  const inCycle = printModeField.value === "both";
  startPrint(inCycle ? "command" : printModeField.value, inCycle);
});

repeatPrintButton.addEventListener("click", () => {
  if (printReview && !pendingPrint) startPrint(printReview.format, printReview.inCycle);
});

document.querySelector("#cancel-cycle").addEventListener("click", () => {
  if (!printReview || pendingPrint) return;
  cyclePreferences = null;
  printReview = null;
  activePrintFormat = null;
  setOrderEditingLocked(false);
  render();
  updatePrintControls();
  printButton.focus();
});

window.addEventListener("beforeprint", updateDateTime);
window.addEventListener("afterprint", () => {
  const completedPrint = pendingPrint;
  if (!completedPrint) return;
  pendingPrint = null;
  printReview = completedPrint;
  setOrderEditingLocked(true);
  render();
  updatePrintControls();
  printButton.focus();
});
setInterval(updateDateTime, 1000);
updateDateTime();
loadSavedOrExample();
