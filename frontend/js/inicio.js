/* 
   Única responsabilidad: dibujar la lista de productos destacados de la
   portada. El catálogo completo, con sus filtros, es otra pantalla y vive
   en productos.js.

   Depende de, en este orden de carga:
     js/datos/productos.js  -> PRODUCTOS, CODIGOS_DESTACADOS, precioBase()
     js/formato.js          -> formatearPrecio(), recortarTexto()
     js/comunes.js          -> protegerImagen()

/**
 * Arma la tarjeta de un producto.
 *
 * Se construye con createElement y textContent en vez de innerHTML: así el
 * nombre o la descripción de un producto nunca podrían inyectar etiquetas
 * en la página. Es la misma precaución que hará falta cuando estos datos
 * lleguen desde la base de datos y no desde un arreglo nuestro.
 *
 * @param {Object} producto Producto del arreglo PRODUCTOS.
 * @returns {HTMLElement} Elemento <article> listo para insertar.
 */
function crearTarjetaProducto(producto) {
  var articulo = document.createElement("article");
  articulo.className = "tarjeta-producto";

  var imagen = document.createElement("img");
  imagen.className = "tarjeta-producto__imagen";
  imagen.src = producto.imagen;
  imagen.alt = producto.nombre;
  imagen.loading = "lazy";
  imagen.width = 400;
  imagen.height = 300;
  protegerImagen(imagen);
  articulo.appendChild(imagen);

  var cuerpo = document.createElement("div");
  cuerpo.className = "tarjeta-producto__cuerpo";

  var categoria = document.createElement("p");
  categoria.className = "etiqueta";
  categoria.textContent = producto.categoria;
  cuerpo.appendChild(categoria);

  var nombre = document.createElement("h3");
  nombre.className = "tarjeta-producto__nombre";
  nombre.textContent = producto.nombre;
  cuerpo.appendChild(nombre);

  var descripcion = document.createElement("p");
  descripcion.className = "texto-suave";
  descripcion.textContent = recortarTexto(producto.descripcion, 90);
  cuerpo.appendChild(descripcion);

  var precio = document.createElement("p");
  precio.className = "tarjeta-producto__precio";
  precio.textContent = formatearPrecio(precioBase(producto));
  cuerpo.appendChild(precio);

  var acciones = document.createElement("div");
  acciones.className = "tarjeta-producto__acciones";

  var enlace = document.createElement("a");
  enlace.className = "boton boton--bloque";
  enlace.href = "producto.html?codigo=" + encodeURIComponent(producto.codigo);
  /* El texto visible dice solo "Ver detalle" para no repetirse en cada
       tarjeta, pero un lector de pantalla necesita saber de cuál producto
       se trata, porque escucha los enlaces fuera de su contexto visual. */
  enlace.textContent = "Ver detalle";
  enlace.setAttribute("aria-label", "Ver detalle de " + producto.nombre);
  acciones.appendChild(enlace);

  cuerpo.appendChild(acciones);
  articulo.appendChild(cuerpo);

  return articulo;
}

/**
 * Dibuja los productos destacados dentro del contenedor de la portada.
 */
function mostrarDestacados() {
  var contenedor = document.getElementById("productos-destacados");

  if (!contenedor) {
    return;
  }

  var destacados = CODIGOS_DESTACADOS.map(buscarProducto).filter(
    function (producto) {
      return producto !== undefined;
    },
  );

  if (destacados.length === 0) {
    contenedor.innerHTML =
      '<p class="estado-vacio">Por ahora no hay productos para mostrar.</p>';
    return;
  }

  /* Se arma todo en un fragmento y se inserta de una sola vez, en lugar
       de tocar el documento seis veces seguidas. */
  var fragmento = document.createDocumentFragment();

  destacados.forEach(function (producto) {
    fragmento.appendChild(crearTarjetaProducto(producto));
  });

  contenedor.innerHTML = "";
  contenedor.appendChild(fragmento);
}

document.addEventListener("DOMContentLoaded", mostrarDestacados);
