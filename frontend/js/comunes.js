/*
   Este archivo se carga en todas las páginas, así que aquí NO va lógica
   de ninguna pantalla en particular. El carrito vive acá porque su
   contador se muestra en la cabecera de todas ellas.

/* Nombre de la llave en localStorage. Se declara una sola vez para que
   ninguna pantalla la escriba a mano y termine leyendo otra distinta. */
var CLAVE_CARRITO = "pms_carrito";

/* ---------------------------------------------------------------------
   1. ALMACENAMIENTO DEL CARRITO
   --------------------------------------------------------------------- */

/**
 * Lee el carrito guardado en el navegador.
 * Si no hay nada o el contenido está corrupto, devuelve un arreglo vacío
 * en lugar de romper la página.
 * @returns {Array} Ítems del carrito.
 */
function obtenerCarrito() {
  try {
    var guardado = localStorage.getItem(CLAVE_CARRITO);
    var carrito = guardado ? JSON.parse(guardado) : [];
    return Array.isArray(carrito) ? carrito : [];
  } catch (error) {
    console.warn("No se pudo leer el carrito, se parte de uno vacío.", error);
    return [];
  }
}

/**
 * Guarda el carrito y actualiza el contador de la cabecera.
 * @param {Array} carrito Ítems del carrito.
 */
function guardarCarrito(carrito) {
  try {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
  } catch (error) {
    console.warn("No se pudo guardar el carrito.", error);
  }
  actualizarContadorCarrito();
}

/**
 * Suma las unidades del carrito. Tres tortas iguales cuentan como tres.
 * @returns {number} Total de unidades.
 */
function contarUnidadesCarrito() {
  return obtenerCarrito().reduce(function (total, item) {
    return total + (Number(item.cantidad) || 0);
  }, 0);
}

/* ---------------------------------------------------------------------
   2. CONTADOR DEL CARRITO
   --------------------------------------------------------------------- */

/**
 * Refresca el número que se muestra junto al carrito en la cabecera.
 * No hace nada si la página no tiene ese elemento.
 */
function actualizarContadorCarrito() {
  var contador = document.getElementById("carrito-contador");

  if (!contador) {
    return;
  }

  var unidades = contarUnidadesCarrito();

  contador.textContent = unidades;
  contador.classList.toggle("carrito-contador--vacio", unidades === 0);

  var etiqueta = document.getElementById("carrito-etiqueta");
  if (etiqueta) {
    etiqueta.textContent =
      unidades === 1
        ? "Carrito: 1 producto"
        : "Carrito: " + unidades + " productos";
  }
}

/* ---------------------------------------------------------------------
   3. PÁGINA ACTIVA EN EL MENÚ
   --------------------------------------------------------------------- */

/**
 * Compara el archivo de la URL con el href de cada enlace del menú y le
 * pone la clase de estado activo al que corresponde. Así el marcado del
 * header es idéntico en las 11 páginas: no hay que acordarse de mover la
 * clase a mano en cada archivo.
 */
function marcarEnlaceActivo() {
  var enlaces = document.querySelectorAll(".navegacion__enlace");
  var actual = window.location.pathname.split("/").pop() || "index.html";

  enlaces.forEach(function (enlace) {
    var destino = enlace.getAttribute("href");

    if (destino === actual) {
      enlace.classList.add("navegacion__enlace--activo");
      enlace.setAttribute("aria-current", "page");
    }
  });
}

/* ---------------------------------------------------------------------
   4. MENÚ MÓVIL
   --------------------------------------------------------------------- */

/**
 * Conecta el botón de menú con la navegación en pantallas angostas.
 * Mantiene aria-expanded al día para que un lector de pantalla anuncie
 * si el menú está abierto o cerrado.
 */
function activarMenuMovil() {
  var boton = document.getElementById("menu-boton");
  var navegacion = document.getElementById("navegacion-principal");

  if (!boton || !navegacion) {
    return;
  }

  boton.addEventListener("click", function () {
    var abierto = navegacion.classList.toggle("navegacion--abierta");
    boton.setAttribute("aria-expanded", abierto ? "true" : "false");
  });
}

/* ---------------------------------------------------------------------
   5. IMAGEN DE REEMPLAZO
   --------------------------------------------------------------------- */

/* Dibujo mínimo en SVG, incrustado como data URI para no depender de otro
   archivo. Se usa cuando la foto de un producto todavía no existe. */
var IMAGEN_REEMPLAZO =
  "data:image/svg+xml;charset=UTF-8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300">' +
      '<rect width="400" height="300" fill="#FDF0DC"/>' +
      '<text x="200" y="150" font-size="64" text-anchor="middle" dominant-baseline="central">🧁</text>' +
      '<text x="200" y="215" font-family="sans-serif" font-size="16" fill="#8D7B72" ' +
      'text-anchor="middle">Imagen no disponible</text></svg>',
  );

/**
 * Aplica la estrategia de reemplazo a una imagen que no pudo cargar.
 * Con data-reemplazo="ocultar" la imagen desaparece (sirve para el logo,
 * porque el nombre de la tienda ya está escrito al lado); en cualquier
 * otro caso se pone el dibujo de reemplazo.
 * @param {HTMLImageElement} imagen Elemento img que falló.
 */
function reemplazarImagen(imagen) {
  if (imagen.getAttribute("data-reemplazo") === "ocultar") {
    imagen.hidden = true;
    return;
  }
  imagen.src = IMAGEN_REEMPLAZO;
}

/**
 * Hace que una imagen caiga en su reemplazo si el archivo falta.
 *
 * Cubre los dos momentos posibles, que es justo donde es fácil equivocarse:
 * si la imagen todavía no terminó de cargar basta con escuchar el evento
 * error, pero si YA falló antes de que este código corriera —lo normal en
 * las imágenes escritas directamente en el HTML— ese evento nunca volverá a
 * dispararse, y hay que detectarlo mirando el estado del elemento.
 * Una imagen rota tiene complete = true y naturalWidth = 0.
 *
 * @param {HTMLImageElement} imagen Elemento img a proteger.
 */
function protegerImagen(imagen) {
  if (imagen.complete && imagen.naturalWidth === 0) {
    reemplazarImagen(imagen);
    return;
  }

  imagen.addEventListener("error", function alFallar() {
    imagen.removeEventListener("error", alFallar);
    reemplazarImagen(imagen);
  });
}

/**
 * Aplica protegerImagen() a todas las imágenes marcadas con data-reemplazo.
 */
function protegerImagenesDeLaPagina() {
  document.querySelectorAll("img[data-reemplazo]").forEach(protegerImagen);
}

/* ---------------------------------------------------------------------
   6. ARRANQUE
   --------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", function () {
  marcarEnlaceActivo();
  activarMenuMovil();
  actualizarContadorCarrito();
  protegerImagenesDeLaPagina();
});
