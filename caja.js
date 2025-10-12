let ventasGuardadas = [];
let ventasFiltradas = [];
let currentPage = 1;
const itemsPerPage = 10;

// Carga ventas desde localStorage
function loadVentas() {
  ventasGuardadas = JSON.parse(localStorage.getItem("caja_ventas")) || [];
  ventasFiltradas = ventasGuardadas;
  currentPage = 1;
  renderVentasListPage();
  calcularTotalVentasDia();
  clearStatusMessage();
}

// Renderizar lista con paginación
function renderVentasListPage() {
  const ventasContainer = document.getElementById("ventas-list");
  const paginationContainer = document.getElementById("pagination-container");
  const statusMessage = document.getElementById("status-message");

  if (!ventasContainer || !paginationContainer || !statusMessage) return;

  ventasContainer.innerHTML = "";
  paginationContainer.innerHTML = "";

  if (ventasFiltradas.length === 0) {
    ventasContainer.innerHTML = "<p class='text-muted'>No hay ventas para mostrar.</p>";
    return;
  }

  const totalPages = Math.ceil(ventasFiltradas.length / itemsPerPage);

  // Ajustar página actual si se sale de rango
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIdx = (currentPage - 1) * itemsPerPage;
  const endIdx = Math.min(startIdx + itemsPerPage, ventasFiltradas.length);
  const pageItems = ventasFiltradas.slice(startIdx, endIdx);

  pageItems.forEach(venta => {
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

  // Crear botones paginación (prev, números, next)
  const createPageButton = (label, page, disabled = false, active = false) => {
    const li = document.createElement("li");
    li.className = "page-item" + (disabled ? " disabled" : "") + (active ? " active" : "");
    const a = document.createElement("a");
    a.className = "page-link";
    a.href = "#";
    a.textContent = label;
    a.addEventListener("click", (e) => {
      e.preventDefault();
      if (!disabled && currentPage !== page) {
        currentPage = page;
        renderVentasListPage();
      }
    });
    li.appendChild(a);
    return li;
  };

  paginationContainer.appendChild(createPageButton("Anterior", currentPage - 1, currentPage === 1));

  for (let i = 1; i <= totalPages; i++) {
    paginationContainer.appendChild(createPageButton(i, i, false, currentPage === i));
  }

  paginationContainer.appendChild(createPageButton("Siguiente", currentPage + 1, currentPage === totalPages));
}



// Filtrado por forma de pago
function filterByPayment(metodo) {
  if (metodo === "todos") {
    ventasFiltradas = ventasGuardadas;
  } else {
    ventasFiltradas = ventasGuardadas.filter(v => v.pago === metodo);
  }
  currentPage = 1;
  renderVentasListPage();
  mostrarSubtotalPorPago(metodo);
}

// Función para mostrar subtotal de ventas filtradas según método
function mostrarSubtotalPorPago(metodo) {
  const subtotalDiv = document.getElementById("subtotal-payment");
  if (!subtotalDiv) return;

  let subtotal = 0;
  if (metodo === "todos") {
    subtotal = ventasGuardadas.reduce((acc, venta) => acc + venta.total, 0);
  } else {
    subtotal = ventasGuardadas
      .filter(v => v.pago === metodo)
      .reduce((acc, venta) => acc + venta.total, 0);
  }

  subtotalDiv.textContent = `Subtotal ventas (${metodo.toUpperCase()}): $${subtotal.toFixed(2)}`;
}

// En la carga inicial también mostrar subtotal general
document.addEventListener("DOMContentLoaded", () => {
  loadVentas();
  setupEventListeners();
  mostrarSubtotalPorPago("todos"); // Muestra total inicial
});

// Mostrar total ventas del día actual con formato de fecha de acá
function calcularTotalVentasDia() {
  const hoy = new Date();
  const dia = String(hoy.getDate()).padStart(2, '0');
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const anio = hoy.getFullYear();
  const hoyFormateado = `${dia} ${mes} ${anio}`;

  const hoyISO = hoy.toISOString().slice(0, 10); //
  const totalDia = ventasGuardadas.reduce((acc, venta) => {
    if (venta.fecha.slice(0, 10) === hoyISO) {
      return acc + parseFloat(venta.total);
    }
    return acc;
  }, 0);

  const totalDiaDiv = document.getElementById("total-day");
  if (totalDiaDiv) {
    totalDiaDiv.textContent = ` (${hoyFormateado}): TOTAL VENTAS: $${totalDia.toFixed(2)}`;
  }
}

// Exportar tabla a CSV
function exportToCSV() {
  if (ventasFiltradas.length === 0) {
    alert("No hay ventas para exportar.");
    return;
  }

  // Fecha formateada para mostrar en la caja
  const hoy = new Date();
  const dia = String(hoy.getDate()).padStart(2, '0');
  const mes = String(hoy.getMonth() + 1).padStart(2, '0');
  const anio = hoy.getFullYear();
  const hoyFormateado = `${dia} ${mes} ${anio}`;

  // Mostrar la fecha en la caja 'total-day' (si existe)
  const totalDayDiv = document.getElementById("total-day");
  if (totalDayDiv) {
    totalDayDiv.innerHTML = `Fecha: ${hoyFormateado}`;
  }

  // Usamos punto y coma como separador
  const csvSeparator = ";";

  // Cabeceras
  const headers = ["CANTIDAD", "PRODUCTO", "PRECIO", "FORMA DE PAGO"];
  let csvContent = "data:text/csv;charset=utf-8," + headers.join(csvSeparator) + "\n";

  let totalDia = 0;
  let subtotalEfectivo = 0;
  let subtotalTarjeta = 0;
  let subtotalTransferencia = 0;

  ventasFiltradas.forEach(venta => {
    venta.productos.forEach(item => {
      const cantidad = item.quantity;
      const producto = item.product.nombre.replace(/"/g, '""');
      let precio = item.product.precio * cantidad;
      let formaPago = venta.pago.toLowerCase();

      totalDia += precio;

      // Calcular subtotales por método
      if (formaPago === "efectivo") {
        subtotalEfectivo += precio;
      } else if (formaPago === "pos" || formaPago === "tarjeta") {
        subtotalTarjeta += precio;
      } else if (formaPago === "transfe" || formaPago === "transferencia") {
        subtotalTransferencia += precio;
      }

      // Precio con coma decimal para Excel en español
      let precioStr = precio.toFixed(2).replace(".", ",");

      // Construir línea CSV escapando comillas
      const row = [
        cantidad,
        `"${producto}"`,
        `"${precioStr}"`,
        `"${formaPago.toUpperCase()}"`
      ];
      csvContent += row.join(csvSeparator) + "\n";
    });
  });

  // Total final, dejar vacío segundo campo que es producto
  let totalStr = totalDia.toFixed(2).replace(".", ",");

  csvContent += `\nTOTAL;;"${totalStr}";\n`;

  // Agregar subtotales con etiquetas claras
  csvContent += `Subtotal Efectivo;;"${subtotalEfectivo.toFixed(2).replace(".", ",")}";\n`;
  csvContent += `Subtotal Tarjeta;;"${subtotalTarjeta.toFixed(2).replace(".", ",")}";\n`;
  csvContent += `Subtotal Transferencia;;"${subtotalTransferencia.toFixed(2).replace(".", ",")}";\n`;

  // Codificar y lanzar descarga CSV (p.ej. creando un enlace temporal)
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `ventas_${dia}${mes}${anio}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}




// Imprimir listado de ventas
function printVentas() {
  const printContents = document.getElementById("ventas-list").innerHTML;
  const originalContents = document.body.innerHTML;
  document.body.innerHTML = `<div><h2>Listado de Ventas</h2>${printContents}</div>`;
  window.print();
  document.body.innerHTML = originalContents;
  location.reload(); // Refrescar para recuperar el contenido original
}

// Mostrar mensaje de estado (errores o info)
function setStatusMessage(msg, isError = false) {
  const statusMessage = document.getElementById("status-message");
  if (!statusMessage) return;
  statusMessage.textContent = msg;
  statusMessage.classList.toggle("text-danger", isError);
  statusMessage.classList.toggle("text-muted", !isError);
}

// Limpiar mensaje de estado
function clearStatusMessage() {
  const statusMessage = document.getElementById("status-message");
  if (!statusMessage) return;
  statusMessage.textContent = "";
  statusMessage.classList.remove("text-danger");
  statusMessage.classList.add("text-muted");
}

// Inicializar eventos
function setupEventListeners() {
  // Botones filtro pago
  document.querySelectorAll(".filter-btn").forEach(btn =>
    btn.addEventListener("click", () => {
      document.querySelectorAll(".filter-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      clearStatusMessage();
      filterByPayment(btn.dataset.method);
    })
  );

  // Buscador texto
  const searchInput = document.getElementById("search-text");
  const clearSearchBtn = document.getElementById("btn-clear-search");

  if (searchInput) {
    searchInput.addEventListener("input", () => {
      clearStatusMessage();
      filterBySearch(searchInput.value);
    });
  }

  if (clearSearchBtn) {
    clearSearchBtn.addEventListener("click", () => {
      searchInput.value = "";
      clearStatusMessage();
      filterBySearch("");
    });
  }

  // Exportar
  const exportBtn = document.getElementById("btn-export");
  if (exportBtn) exportBtn.addEventListener("click", exportToCSV);

  // Imprimir
  const printBtn = document.getElementById("btn-print");
  if (printBtn) printBtn.addEventListener("click", printVentas);
}


document.addEventListener("DOMContentLoaded", () => {
  loadVentas();
  setupEventListeners();
});