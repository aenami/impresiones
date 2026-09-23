const EXAMPLE = {
  note: "SOPA, PAPA, CERDO, LLEVAR",
  code: "79",
  description: "EJECUTIVO",
  quantity: 1,
  unitPrice: 12000,
};

const form = document.querySelector("#receipt-form");
const fields = {
  note: document.querySelector("#note"),
  code: document.querySelector("#code"),
  description: document.querySelector("#description"),
  quantity: document.querySelector("#quantity"),
  unitPrice: document.querySelector("#unit-price"),
};

const output = {
  note: document.querySelector("#receipt-note"),
  code: document.querySelector("#receipt-code"),
  description: document.querySelector("#receipt-description"),
  quantity: document.querySelector("#receipt-quantity"),
  price: document.querySelector("#receipt-price"),
  lineTotal: document.querySelector("#receipt-line-total"),
  total: document.querySelector("#receipt-total"),
  cash: document.querySelector("#receipt-cash"),
  change: document.querySelector("#receipt-change"),
  date: document.querySelector("#receipt-date"),
  time: document.querySelector("#receipt-time"),
  footerDatetime: document.querySelector("#footer-datetime"),
  message: document.querySelector("#form-message"),
};

const money = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 });
const quantityFormat = new Intl.NumberFormat("es-CO", { maximumFractionDigits: 2 });

function normalizeText(value) {
  return value.trim().replace(/\s+/g, " ").toLocaleUpperCase("es-CO");
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

function readForm() {
  const quantity = Number(fields.quantity.value) || 0;
  const unitPrice = Number(fields.unitPrice.value) || 0;
  return {
    note: normalizeText(fields.note.value),
    code: normalizeText(fields.code.value),
    description: normalizeText(fields.description.value),
    quantity,
    unitPrice,
    total: quantity * unitPrice,
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

function render() {
  const data = readForm();
  const cash = nextCashAmount(data.total);
  output.note.textContent = data.note || "—";
  output.code.textContent = data.code || "—";
  output.description.textContent = data.description || "—";
  output.quantity.textContent = quantityFormat.format(data.quantity);
  output.price.textContent = money.format(data.unitPrice);
  output.lineTotal.textContent = money.format(data.total);
  output.total.textContent = money.format(data.total);
  output.cash.textContent = money.format(cash);
  output.change.textContent = money.format(Math.max(0, cash - data.total));
  output.message.textContent = "";
  localStorage.setItem("grano-plancha-receipt", JSON.stringify({
    note: fields.note.value,
    code: fields.code.value,
    description: fields.description.value,
    quantity: fields.quantity.value,
    unitPrice: fields.unitPrice.value,
  }));
}

function loadValues(values) {
  Object.entries(values).forEach(([key, value]) => {
    if (fields[key]) fields[key].value = value;
  });
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
document.querySelector("#print-button").addEventListener("click", () => {
  if (!form.reportValidity()) {
    output.message.textContent = "Completá código, descripción, cantidad y valor antes de imprimir.";
    return;
  }
  updateDateTime();
  window.print();
});

window.addEventListener("beforeprint", updateDateTime);
setInterval(updateDateTime, 1000);
updateDateTime();
loadSavedOrExample();
