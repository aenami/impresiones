const EXAMPLE = {
  note: "SOPA, PAPA, CERDO, LLEVAR",
  cashier: "Yeison Jimenez",
  products: [
    {
      code: "79",
      description: "EJECUTIVO",
      quantity: 1,
      unitPrice: 12000,
    },
  ],
};

const form = document.querySelector("#receipt-form");
const noteField = document.querySelector("#note");
const cashierField = document.querySelector("#cashier");
const productsList = document.querySelector("#products-list");
const productTemplate = document.querySelector("#product-template");

const output = {
  note: document.querySelector("#receipt-note"),
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

  output.note.textContent = data.note || "—";
  output.cashier.textContent = cashierField.value;
  output.products.replaceChildren(...data.products.map(createReceiptProduct));
  output.total.textContent = money.format(data.total);
  output.cash.textContent = money.format(cash);
  output.change.textContent = money.format(Math.max(0, cash - data.total));
  output.message.textContent = "";

  localStorage.setItem("grano-plancha-receipt", JSON.stringify({
    note: noteField.value,
    cashier: cashierField.value,
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
  noteField.value = values?.note ?? EXAMPLE.note;
  cashierField.value = values?.cashier === "Julian Andres" ? "Julian Andres" : EXAMPLE.cashier;
  productsList.replaceChildren();
  migrateSavedProducts(values).forEach(addProduct);
  render();
}

function loadSavedOrExample() {
  try {
    const saved = JSON.parse(localStorage.getItem("grano-plancha-receipt"));
    loadValues(saved && typeof saved === "object" ? saved : EXAMPLE);
  } catch {
    loadValues(EXAMPLE);
  }
}

form.addEventListener("input", render);

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

document.querySelector("#print-button").addEventListener("click", () => {
  if (!form.reportValidity()) {
    output.message.textContent = "Completá los datos de todos los productos antes de imprimir.";
    return;
  }
  updateDateTime();
  window.print();
});

window.addEventListener("beforeprint", updateDateTime);
setInterval(updateDateTime, 1000);
updateDateTime();
loadSavedOrExample();
