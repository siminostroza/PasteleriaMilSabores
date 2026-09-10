// Lista de productos predefinidos
const productos = [
  { id: 1, nombre: "Pan", precio: 500 },
  { id: 2, nombre: "Leche", precio: 900 },
  { id: 3, nombre: "Café", precio: 2500 },
  { id: 4, nombre: "Azúcar", precio: 1200 },
  { id: 5, nombre: "Arroz", precio: 1500 },
  { id: 6, nombre: "Fideos", precio: 1000 },
  { id: 7, nombre: "Aceite", precio: 3500 },
  { id: 8, nombre: "Jugo", precio: 800 },
  { id: 9, nombre: "Queso", precio: 2700 },
  { id: 10, nombre: "Mantequilla", precio: 2100 }
];
  
  let carrito = JSON.parse(localStorage.getItem('carrito')) || [];
  
  const productList = document.getElementById('product-list');
  const cartList = document.getElementById('cart-list');
  
  // Mostrar productos
  function mostrarProductos() {
    productList.innerHTML = '';
    productos.forEach(producto => {
      const div = document.createElement('div');
      div.className = 'product';
      div.innerHTML = `
        <strong>${producto.nombre}</strong><br>
        Precio: $${producto.precio}<br>
        <button onclick="agregarAlCarrito(${producto.id})">Agregar al carrito</button>
      `;
      productList.appendChild(div);
    });
  }
  
  // Agregar al carrito
  function agregarAlCarrito(id) {
    const producto = productos.find(p => p.id === id);
    const item = carrito.find(i => i.id === id);
  
    if (item) {
      // Regla formativa: máximo 5 unidades por producto
      if (item.cantidad >= 5) {
        alert("Máximo 5 unidades por producto");
        return;
      }

      item.cantidad += 1;
    } else {
      carrito.push({ ...producto, cantidad: 1 });
    }
  
    guardarCarrito();
    mostrarCarrito();
  }
  
  // Disminuir cantidad
  function disminuirCantidad(id) {
    const item = carrito.find(i => i.id === id);
    if (item) {
      item.cantidad -= 1;
      if (item.cantidad <= 0) {
        carrito = carrito.filter(i => i.id !== id);
      }
      guardarCarrito();
      mostrarCarrito();
    }
  }
  
  // Eliminar del carrito
  function eliminarDelCarrito(id) {
    carrito = carrito.filter(item => item.id !== id);
    guardarCarrito();
    mostrarCarrito();
  }
  
  // Vaciar carrito completamente
  function vaciarCarrito() {
    carrito = [];
    guardarCarrito();
    mostrarCarrito();
  }
  
  // Guardar en localStorage
  function guardarCarrito() {
    localStorage.setItem('carrito', JSON.stringify(carrito));
  }
  
  // Mostrar carrito
  function mostrarCarrito() {
    cartList.innerHTML = '';
  
    if (carrito.length === 0) {
      cartList.innerHTML = '<p>El carrito está vacío.</p>';
      return;
    }
  
    carrito.forEach(item => {
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <strong>${item.nombre}</strong><br>
        Precio: $${item.precio} x ${item.cantidad} = $${item.precio * item.cantidad}<br>
        <button onclick="agregarAlCarrito(${item.id})">+</button>
        <button onclick="disminuirCantidad(${item.id})">-</button>
        <button onclick="eliminarDelCarrito(${item.id})">Eliminar</button>
      `;
      cartList.appendChild(div);
    });
  
    const total = carrito.reduce((sum, item) => sum + item.precio * item.cantidad, 0);
    cartList.innerHTML += `<h3>Total: $${total}</h3>`;
  }
  
  // Inicializar
  mostrarProductos();
  mostrarCarrito();
  