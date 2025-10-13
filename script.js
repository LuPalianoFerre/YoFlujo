// ------- Cargar Navbar Dinámico (versión async/await) -------
async function loadNav() {
  try {
    const response = await fetch('nav.html');
    if (!response.ok) throw new Error('No se pudo cargar el nav.html');
    const data = await response.text();
    document.getElementById('nav-placeholder').innerHTML = data;
  } catch (error) {
    console.error('Error cargando el navbar:', error);
  }
}

// ------- Funciones de Productos -------
function cargarListaProductos() {
  const lista = document.getElementById('lista-productos');
  if (!lista) return;

  let productos = JSON.parse(localStorage.getItem('productos')) || [];
  lista.innerHTML = '';

  productos.forEach(prod => {
    const li = document.createElement('li');
    li.className = "list-group-item d-flex justify-content-between align-items-center";
    li.textContent = `${prod.nombre} - $${prod.precio.toFixed(2)}`;

    const btnEliminar = document.createElement('button');
    btnEliminar.className = 'btn btn-sm btn-danger';
    btnEliminar.textContent = 'Eliminar';
    btnEliminar.addEventListener('click', () => eliminarProducto(prod.id));

    li.appendChild(btnEliminar);
    lista.appendChild(li);
  });
}

function eliminarProducto(id) {
  let productos = JSON.parse(localStorage.getItem('productos')) || [];
  productos = productos.filter(p => p.id !== id);
  localStorage.setItem('productos', JSON.stringify(productos));

  cargarListaProductos();
  alert('Producto eliminado correctamente');
}

// ------- Inicialización Segura de Bootstrap -------
function inicializarBootstrap() {
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.forEach(el => new bootstrap.Tooltip(el));

  const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
  popoverTriggerList.forEach(el => new bootstrap.Popover(el));
}

// ------- Inicialización principal -------
document.addEventListener("DOMContentLoaded", async () => {

  // 1️⃣ Cargar Navbar
  await loadNav();

  // 2️⃣ Inicializar modales solo si existen
  const crearProductoModalEl = document.getElementById('crearProductoModal');
  const administrarProductosModalEl = document.getElementById('administrar-productos-modal');

  const crearProductoModal = crearProductoModalEl ? new bootstrap.Modal(crearProductoModalEl) : null;
  const administrarProductosModal = administrarProductosModalEl ? new bootstrap.Modal(administrarProductosModalEl) : null;

  // 3️⃣ Botones modales
  const btnCrearProducto = document.getElementById('btn-crear-producto');
  if (btnCrearProducto && crearProductoModal) {
    btnCrearProducto.addEventListener('click', () => crearProductoModal.show());
  }

  const btnAdministrarProductos = document.getElementById('btn-administrar-productos');
  if (btnAdministrarProductos && administrarProductosModal) {
    btnAdministrarProductos.addEventListener('click', () => {
      cargarListaProductos();
      administrarProductosModal.show();
    });
  }

  // 4️⃣ Formulario creación de producto
  const formCrearProducto = document.getElementById('formCrearProducto');
  if (formCrearProducto) {
    formCrearProducto.addEventListener('submit', function(e) {
      e.preventDefault();

      const nombreInput = document.getElementById('inputNombreProducto');
      const precioInput = document.getElementById('inputPrecioProducto');

      const nombre = nombreInput.value.trim();
      const precio = parseFloat(precioInput.value);

      if (!nombre || isNaN(precio) || precio < 0) {
        alert('Por favor ingresa datos válidos.');
        return;
      }

      let productos = JSON.parse(localStorage.getItem('productos')) || [];
      let maxId = productos.reduce((max, p) => Math.max(max, p.id || 0), 0);
      let nuevoId = maxId + 1;

      productos.push({ id: nuevoId, nombre, precio });
      localStorage.setItem('productos', JSON.stringify(productos));

      alert('Producto creado correctamente!');
      nombreInput.value = '';
      precioInput.value = '';

      if (crearProductoModal) crearProductoModal.hide();
    });
  }

  // 5️⃣ Inicializar tooltips y popovers
  inicializarBootstrap();

});
