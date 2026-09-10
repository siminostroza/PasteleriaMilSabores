/* =====================================================================
   El caso pide filtrar por tipo de torta (cuadrada o circular) y por
   tamaño, y el documento de deseos agrega una búsqueda para encontrar
   productos rápido. Los cuatro filtros se combinan entre sí.

   Depende de, en este orden de carga:
     js/datos/productos.js -> PRODUCTOS, CATEGORIAS, precioBase(), tamanoBase()
     js/formato.js         -> formatearPrecio(), recortarTexto()
     js/comunes.js         -> protegerImagen(), mostrarAviso()
     js/carrito.js         -> agregarAlCarrito(), renderMiniCarrito()
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. ESTADO DE LOS FILTROS

   Un único objeto con lo que el usuario tiene elegido. Cualquier control
   que cambie escribe aquí y vuelve a pedir el dibujo: no hay que recordar
   qué filtro se tocó ni en qué orden.
   --------------------------------------------------------------------- */
var filtros = {
  busqueda: "",
  categoria: "",
  tipoTorta: "",
  tamano: "",
};

/* ---------------------------------------------------------------------
   2. LECTURA DE LOS CONTROLES
   --------------------------------------------------------------------- */

/**
 * Llena el desplegable de categorías desde el arreglo de datos, en lugar de
 * escribir las ocho opciones a mano en el HTML. Si mañana el catálogo suma
 * una categoría, el filtro la muestra solo.
 */
function poblarFiltroCategorias() {
  var select = document.getElementById("filtro-categoria");

  if (!select) {
    return;
  }

  CATEGORIAS.forEach(function (categoria) {
    var opcion = document.createElement("option");
    opcion.value = categoria;
    opcion.textContent = categoria;
    select.appendChild(opcion);
  });
}

/**
 * Llena el desplegable de tamaños con los nombres que existen realmente en
 * el catálogo, sin repetirlos.
 */
function poblarFiltroTamanos() {
  var select = document.getElementById("filtro-tamano");

  if (!select) {
    return;
  }

  var vistos = [];

  PRODUCTOS.forEach(function (producto) {
    producto.tamanos.forEach(function (tamano) {
      if (vistos.indexOf(tamano.nombre) === -1) {
        vistos.push(tamano.nombre);
      }
    });
  });

  vistos.forEach(function (nombre) {
    var opcion = document.createElement("option");
    opcion.value = nombre;
    opcion.textContent = nombre;
    select.appendChild(opcion);
  });
}

/**
 * Aplica el filtro que venga en la dirección, por ejemplo
 * productos.html?categoria=Tortas%20Cuadradas.
 * Sirve para enlazar al catálogo ya filtrado desde otra página.
 */
function aplicarFiltroDeLaUrl() {
  var parametros = new URLSearchParams(window.location.search);
  var categoria = parametros.get("categoria");

  if (!categoria) {
    return;
  }

  if (CATEGORIAS.indexOf(categoria) === -1) {
    return;
  }

  filtros.categoria = categoria;

  var select = document.getElementById("filtro-categoria");
  if (select) {
    select.value = categoria;
  }
}

/**
 * Conecta los cuatro controles de filtro y el botón de limpiar.
 */
function activarFiltros() {
  var busqueda = document.getElementById("filtro-busqueda");
  var categoria = document.getElementById("filtro-categoria");
  var tipoTorta = document.getElementById("filtro-tipo-torta");
  var tamano = document.getElementById("filtro-tamano");
  var limpiar = document.getElementById("filtro-limpiar");
  var formulario = document.getElementById("formulario-filtros");

  /* El formulario nunca se envía: filtra en vivo mientras se escribe.
       Se corta el submit para que Enter no recargue la página y borre los
       filtros que el usuario ya había puesto. */
  if (formulario) {
    formulario.addEventListener("submit", function (evento) {
      evento.preventDefault();
    });
  }

  if (busqueda) {
    busqueda.addEventListener("input", function () {
      filtros.busqueda = busqueda.value.trim().toLowerCase();
      mostrarCatalogo();
    });
  }

  if (categoria) {
    categoria.addEventListener("change", function () {
      filtros.categoria = categoria.value;
      mostrarCatalogo();
    });
  }

  if (tipoTorta) {
    tipoTorta.addEventListener("change", function () {
      filtros.tipoTorta = tipoTorta.value;
      mostrarCatalogo();
    });
  }

  if (tamano) {
    tamano.addEventListener("change", function () {
      filtros.tamano = tamano.value;
      mostrarCatalogo();
    });
  }

  if (limpiar) {
    limpiar.addEventListener("click", function () {
      filtros = { busqueda: "", categoria: "", tipoTorta: "", tamano: "" };

      if (busqueda) {
        busqueda.value = "";
      }
      if (categoria) {
        categoria.value = "";
      }
      if (tipoTorta) {
        tipoTorta.value = "";
      }
      if (tamano) {
        tamano.value = "";
      }

      mostrarCatalogo();
    });
  }
}

/* ---------------------------------------------------------------------
   3. APLICACIÓN DE LOS FILTROS
   --------------------------------------------------------------------- */

/**
 * Decide si un producto pasa todos los filtros activos.
 * Un filtro vacío no descarta nada, así los cuatro se combinan sin que
 * haya que escribir una condición por cada combinación posible.
 * @param {Object} producto Producto del arreglo PRODUCTOS.
 * @returns {boolean} true si el producto debe mostrarse.
 */
function pasaLosFiltros(producto) {
  if (filtros.categoria && producto.categoria !== filtros.categoria) {
    return false;
  }

  if (filtros.tipoTorta && producto.tipoTorta !== filtros.tipoTorta) {
    return false;
  }

  if (filtros.tamano) {
    var tieneTamano = producto.tamanos.some(function (tamano) {
      return tamano.nombre === filtros.tamano;
    });

    if (!tieneTamano) {
      return false;
    }
  }

  if (filtros.busqueda) {
    /* Se busca en el nombre, la descripción y el código: así el cliente
           encuentra "chocolate" y el vendedor encuentra "TC001". */
    var texto = (
      producto.nombre +
      " " +
      producto.descripcion +
      " " +
      producto.codigo
    ).toLowerCase();

    if (texto.indexOf(filtros.busqueda) === -1) {
      return false;
    }
  }

  return true;
}

/* ---------------------------------------------------------------------
   4. DIBUJO DE LAS TARJETAS
   --------------------------------------------------------------------- */

/**
 * Arma la tarjeta de un producto del catálogo.
 *
 * A diferencia de la tarjeta de la portada, esta lleva el botón de añadir al
 * carrito que pide la Figura 8 del enunciado. El botón agrega el tamaño de
 * referencia; elegir otro tamaño es una decisión del detalle del producto,
 * donde se ven los tres precios.
 *
 * @param {Object} producto Producto del arreglo PRODUCTOS.
 * @returns {HTMLElement} Elemento <article> listo para insertar.
 */
function crearTarjetaCatalogo(producto) {
  var base = tamanoBase(producto);
  var enlaceDetalle =
    "producto.html?codigo=" + encodeURIComponent(producto.codigo);

  var articulo = document.createElement("article");
  articulo.className = "tarjeta-producto";

  /* La imagen es también un enlace al detalle: el enunciado pide que al
       hacer clic en el producto se llegue a su ficha. */
  var enlaceImagen = document.createElement("a");
  enlaceImagen.href = enlaceDetalle;
  enlaceImagen.tabIndex = -1; /* el nombre de abajo ya es enlace */
  enlaceImagen.setAttribute("aria-hidden", "true");

  var imagen = document.createElement("img");
  imagen.className = "tarjeta-producto__imagen";
  imagen.src = producto.imagen;
  imagen.alt = producto.nombre;
  imagen.loading = "lazy";
  imagen.width = 400;
  imagen.height = 300;
  protegerImagen(imagen);
  enlaceImagen.appendChild(imagen);
  articulo.appendChild(enlaceImagen);

  var cuerpo = document.createElement("div");
  cuerpo.className = "tarjeta-producto__cuerpo";

  var categoria = document.createElement("p");
  categoria.className = "etiqueta";
  categoria.textContent = producto.categoria;
  cuerpo.appendChild(categoria);

  var nombre = document.createElement("h3");
  nombre.className = "tarjeta-producto__nombre";

  var enlaceNombre = document.createElement("a");
  enlaceNombre.href = enlaceDetalle;
  enlaceNombre.textContent = producto.nombre;
  nombre.appendChild(enlaceNombre);
  cuerpo.appendChild(nombre);

  var descripcion = document.createElement("p");
  descripcion.className = "texto-suave";
  descripcion.textContent = recortarTexto(producto.descripcion, 95);
  cuerpo.appendChild(descripcion);

  /* Los tamaños disponibles, para que el filtro tenga un reflejo visible */
  var tamanos = document.createElement("p");
  tamanos.className = "tarjeta-producto__tamanos";
  tamanos.textContent = producto.tamanos
    .map(function (t) {
      return t.nombre;
    })
    .join(" · ");
  cuerpo.appendChild(tamanos);

  var precio = document.createElement("p");
  precio.className = "tarjeta-producto__precio";
  precio.textContent = formatearPrecio(base.precio);

  if (producto.tamanos.length > 1) {
    var desde = document.createElement("span");
    desde.className = "tarjeta-producto__nota";
    desde.textContent = " · " + base.nombre;
    precio.appendChild(desde);
  }

  cuerpo.appendChild(precio);

  var acciones = document.createElement("div");
  acciones.className = "tarjeta-producto__acciones";

  var botonAgregar = document.createElement("button");
  botonAgregar.type = "button";
  botonAgregar.className = "boton";
  botonAgregar.textContent = "Añadir al carrito";
  botonAgregar.setAttribute(
    "aria-label",
    "Añadir " + producto.nombre + " al carrito",
  );

  if (base.stock === 0) {
    botonAgregar.disabled = true;
    botonAgregar.textContent = "Sin stock";
  }

  botonAgregar.addEventListener("click", function () {
    var resultado = agregarAlCarrito(producto.codigo, base.nombre, 1);
    mostrarAviso(resultado.mensaje, resultado.ok ? "exito" : "error");

    if (resultado.ok) {
      renderMiniCarrito();
    }
  });

  acciones.appendChild(botonAgregar);

  var verDetalle = document.createElement("a");
  verDetalle.className = "boton boton--borde";
  verDetalle.href = enlaceDetalle;
  verDetalle.textContent = "Ver detalle";
  verDetalle.setAttribute("aria-label", "Ver detalle de " + producto.nombre);
  acciones.appendChild(verDetalle);

  cuerpo.appendChild(acciones);
  articulo.appendChild(cuerpo);

  return articulo;
}

/**
 * Dibuja el catálogo con los filtros que estén activos y actualiza el
 * contador de resultados.
 */
function mostrarCatalogo() {
  var contenedor = document.getElementById("catalogo");
  var contador = document.getElementById("catalogo-contador");

  if (!contenedor) {
    return;
  }

  var visibles = PRODUCTOS.filter(pasaLosFiltros);

  contenedor.innerHTML = "";

  if (contador) {
    contador.textContent =
      visibles.length === PRODUCTOS.length
        ? "Mostrando los " + PRODUCTOS.length + " productos del catálogo"
        : "Mostrando " +
          visibles.length +
          " de " +
          PRODUCTOS.length +
          " productos";
  }

  if (visibles.length === 0) {
    var vacio = document.createElement("p");
    vacio.className = "estado-vacio";
    vacio.textContent =
      "Ningún producto coincide con esa búsqueda. " +
      "Prueba quitando algún filtro.";
    contenedor.appendChild(vacio);
    return;
  }

  var fragmento = document.createDocumentFragment();

  visibles.forEach(function (producto) {
    fragmento.appendChild(crearTarjetaCatalogo(producto));
  });

  contenedor.appendChild(fragmento);
}

/* ---------------------------------------------------------------------
   5. ARRANQUE
   --------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", function () {
  poblarFiltroCategorias();
  poblarFiltroTamanos();
  aplicarFiltroDeLaUrl();
  activarFiltros();
  mostrarCatalogo();
});
