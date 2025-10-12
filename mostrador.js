let productos = [];
let visibleCount = 10;
let filteredProductos = [];
let selectedProduct = null;
let sales = [];
let selectedPayment = "efectivo"; // Forma de pago por defecto

async function loadProductos() {
  try {
    const response = await fetch("productos.json");
    const data = await response.json();
    productos = data.productos || [];
    filteredProductos = productos;
    renderProductCards();
  } catch (e) {
    console.error("Error cargando productos:", e);
  }
}

function renderProductCards() {
  const list = document.getElementById("product-list");
  if (!list) return;
  list.innerHTML = "";

  let displayProductos = filteredProductos.slice(0, visibleCount);

  displayProductos.forEach(prod => {
    const div = document.createElement("div");
    div.className = "product-item";
    div.tabIndex = 0;
    div.title = `Precio: $${prod.precio.toFixed(2)}`;

    div.onclick = () => selectProduct(prod);
    div.onkeydown = (e) => { if (e.key === "Enter") selectProduct(prod); };

    div.ondblclick = () => {
      selectedProduct = prod;
      document.getElementById("selected-product").value = prod.nombre.toUpperCase();
      document.getElementById("input-quantity").value = 1;
      addToSales();
      renderSalesList();
    };

    div.innerHTML = `
      <div class="product-title">${prod.nombre}</div>
      <div class="product-price">$${prod.precio.toFixed(2)}</div>
    `;
    list.appendChild(div);
  });

  const btnSeeMore = document.getElementById("btn-see-more");
  if(btnSeeMore) {
    btnSeeMore.style.display = visibleCount >= filteredProductos.length ? "none" : "block";
  }
}

function filterProducts() {
  const searchText = document.getElementById("product-search").value.trim().toLowerCase();
  filteredProductos = productos.filter(p => p.nombre.toLowerCase().includes(searchText));
  visibleCount = 15;
  renderProductCards();
}

function selectProduct(prod) {
  selectedProduct = prod;
  document.getElementById("selected-product").value = prod.nombre.toUpperCase();
  document.getElementById("input-quantity").value = 1;
}

function incrementQuantity() {
  const input = document.getElementById("input-quantity");
  input.value = parseInt(input.value) + 1;
}

function decrementQuantity() {
  const input = document.getElementById("input-quantity");
  if (parseInt(input.value) > 1) {
    input.value = parseInt(input.value) - 1;
  }
}

function addToSales() {
  if (!selectedProduct) {
    alert("Debe seleccionar un producto primero");
    return;
  }

  const quantity = parseInt(document.getElementById("input-quantity").value);
  if (quantity <= 0) {
    alert("La cantidad debe ser mayor a cero");
    return;
  }

  let existing = sales.find(s => s.product.id === selectedProduct.id);
  if (existing) {
    existing.quantity += quantity;
  } else {
    sales.push({ product: selectedProduct, quantity });
  }
  renderSalesList();
}

function renderSalesList() {
  const salesList = document.getElementById("sales-list");
  if (!salesList) return;

  salesList.innerHTML = "";

  sales.forEach((sale, index) => {
    const div = document.createElement("div");
    div.className = "sale-item d-flex justify-content-between align-items-center gap-3";

    div.innerHTML = `
      <div class="flex-grow-1">${sale.product.nombre}</div>
      <div>${sale.quantity}</div>
      <div>$${(sale.product.precio * sale.quantity).toFixed(2)}</div>
      <button type="button" class="btn btn-sm btn-outline-danger ms-2" title="Eliminar producto">×</button>
    `;

    salesList.appendChild(div);

    const btnRemove = div.querySelector("button");
    btnRemove.addEventListener("click", () => {
      sales.splice(index, 1);
      renderSalesList();
    });
  });

  const total = sales.reduce((acc, sale) => acc + sale.product.precio * sale.quantity, 0);
  document.getElementById("total-price").value = "$" + total.toFixed(2);
}

function clearSales() {
  sales = [];
  selectedProduct = null;
  document.getElementById("selected-product").value = "PRODUCTO SELECCIONADO DE LA LISTA";
  document.getElementById("input-quantity").value = 1;
  renderSalesList();
}

function renderPaymentOptions() {
  document.querySelectorAll('.payment-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.method === selectedPayment);
  });
}

function confirmSale() {
  if (sales.length === 0) {
    alert("Agrega productos antes de finalizar la venta.");
    return;
  }

  const nuevaVenta = {
    id: Date.now(),
    productos: sales.map(s => ({ ...s })),
    total: sales.reduce((acc, sale) => acc + sale.quantity * sale.product.precio, 0),
    pago: selectedPayment,
    fecha: new Date().toISOString(),
  };

  let ventasGuardadas = JSON.parse(localStorage.getItem("caja_ventas")) || [];
  ventasGuardadas.push(nuevaVenta);
  localStorage.setItem("caja_ventas", JSON.stringify(ventasGuardadas));

  clearSales();
  renderPaymentOptions();
  alert("¡Venta guardada correctamente!");
}

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("product-list")) {
    loadProductos();

    document.getElementById("btn-see-more").addEventListener("click", () => {
      visibleCount += 15;
      renderProductCards();
    });

    document.getElementById("product-search").addEventListener("input", filterProducts);
    document.getElementById("btn-filter").addEventListener("click", filterProducts);

    document.getElementById("btn-quantity-plus").addEventListener("click", incrementQuantity);
    document.getElementById("btn-quantity-minus").addEventListener("click", decrementQuantity);
    document.getElementById("btn-add").addEventListener("click", () => {
      addToSales();
      renderSalesList();
    });

    document.getElementById("btn-clear").addEventListener("click", clearSales);
  }

  if (document.querySelectorAll(".payment-btn").length > 0) {
    document.querySelectorAll(".payment-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedPayment = btn.dataset.method;
        renderPaymentOptions();
      });
    });
    renderPaymentOptions();
    document.getElementById("btn-confirm-sale").addEventListener("click", confirmSale);
  }
});