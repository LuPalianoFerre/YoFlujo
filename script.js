//cargar el nav dinamico
function loadNav() {
    fetch('nav.html')
      .then(response => {
        if (!response.ok) {
          throw new Error('No se pudo cargar el nav.html');
        }
        return response.text();
      })
      .then(data => {
        document.getElementById('nav-placeholder').innerHTML = data;
      })
      .catch(error => console.error('Error cargando el navbar:', error));
  }

  document.addEventListener('DOMContentLoaded', loadNav);