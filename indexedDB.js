const DB_NAME = 'ProductosDB';
const DB_VERSION = 1;
const STORE_NAME = 'productos';

let db = null;

export function abrirDB() {
  return new Promise((resolve, reject) => {
    if (db) return resolve(db); // Ya abierta
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const dbase = event.target.result;
      if (!dbase.objectStoreNames.contains(STORE_NAME)) {
        dbase.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };
    request.onsuccess = (event) => {
      db = event.target.result;
      resolve(db);
    };
    request.onerror = (event) => reject(event.target.error);
  });
}

export function guardarProducto(producto) {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('DB no abierta'));
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.add(producto);
    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
}

export function leerProductos() {
  return new Promise((resolve, reject) => {
    if (!db) return reject(new Error('DB no abierta'));
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const productos = [];
    const request = store.openCursor();

    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        productos.push(cursor.value);
        cursor.continue();
      } else {
        resolve(productos);
      }
    };

    request.onerror = (event) => reject(event.target.error);
  });
}