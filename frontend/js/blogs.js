/* =====================================================================
   Única responsabilidad: dibujar las tarjetas del listado desde el
   arreglo BLOGS. Las páginas de detalle son HTML escrito a mano y no
   pasan por aquí.

   Depende de, en este orden de carga:
     js/datos/blogs.js -> BLOGS
     js/formato.js     -> formatearFecha()
     js/comunes.js     -> protegerImagen()
   ===================================================================== */

/**
 * Arma la tarjeta de una entrada del blog.
 *
 * El enunciado pide imagen, título y descripción corta. Se agregan la
 * fecha y el tiempo de lectura porque en un listado de noticias ayudan a
 * decidir qué abrir, y salen del mismo dato sin costo.
 *
 * @param {Object} entrada Entrada del arreglo BLOGS.
 * @returns {HTMLElement} Elemento <article> listo para insertar.
 */
function crearTarjetaBlog(entrada) {
  var articulo = document.createElement("article");
  articulo.className = "tarjeta-blog";

  /* La imagen también lleva al detalle, pero se esconde de los lectores de
     pantalla: el título de abajo ya es el enlace, y anunciarlo dos veces
     solo alarga la navegación. */
  var enlaceImagen = document.createElement("a");
  enlaceImagen.href = entrada.enlace;
  enlaceImagen.tabIndex = -1;
  enlaceImagen.setAttribute("aria-hidden", "true");

  var imagen = document.createElement("img");
  imagen.className = "tarjeta-blog__imagen";
  imagen.src = entrada.imagen;
  imagen.alt = entrada.alt || entrada.titulo;
  imagen.loading = "lazy";
  imagen.width = 400;
  imagen.height = 300;
  protegerImagen(imagen);
  enlaceImagen.appendChild(imagen);
  articulo.appendChild(enlaceImagen);

  var cuerpo = document.createElement("div");
  cuerpo.className = "tarjeta-blog__cuerpo";

  var meta = document.createElement("p");
  meta.className = "tarjeta-blog__meta";
  meta.textContent =
    entrada.categoria +
    " · " +
    formatearFecha(entrada.fecha) +
    " · " +
    entrada.minutosLectura +
    " min de lectura";
  cuerpo.appendChild(meta);

  var titulo = document.createElement("h3");
  titulo.className = "tarjeta-blog__titulo";

  var enlaceTitulo = document.createElement("a");
  enlaceTitulo.href = entrada.enlace;
  enlaceTitulo.textContent = entrada.titulo;
  titulo.appendChild(enlaceTitulo);
  cuerpo.appendChild(titulo);

  var resumen = document.createElement("p");
  resumen.className = "texto-suave";
  resumen.textContent = entrada.resumen;
  cuerpo.appendChild(resumen);

  var pie = document.createElement("p");
  pie.className = "tarjeta-blog__autor";
  pie.textContent = "Por " + entrada.autor;
  cuerpo.appendChild(pie);

  articulo.appendChild(cuerpo);

  return articulo;
}

/**
 * Dibuja el listado completo dentro de su contenedor.
 */
function mostrarBlogs() {
  var contenedor = document.getElementById("listado-blogs");

  if (!contenedor) {
    return;
  }

  contenedor.innerHTML = "";

  if (BLOGS.length === 0) {
    var vacio = document.createElement("p");
    vacio.className = "estado-vacio";
    vacio.textContent = "Todavía no hay entradas publicadas. Vuelve pronto.";
    contenedor.appendChild(vacio);
    return;
  }

  /* Más recientes primero, sin depender de cómo estén escritas en el
     arreglo: así agregar una entrada no obliga a ordenarlo a mano. */
  var ordenadas = BLOGS.slice().sort(function (a, b) {
    return b.fecha.localeCompare(a.fecha);
  });

  var fragmento = document.createDocumentFragment();

  ordenadas.forEach(function (entrada) {
    fragmento.appendChild(crearTarjetaBlog(entrada));
  });

  contenedor.appendChild(fragmento);
}

document.addEventListener("DOMContentLoaded", mostrarBlogs);
