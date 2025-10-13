let ventasGuardadas = [];
let ventasFiltradas = [];
let currentPage = 1;
const itemsPerPage = 10;

let filtroPagoActual = "todos";
let filtroBusqueda = "";

// Carga inicial
function loadVentas() {
  ventasGuardadas = JSON.parse(localStorage.getItem("caja_ventas")) || [];
  aplicarFiltros();
  calcularTotalVentasDia();
  clearStatusMessage();
}

// Aplicar filtros
function aplicarFiltros() {
  const texto = filtroBusqueda.toLowerCase();
  ventasFiltradas = ventasGuardadas.filter(v => {
    const coincidePago = filtroPagoActual === "todos" || v.pago === filtroPagoActual;
    const coincideTexto = texto === "" || v.id.toString().includes(texto) ||
      v.pago.toLowerCase().includes(texto) ||
      v.productos.some(p => p.product.nombre.toLowerCase().includes(texto));
    return coincidePago && coincideTexto;
  });
  currentPage = 1;
  renderVentasListPage();
  mostrarSubtotalFiltrado();
}

// Renderizar lista de ventas con paginación
function renderVentasListPage() {
  const ventasContainer = document.getElementById("ventas-list");
  const paginationContainer = document.getElementById("pagination-container");
  ventasContainer.innerHTML = "";
  paginationContainer.innerHTML = "";

  if (ventasFiltradas.length === 0) {
    ventasContainer.innerHTML = "<p class='text-muted'>No hay ventas para mostrar.</p>";
    return;
  }

  const totalPages = Math.ceil(ventasFiltradas.length / itemsPerPage);
  if (currentPage > totalPages) currentPage = totalPages;
  if (currentPage < 1) currentPage = 1;

  const startIdx = (currentPage - 1) * itemsPerPage;
  const pageItems = ventasFiltradas.slice(startIdx, startIdx + itemsPerPage);

  pageItems.forEach(venta => {
    const article = document.createElement("article");
    article.className = "venta-card";
    article.innerHTML = `
      <header>
        <div class="venta-title">Venta #${venta.id.toString().slice(-4)}</div>
        <div class="venta-summary">
          <span class="venta-date">${new Date(venta.fecha).toLocaleString()}</span>
          <span class="venta-pagos-pill">${venta.pago.toUpperCase()}</span>
          <span class="venta-total">$${venta.total.toFixed(2)}</span>
        </div>
      </header>
      <ul class="venta-productos-list">
        ${venta.productos.map(item => `
          <li class="venta-prod">
            <span class="venta-prod-name">${item.product.nombre}</span>
            <span class="venta-prod-x">x${item.quantity}</span>
            <span class="venta-prod-amount">$${(item.product.precio * item.quantity).toFixed(2)}</span>
          </li>`).join("")}
      </ul>`;
    ventasContainer.appendChild(article);
  });

  // Paginación
  const createPageButton = (label, page, disabled = false, active = false) => {
    const li = document.createElement("li");
    li.className = "page-item" + (disabled ? " disabled" : "") + (active ? " active" : "");
    const a = document.createElement("a");
    a.className = "page-link";
    a.href = "#";
    a.textContent = label;
    a.addEventListener("click", e => {
      e.preventDefault();
      if (!disabled && currentPage !== page) {
        currentPage = page;
        renderVentasListPage();
      }
    });
    li.appendChild(a);
    return li;
  };

  const paginationContainerEl = document.getElementById("pagination-container");
  paginationContainerEl.appendChild(createPageButton("Anterior", currentPage - 1, currentPage === 1));
  for (let i = 1; i <= totalPages; i++) {
    paginationContainerEl.appendChild(createPageButton(i, i, false, currentPage === i));
  }
  paginationContainerEl.appendChild(createPageButton("Siguiente", currentPage + 1, currentPage === totalPages));
}

// Subtotales
function mostrarSubtotalFiltrado() {
  const subtotalDiv = document.getElementById("subtotal-payment");
  subtotalDiv.textContent = `Subtotal ventas filtradas: $${ventasFiltradas.reduce((acc,v)=>acc+v.total,0).toFixed(2)}`;
}

function calcularTotalVentasDia() {
  const hoy = new Date();
  const totalDia = ventasGuardadas.reduce((acc, v) => {
    const fechaVenta = new Date(v.fecha);
    if (fechaVenta.getFullYear() === hoy.getFullYear() &&
        fechaVenta.getMonth() === hoy.getMonth() &&
        fechaVenta.getDate() === hoy.getDate()) {
      return acc + Number(v.total || 0);
    }
    return acc;
  }, 0);

  const dia = String(hoy.getDate()).padStart(2,'0');
  const mes = String(hoy.getMonth()+1).padStart(2,'0');
  const anio = hoy.getFullYear();
  const totalDiaDiv = document.getElementById("total-day");
  if(totalDiaDiv) totalDiaDiv.textContent = ` (${dia} ${mes} ${anio}): TOTAL VENTAS: $${totalDia.toFixed(2)}`;
}


// Exportar CSV
function exportToCSV() {
  if(ventasFiltradas.length===0){alert("No hay ventas para exportar.");return;}
  const csvSeparator=";";
  const headers=["CANTIDAD","PRODUCTO","PRECIO","FORMA DE PAGO"];
  let csvContent="data:text/csv;charset=utf-8,"+headers.join(csvSeparator)+"\n";
  ventasFiltradas.forEach(v=>{
    v.productos.forEach(item=>{
      const row=[
        item.quantity,
        `"${item.product.nombre.replace(/"/g,'""')}"`,
        `"${(item.product.precio*item.quantity).toFixed(2).replace(".",",")}"`,
        `"${v.pago.toUpperCase()}"`
      ];
      csvContent+=row.join(csvSeparator)+"\n";
    });
  });
  const hoy=new Date(), dia=String(hoy.getDate()).padStart(2,'0'), mes=String(hoy.getMonth()+1).padStart(2,'0'), anio=hoy.getFullYear();
  const link=document.createElement("a");
  link.setAttribute("href",encodeURI(csvContent));
  link.setAttribute("download",`ventas_${dia}${mes}${anio}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

// Imprimir listado
function printVentas(){
  const printContents=document.getElementById("ventas-list").innerHTML;
  const originalContents=document.body.innerHTML;
  document.body.innerHTML=`<div><h2>Listado de Ventas</h2>${printContents}</div>`;
  window.print();
  document.body.innerHTML=originalContents;
  location.reload();
}

// Mensajes de estado
function setStatusMessage(msg,isError=false){
  const s=document.getElementById("status-message");
  if(!s)return;
  s.textContent=msg;
  s.classList.toggle("text-danger",isError);
  s.classList.toggle("text-muted",!isError);
}
function clearStatusMessage(){
  const s=document.getElementById("status-message");
  if(!s)return;
  s.textContent="";
  s.classList.remove("text-danger");
  s.classList.add("text-muted");
}

// Eventos
function setupEventListeners(){
  document.querySelectorAll(".filter-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      document.querySelectorAll(".filter-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");
      filtroPagoActual=btn.dataset.method;
      clearStatusMessage();
      aplicarFiltros();
    });
  });
  const searchInput=document.getElementById("search-text");
  const clearSearchBtn=document.getElementById("btn-clear-search");
  if(searchInput) searchInput.addEventListener("input",()=>{filtroBusqueda=searchInput.value;clearStatusMessage();aplicarFiltros();});
  if(clearSearchBtn) clearSearchBtn.addEventListener("click",()=>{searchInput.value="";filtroBusqueda="";clearStatusMessage();aplicarFiltros();});

  const exportBtn=document.getElementById("btn-export");
  if(exportBtn) exportBtn.addEventListener("click",exportToCSV);
  const printBtn=document.getElementById("btn-print");
  if(printBtn) printBtn.addEventListener("click",printVentas);
}

// Inicialización
document.addEventListener("DOMContentLoaded",()=>{
  loadVentas();
  setupEventListeners();
});
