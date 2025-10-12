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

document.addEventListener("DOMContentLoaded", () => {
  loadNav();

  const crearProductoModal = new bootstrap.Modal(document.getElementById('crearProductoModal'));
  const administrarProductosModal = new bootstrap.Modal(document.getElementById('administrar-productos-modal'));

  document.getElementById('btn-crear-producto').addEventListener('click', () => {
    crearProductoModal.show();
  });

  document.getElementById('btn-administrar-productos').addEventListener('click', () => {
    cargarListaProductos();
    administrarProductosModal.show();
  });

  document.getElementById('formCrearProducto').addEventListener('submit', function (e) {
    e.preventDefault();

    const nombreInput = document.getElementById('inputNombreProducto');
    const precioInput = document.getElementById('inputPrecioProducto');

    const nombre = nombreInput.value.trim();
    const precio = parseFloat(precioInput.value);

    if (!nombre || isNaN(precio) || precio < 0) {
      alert('Por favor ingresa datos válidos.');
      return;
    }

    // Obtener productos actuales
    let productos = JSON.parse(localStorage.getItem('productos')) || [];

    // Generar nuevo ID sumando 1 al máximo actual
    let maxId = productos.reduce((max, p) => Math.max(max, p.id || 0), 0);
    let nuevoId = maxId + 1;

    const nuevoProducto = {
      id: nuevoId,
      nombre: nombre,
      precio: precio,
    };

    // Añadir a la lista y guardar
    productos.push(nuevoProducto);
    localStorage.setItem('productos', JSON.stringify(productos));

    alert('Producto creado correctamente!');

    // Limpiar formulario
    nombreInput.value = '';
    precioInput.value = '';

    crearProductoModal.hide();
  });

  function cargarListaProductos() {
    let productos = JSON.parse(localStorage.getItem('productos')) || [];
    const lista = document.getElementById('lista-productos');
    lista.innerHTML = '';

    productos.forEach(prod => {
      // Crear elemento de lista con botón eliminar
      const li = document.createElement('li');
      li.className = "list-group-item d-flex justify-content-between align-items-center";
      li.textContent = `${prod.nombre} - $${prod.precio.toFixed(2)}`;

      const btnEliminar = document.createElement('button');
      btnEliminar.className = 'btn btn-sm btn-danger';
      btnEliminar.textContent = 'Eliminar';
      btnEliminar.addEventListener('click', () => {
        eliminarProducto(prod.id);
      });

      li.appendChild(btnEliminar);
      lista.appendChild(li);
    });
  }

  function eliminarProducto(id) {
    let productos = JSON.parse(localStorage.getItem('productos')) || [];
    productos = productos.filter(p => p.id !== id);
    localStorage.setItem('productos', JSON.stringify(productos));

    // Actualizar lista después de borrar
    cargarListaProductos();
    alert('Producto eliminado correctamente');
  }
});