// ------- Cargar Navbar Dinámico -------
function loadNav() {
  fetch('nav.html')
    .then(response => {
      if (!response.ok) throw new Error('No se pudo cargar el nav.html');
      return response.text();
    })
    .then(data => {
      document.getElementById('nav-placeholder').innerHTML = data;
    })
    .catch(error => console.error('Error cargando el navbar:', error));
}

// ------- Variables globales -------
let productos = [];
let visibleCount = 15;
let filteredProductos = [];
let selectedProduct = null;
let sales = [];
let selectedPayment = "efectivo"; // Forma de pago por defecto

// ------- Función para cargar productos desde JSON -------
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

// ------- Renderizado moderno de productos -------
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

    // Click simple: seleccionar producto
    div.onclick = () => selectProduct(prod);
    div.onkeydown = (e) => { if (e.key === "Enter") selectProduct(prod); };

    // Doble click: seleccionar y agregar automáticamente con cantidad 1
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

  document.getElementById("btn-see-more").style.display = visibleCount >= filteredProductos.length ? "none" : "block";
}

// ------- Filtrado de productos por texto -------
function filterProducts() {
  const searchText = document.getElementById("product-search").value.trim().toLowerCase();
  filteredProductos = productos.filter(p => p.nombre.toLowerCase().includes(searchText));
  visibleCount = 15;
  renderProductCards();
}

// ------- Función para seleccionar producto -------
function selectProduct(prod) {
  selectedProduct = prod;
  document.getElementById("selected-product").value = prod.nombre.toUpperCase();
  document.getElementById("input-quantity").value = 1;
}

// ------- Incrementar cantidad -------
function incrementQuantity() {
  const input = document.getElementById("input-quantity");
  input.value = parseInt(input.value) + 1;
}

// ------- Decrementar cantidad -------
function decrementQuantity() {
  const input = document.getElementById("input-quantity");
  if (parseInt(input.value) > 1) input.value = parseInt(input.value) - 1;
}

// ------- Agregar producto a la lista de ventas -------
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

// ------- Renderizar lista de ventas -------
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

// ------- Limpiar lista de ventas -------
function clearSales() {
  sales = [];
  selectedProduct = null;
  document.getElementById("selected-product").value = "PRODUCTO SELECCIONADO DE LA LISTA";
  document.getElementById("input-quantity").value = 1;
  renderSalesList();
}

// ------- Renderizado y manejo de opciones de pago -------
function renderPaymentOptions() {
  document.querySelectorAll('.payment-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.method === selectedPayment);
  });
}

// ------- Confirmar venta y guardar en localStorage -------
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

// ------- Renderizado de ventas en la página caja.html -------
function renderVentasList() {
  const ventasContainer = document.getElementById("ventas-list");
  if (!ventasContainer) return;

  const ventasGuardadas = JSON.parse(localStorage.getItem("caja_ventas")) || [];
  ventasContainer.innerHTML = "";

  if (ventasGuardadas.length === 0) {
    ventasContainer.innerHTML = "<p class='text-muted'>No hay ventas registradas aún.</p>";
    return;
  }

  ventasGuardadas.reverse().forEach(venta => {
    const div = document.createElement("div");
    div.className = "venta-card";

    div.innerHTML = `
      <div class="venta-title">Venta #${venta.id.toString().slice(-4)}</div>
      <div class="venta-summary">
        <span class="venta-date">${new Date(venta.fecha).toLocaleString()}</span>
        <span class="venta-pagos-pill">${venta.pago.toUpperCase()}</span>
        <span class="venta-total">$${venta.total.toFixed(2)}</span>
      </div>
      <ul class="venta-productos-list">
        ${venta.productos.map(item => `
          <li class="venta-prod">
            <span class="venta-prod-name">${item.product.nombre}</span>
            <span class="venta-prod-x">x${item.quantity}</span>
            <span class="venta-prod-amount">$${(item.product.precio * item.quantity).toFixed(2)}</span>
          </li>`).join("")}
      </ul>
    `;
    ventasContainer.appendChild(div);
  });
}

// ------- Calcular y mostrar total de ventas del día -------
function calcularTotalVentasDia() {
  const ventasGuardadas = JSON.parse(localStorage.getItem("caja_ventas")) || [];
  let hoy = new Date().toISOString().slice(0, 10); // formato 'YYYY-MM-DD'

  let totalDia = ventasGuardadas.reduce((acum, venta) => {
    let fechaVenta = venta.fecha.slice(0, 10);
    if (fechaVenta === hoy) {
      return acum + parseFloat(venta.total);
    }
    return acum;
  }, 0);

  const totalDiaDiv = document.getElementById("total-day");
  if (totalDiaDiv) {
    totalDiaDiv.textContent = `Total ventas del día (${hoy}): $${totalDia.toFixed(2)}`;
  }
}

// ------- Filtro por forma de pago en caja -------
function setupPaymentFilter() {
  const filterButtons = document.querySelectorAll(".filter-btn");

  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      const metodo = btn.dataset.method;
      renderVentasListFiltered(metodo);
    });
  });

  // Inicial con todos los registros
  renderVentasListFiltered("todos");
}

function renderVentasListFiltered(metodo) {
  const ventasContainer = document.getElementById("ventas-list");
  if (!ventasContainer) return;

  const ventasGuardadas = JSON.parse(localStorage.getItem("caja_ventas")) || [];

  const ventasFiltradas = metodo === "todos" ? ventasGuardadas : ventasGuardadas.filter(v => v.pago === metodo);

  ventasContainer.innerHTML = "";

  if (ventasFiltradas.length === 0) {
    ventasContainer.innerHTML = "<p class='text-muted'>No hay ventas registradas para esta forma de pago.</p>";
    return;
  }

  ventasFiltradas.reverse().forEach(venta => {
    const div = document.createElement("div");
    div.className = "venta-card";

    div.innerHTML = `
      <div class="venta-title">Venta #${venta.id.toString().slice(-4)}</div>
      <div class="venta-summary">
        <span class="venta-date">${new Date(venta.fecha).toLocaleString()}</span>
        <span class="venta-pagos-pill">${venta.pago.toUpperCase()}</span>
        <span class="venta-total">$${venta.total.toFixed(2)}</span>
      </div>
      <ul class="venta-productos-list">
        ${venta.productos.map(item => `
          <li class="venta-prod">
            <span class="venta-prod-name">${item.product.nombre}</span>
            <span class="venta-prod-x">x${item.quantity}</span>
            <span class="venta-prod-amount">$${(item.product.precio * item.quantity).toFixed(2)}</span>
          </li>`).join("")}
      </ul>
    `;
    ventasContainer.appendChild(div);
  });
}

// ------- Inicialización y configuración -------
document.addEventListener("DOMContentLoaded", () => {
  loadNav();

  // Mostrar productos y ventas en mostrador
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

  // Manejar formas de pagos y confirmar venta
  if (document.querySelectorAll(".payment-btn").length > 0) {
    document.querySelectorAll(".payment-btn").forEach(btn => {
      btn.addEventListener("click", e => {
        selectedPayment = btn.dataset.method;
        renderPaymentOptions();
      });
    });
    renderPaymentOptions();
    document.getElementById("btn-confirm-sale").addEventListener("click", confirmSale);
  }

  // Mostrar ventas en caja y configurar filtro
  if (document.getElementById("ventas-list")) {
    setupPaymentFilter();
    calcularTotalVentasDia();
  }
});