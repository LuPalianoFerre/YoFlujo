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
}

// Buscar texto en ventas (nombre o ID)
function filterBySearch(text) {
  const normalized = text.trim().toLowerCase();
  if (!normalized) {
    ventasFiltradas = ventasGuardadas;
  } else {
    ventasFiltradas = ventasGuardadas.filter(venta => {
      if (venta.id.toString().includes(normalized)) return true;
      for (const item of venta.productos) {
        if (item.product.nombre.toLowerCase().includes(normalized)) return true;
      }
      return false;
    });
  }
  currentPage = 1;
  renderVentasListPage();
}

// Mostrar total ventas del día actual
function calcularTotalVentasDia() {
  const hoy = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const totalDia = ventasGuardadas.reduce((acc, venta) => {
    if (venta.fecha.slice(0, 10) === hoy) {
      return acc + parseFloat(venta.total);
    }
    return acc;
  }, 0);
  const totalDiaDiv = document.getElementById("total-day");
  if (totalDiaDiv) {
    totalDiaDiv.textContent = `Total ventas del día (${hoy}): $${totalDia.toFixed(2)}`;
  }
}

// Exportar tabla a CSV
function exportToCSV() {
  if (ventasFiltradas.length === 0) {
    alert("No hay ventas para exportar.");
    return;
  }

  // Usamos punto y coma como separador
  const csvSeparator = ";";

  // Cabeceras
  const headers = ["CANTIDAD", "PRODUCTO", "PRECIO", "FORMA DE PAGO"];
  let csvContent = "data:text/csv;charset=utf-8," + headers.join(csvSeparator) + "\n";

  let totalDia = 0;

  ventasFiltradas.forEach(venta => {
    venta.productos.forEach(item => {
      const cantidad = item.quantity;
      // Limpiar nombre para evitar problemas (quitamos comillas dobles internas)
      const producto = item.product.nombre.replace(/"/g, '""');
      let precio = (item.product.precio * cantidad);
      let formaPago = venta.pago.toUpperCase();

      totalDia += precio;

      // Precio con coma decimal para mejor compatibilidad Excel en español
      let precioStr = precio.toFixed(2).replace(".", ",");

      // Construir línea CSV escapando comillas
      const row = [
        cantidad,
        `"${producto}"`, // entre comillas para cadenas que pueden tener comas o puntos y comas
        `"${precioStr}"`,
        `"${formaPago}"`
      ];
      csvContent += row.join(csvSeparator) + "\n";
    });
  });

  // Total final, dejar vacío segundo campo que es producto
  let totalStr = totalDia.toFixed(2).replace(".", ",");

  csvContent += `\nTOTAL;;"${totalStr}";\n`;

  // Crear enlace para descargar
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "ventas_exportadas.csv");
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