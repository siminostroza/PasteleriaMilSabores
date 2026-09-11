/* =====================================================================
 
   Este archivo se carga en productos.html, producto.html y carrito.html,
   porque el caso pide que el carrito funcione en las tres. Aquí vive el
   QUÉ puede hacer el carrito; cada pantalla decide CÓMO lo muestra.

   El guardado en localStorage lo hacen obtenerCarrito() y guardarCarrito(),
   que están en comunes.js porque el contador de la cabecera también los usa.

   Depende de:
     js/datos/productos.js -> buscarProducto()
     js/formato.js         -> formatearPrecio()
     js/comunes.js         -> obtenerCarrito(), guardarCarrito(), mostrarAviso()
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. REGLAS DEL NEGOCIO

   El enunciado pide "investigar y definir reglas del carrito de compra
   mediante lógicas". Estas son las que se aplican, y el porqué de cada una:

   a) Máximo 5 unidades del mismo producto y tamaño. Es una pastelería
      artesanal: un pedido mayor deja de ser una compra de tienda y pasa a
      ser un encargo por catálogo, que se coordina por contacto.

   b) Nunca más unidades que el stock de ESE tamaño. El stock vive en cada
      variante, no en el producto: puede quedar torta mediana y no grande.

   c) El precio se copia al agregar, no se recalcula al mostrar. Si mañana
      sube el precio, lo que el cliente ya tenía en su carrito no cambia.
      Es la misma decisión que toma la base de datos al congelar el precio
      en detalle_pedido.

   d) Dos veces el mismo producto y tamaño se suman en una sola línea, salvo
      que lleven mensajes personalizados distintos: ahí son dos tortas
      diferentes y van separadas.
   --------------------------------------------------------------------- */
var MAX_UNIDADES_POR_ITEM = 5;

/* ---------------------------------------------------------------------
   2. IDENTIDAD DE UN ÍTEM
   --------------------------------------------------------------------- */

/**
 * Construye la clave que identifica una línea del carrito.
 * Junta código, tamaño y mensaje: así "torta mediana con mensaje A" y
 * "torta mediana con mensaje B" conviven como dos líneas distintas.
 * @param {string} codigo Código del producto.
 * @param {string} tamano Nombre del tamaño.
 * @param {string} mensaje Mensaje personalizado, puede ir vacío.
 * @returns {string} Clave única de la línea.
 */
function construirClaveItem(codigo, tamano, mensaje) {
  return codigo + "|" + tamano + "|" + (mensaje || "");
}

/**
 * Busca una línea del carrito por su clave.
 * @param {Array} carrito Carrito actual.
 * @param {string} clave Clave de la línea.
 * @returns {Object|undefined} La línea, o undefined si no está.
 */
function buscarItemCarrito(carrito, clave) {
  return carrito.find(function (item) {
    return item.clave === clave;
  });
}

/* ---------------------------------------------------------------------
   3. OPERACIONES
   --------------------------------------------------------------------- */

/**
 * Agrega unidades de un producto al carrito, aplicando las reglas de arriba.
 *
 * Devuelve un objeto en vez de lanzar una excepción o mostrar un alert:
 * quien llama decide cómo comunicar el resultado, y la función se puede
 * probar sin navegador.
 *
 * @param {string} codigo Código del producto, por ejemplo 'TC001'.
 * @param {string} nombreTamano Nombre del tamaño, por ejemplo 'Mediana'.
 * @param {number} cantidad Unidades a agregar. Por omisión, 1.
 * @param {string} mensaje Mensaje personalizado, opcional.
 * @returns {{ok: boolean, mensaje: string}} Resultado de la operación.
 */
function agregarAlCarrito(codigo, nombreTamano, cantidad, mensaje) {
  var unidades = Number(cantidad) || 1;
  var producto = buscarProducto(codigo);

  if (!producto) {
    return { ok: false, mensaje: "Ese producto no existe en el catálogo." };
  }

  var tamano = producto.tamanos.find(function (t) {
    return t.nombre === nombreTamano;
  });

  if (!tamano) {
    return {
      ok: false,
      mensaje: "Ese tamaño no está disponible para este producto.",
    };
  }

  if (unidades < 1) {
    return { ok: false, mensaje: "La cantidad debe ser al menos 1." };
  }

  if (mensaje && !producto.permiteMensaje) {
    return {
      ok: false,
      mensaje: "Este producto no admite mensaje personalizado.",
    };
  }

  var carrito = obtenerCarrito();
  var clave = construirClaveItem(producto.codigo, tamano.nombre, mensaje);
  var existente = buscarItemCarrito(carrito, clave);
  var yaTiene = existente ? existente.cantidad : 0;
  var total = yaTiene + unidades;

  /* Regla (a): tope por línea */
  if (total > MAX_UNIDADES_POR_ITEM) {
    return {
      ok: false,
      mensaje:
        "Máximo " +
        MAX_UNIDADES_POR_ITEM +
        " unidades por producto. " +
        "Para pedidos mayores, escríbenos desde Contacto.",
    };
  }

  /* Regla (b): tope por stock de esa variante */
  if (total > tamano.stock) {
    return {
      ok: false,
      mensaje:
        "Solo quedan " +
        tamano.stock +
        " unidades de " +
        producto.nombre +
        " en tamaño " +
        tamano.nombre +
        ".",
    };
  }

  if (existente) {
    existente.cantidad = total;
  } else {
    /* Regla (c): se guarda una copia de los datos, no una referencia */
    carrito.push({
      clave: clave,
      codigo: producto.codigo,
      nombre: producto.nombre,
      imagen: producto.imagen,
      tamano: tamano.nombre,
      precio: tamano.precio,
      cantidad: unidades,
      mensaje: mensaje || "",
    });
  }

  guardarCarrito(carrito);

  return {
    ok: true,
    mensaje: producto.nombre + " (" + tamano.nombre + ") agregado al carrito.",
  };
}

/**
 * Suma o resta unidades a una línea existente.
 * Si la cantidad llega a cero, la línea se elimina.
 * @param {string} clave Clave de la línea.
 * @param {number} delta Cuánto sumar; usar -1 para restar.
 * @returns {{ok: boolean, mensaje: string}} Resultado de la operación.
 */
function cambiarCantidadCarrito(clave, delta) {
  var carrito = obtenerCarrito();
  var item = buscarItemCarrito(carrito, clave);

  if (!item) {
    return { ok: false, mensaje: "Ese producto ya no está en el carrito." };
  }

  var nueva = item.cantidad + Number(delta);

  if (nueva <= 0) {
    return eliminarDelCarrito(clave);
  }

  if (nueva > MAX_UNIDADES_POR_ITEM) {
    return {
      ok: false,
      mensaje: "Máximo " + MAX_UNIDADES_POR_ITEM + " unidades por producto.",
    };
  }

  /* Se vuelve a consultar el stock del catálogo, porque la línea guardada
       tiene el precio congelado pero no el stock: ese sí puede haber bajado. */
  var producto = buscarProducto(item.codigo);
  var tamano =
    producto &&
    producto.tamanos.find(function (t) {
      return t.nombre === item.tamano;
    });

  if (tamano && nueva > tamano.stock) {
    return {
      ok: false,
      mensaje: "Solo quedan " + tamano.stock + " unidades disponibles.",
    };
  }

  item.cantidad = nueva;
  guardarCarrito(carrito);

  return { ok: true, mensaje: "Cantidad actualizada." };
}

/**
 * Quita una línea completa del carrito.
 * @param {string} clave Clave de la línea.
 * @returns {{ok: boolean, mensaje: string}} Resultado de la operación.
 */
function eliminarDelCarrito(clave) {
  var carrito = obtenerCarrito();
  var quedan = carrito.filter(function (item) {
    return item.clave !== clave;
  });

  if (quedan.length === carrito.length) {
    return { ok: false, mensaje: "Ese producto ya no está en el carrito." };
  }

  guardarCarrito(quedan);
  return { ok: true, mensaje: "Producto eliminado del carrito." };
}

/**
 * Deja el carrito vacío.
 * @returns {{ok: boolean, mensaje: string}} Resultado de la operación.
 */
function vaciarCarrito() {
  guardarCarrito([]);
  return { ok: true, mensaje: "El carrito quedó vacío." };
}

/* ---------------------------------------------------------------------
   4. TOTALES
   --------------------------------------------------------------------- */

/**
 * Calcula el resumen del carrito.
 * El descuento por edad o por código promocional NO se aplica aquí: eso lo
 * resuelve la base de datos al confirmar el pedido, con el usuario ya
 * identificado. El carrito muestra precios de lista.
 * @returns {{lineas: number, unidades: number, subtotal: number}} Resumen.
 */
function calcularTotalesCarrito() {
  var carrito = obtenerCarrito();

  return {
    lineas: carrito.length,
    unidades: carrito.reduce(function (suma, item) {
      return suma + item.cantidad;
    }, 0),
    subtotal: carrito.reduce(function (suma, item) {
      return suma + item.precio * item.cantidad;
    }, 0),
  };
}

/* ---------------------------------------------------------------------
   5. MINI CARRITO

   Panel lateral que acompaña al catálogo y al detalle del producto. La
   página del carrito completo (carrito.html) es otra pantalla y tendrá su
   propio dibujo, más detallado.

   Como en comunes.js, la función se va sin hacer nada si la página no tiene
   el contenedor: así el mismo archivo sirve para las tres pantallas.
   --------------------------------------------------------------------- */

/**
 * Dibuja el mini carrito y engancha sus botones.
 */
function renderMiniCarrito() {
  var contenedor = document.getElementById("mini-carrito-cuerpo");

  if (!contenedor) {
    return;
  }

  var carrito = obtenerCarrito();
  var totales = calcularTotalesCarrito();
  var pie = document.getElementById("mini-carrito-pie");

  contenedor.innerHTML = "";

  if (carrito.length === 0) {
    var vacio = document.createElement("p");
    vacio.className = "estado-vacio";
    vacio.textContent =
      "Tu carrito está vacío. Agrega productos desde el catálogo.";
    contenedor.appendChild(vacio);

    if (pie) {
      pie.hidden = true;
    }
    return;
  }

  var lista = document.createElement("ul");
  lista.className = "mini-carrito__lista";

  carrito.forEach(function (item) {
    lista.appendChild(crearLineaMiniCarrito(item));
  });

  contenedor.appendChild(lista);

  if (pie) {
    pie.hidden = false;
    document.getElementById("mini-carrito-unidades").textContent =
      totales.unidades === 1 ? "1 producto" : totales.unidades + " productos";
    document.getElementById("mini-carrito-subtotal").textContent =
      formatearPrecio(totales.subtotal);
  }
}

/**
 * Arma una línea del mini carrito con sus controles de cantidad.
 * @param {Object} item Línea del carrito.
 * @returns {HTMLElement} Elemento <li>.
 */
function crearLineaMiniCarrito(item) {
  var li = document.createElement("li");
  li.className = "mini-carrito__item";

  var info = document.createElement("div");

  var nombre = document.createElement("p");
  nombre.className = "mini-carrito__nombre";
  nombre.textContent = item.nombre;
  info.appendChild(nombre);

  var detalle = document.createElement("p");
  detalle.className = "mini-carrito__detalle";
  detalle.textContent =
    item.tamano + " · " + formatearPrecio(item.precio) + " c/u";
  info.appendChild(detalle);

  if (item.mensaje) {
    var mensaje = document.createElement("p");
    mensaje.className = "mini-carrito__detalle";
    mensaje.textContent = "“" + item.mensaje + "”";
    info.appendChild(mensaje);
  }

  li.appendChild(info);

  var controles = document.createElement("div");
  controles.className = "contador-cantidad";

  controles.appendChild(
    crearBotonCantidad(
      "−",
      "Quitar una unidad de " + item.nombre,
      item.clave,
      -1,
    ),
  );

  var cantidad = document.createElement("span");
  cantidad.className = "contador-cantidad__valor";
  cantidad.textContent = item.cantidad;
  controles.appendChild(cantidad);

  controles.appendChild(
    crearBotonCantidad(
      "+",
      "Agregar una unidad de " + item.nombre,
      item.clave,
      1,
    ),
  );

  li.appendChild(controles);

  return li;
}

/**
 * Crea uno de los botones + / − de una línea del mini carrito.
 * @param {string} simbolo Texto visible del botón.
 * @param {string} etiqueta Descripción para lectores de pantalla.
 * @param {string} clave Clave de la línea sobre la que actúa.
 * @param {number} delta Cuánto suma o resta.
 * @returns {HTMLButtonElement} Botón listo para insertar.
 */
function crearBotonCantidad(simbolo, etiqueta, clave, delta) {
  var boton = document.createElement("button");
  boton.type = "button";
  boton.className = "contador-cantidad__boton";
  boton.textContent = simbolo;
  boton.setAttribute("aria-label", etiqueta);

  boton.addEventListener("click", function () {
    var resultado = cambiarCantidadCarrito(clave, delta);

    if (!resultado.ok) {
      mostrarAviso(resultado.mensaje, "error");
    }

    renderMiniCarrito();
  });

  return boton;
}

/**
 * Conecta el botón de vaciar del mini carrito, si la página lo tiene.
 */
function activarMiniCarrito() {
  var botonVaciar = document.getElementById("mini-carrito-vaciar");

  if (botonVaciar) {
    botonVaciar.addEventListener("click", function () {
      var resultado = vaciarCarrito();
      mostrarAviso(resultado.mensaje, "exito");
      renderMiniCarrito();
    });
  }

  renderMiniCarrito();
}

document.addEventListener("DOMContentLoaded", activarMiniCarrito);

/* ---------------------------------------------------------------------
   6. PÁGINA COMPLETA DEL CARRITO (carrito.html)

   El mini carrito de la sección anterior es un resumen que acompaña al
   catálogo y a la ficha. Esta es la pantalla dedicada que pide el caso:
   el detalle línea por línea, con precio unitario, cantidad, subtotal de
   cada una y el total.

   Se apoya en las mismas operaciones de las secciones 3 y 4, así que
   agregar, modificar y eliminar se comportan exactamente igual aquí que
   en el resto del sitio. Como el resto del archivo, cada función se va
   sin hacer nada si la página no tiene sus elementos.
   --------------------------------------------------------------------- */

/**
 * Dibuja la página del carrito: o el estado vacío, o la lista con su
 * resumen. Se llama al cargar y después de cada cambio.
 */
function renderPaginaCarrito() {
  var lista = document.getElementById("carrito-lineas");

  if (!lista) {
    return;
  }

  var carrito = obtenerCarrito();
  var vacio = document.getElementById("carrito-vacio");
  var contenido = document.getElementById("carrito-contenido");

  vacio.hidden = carrito.length > 0;
  contenido.hidden = carrito.length === 0;

  if (carrito.length === 0) {
    lista.innerHTML = "";
    return;
  }

  lista.innerHTML = "";

  var fragmento = document.createDocumentFragment();

  carrito.forEach(function (item) {
    fragmento.appendChild(crearLineaCarrito(item));
  });

  lista.appendChild(fragmento);
  actualizarResumenCarrito();
}

/**
 * Arma una línea del carrito con su imagen, sus datos, el control de
 * cantidad, el subtotal y el botón de eliminar.
 *
 * Los datos vienen de lo guardado en el carrito y no del catálogo: el
 * precio quedó congelado al agregar el producto, y así se muestra. Del
 * catálogo se rescata solo el dato de porciones, que es informativo, y
 * únicamente si el producto sigue existiendo.
 *
 * @param {Object} item Línea del carrito.
 * @returns {HTMLElement} Elemento <li>.
 */
function crearLineaCarrito(item) {
  var li = document.createElement("li");
  li.className = "linea-carrito";

  /* ----- Imagen, enlazada a la ficha del producto ----- */
  var enlaceImagen = document.createElement("a");
  enlaceImagen.href = "producto.html?codigo=" + encodeURIComponent(item.codigo);
  enlaceImagen.tabIndex = -1;
  enlaceImagen.setAttribute("aria-hidden", "true");

  var imagen = document.createElement("img");
  imagen.className = "linea-carrito__imagen";
  imagen.src = item.imagen;
  imagen.alt = item.nombre;
  imagen.loading = "lazy";
  imagen.width = 160;
  imagen.height = 120;
  protegerImagen(imagen);
  enlaceImagen.appendChild(imagen);
  li.appendChild(enlaceImagen);

  /* ----- Nombre, tamaño y mensaje ----- */
  var datos = document.createElement("div");
  datos.className = "linea-carrito__datos";

  var nombre = document.createElement("h3");
  nombre.className = "linea-carrito__nombre";

  var enlaceNombre = document.createElement("a");
  enlaceNombre.href = "producto.html?codigo=" + encodeURIComponent(item.codigo);
  enlaceNombre.textContent = item.nombre;
  nombre.appendChild(enlaceNombre);
  datos.appendChild(nombre);

  var tamano = document.createElement("p");
  tamano.className = "linea-carrito__detalle";
  tamano.textContent = "Tamaño " + item.tamano + porcionesDeItem(item);
  datos.appendChild(tamano);

  if (item.mensaje) {
    var mensaje = document.createElement("p");
    mensaje.className = "linea-carrito__mensaje";
    mensaje.textContent = "Mensaje: “" + item.mensaje + "”";
    datos.appendChild(mensaje);
  }

  var unitario = document.createElement("p");
  unitario.className = "linea-carrito__detalle";
  unitario.textContent = formatearPrecio(item.precio) + " por unidad";
  datos.appendChild(unitario);

  li.appendChild(datos);

  /* ----- Control de cantidad ----- */
  var cantidad = document.createElement("div");
  cantidad.className = "contador-cantidad linea-carrito__cantidad";
  cantidad.setAttribute("role", "group");
  cantidad.setAttribute("aria-label", "Cantidad de " + item.nombre);

  cantidad.appendChild(
    crearBotonLinea("−", "Quitar una unidad de " + item.nombre, item.clave, -1),
  );

  var valor = document.createElement("span");
  valor.className = "contador-cantidad__valor";
  valor.textContent = item.cantidad;
  cantidad.appendChild(valor);

  cantidad.appendChild(
    crearBotonLinea("+", "Agregar una unidad de " + item.nombre, item.clave, 1),
  );

  li.appendChild(cantidad);

  /* ----- Subtotal de la línea ----- */
  var subtotal = document.createElement("p");
  subtotal.className = "linea-carrito__subtotal";
  subtotal.textContent = formatearPrecio(item.precio * item.cantidad);
  li.appendChild(subtotal);

  /* ----- Eliminar ----- */
  var quitar = document.createElement("button");
  quitar.type = "button";
  quitar.className = "linea-carrito__quitar";
  quitar.textContent = "Eliminar";
  quitar.setAttribute("aria-label", "Eliminar " + item.nombre + " del carrito");

  quitar.addEventListener("click", function () {
    var resultado = eliminarDelCarrito(item.clave);
    mostrarAviso(resultado.mensaje, resultado.ok ? "exito" : "error");
    renderPaginaCarrito();
  });

  li.appendChild(quitar);

  return li;
}

/**
 * Texto con las porciones del tamaño, cuando el producto sigue en el
 * catálogo. Devuelve una cadena vacía si ya no está, para que una línea
 * antigua no rompa la página.
 * @param {Object} item Línea del carrito.
 * @returns {string} Texto para agregar al tamaño, o cadena vacía.
 */
function porcionesDeItem(item) {
  var producto = buscarProducto(item.codigo);

  if (!producto) {
    return "";
  }

  var tamano = producto.tamanos.find(function (t) {
    return t.nombre === item.tamano;
  });

  if (!tamano) {
    return "";
  }

  return tamano.porciones === 1
    ? " · 1 porción"
    : " · " + tamano.porciones + " porciones";
}

/**
 * Crea uno de los botones + / − de una línea de la página del carrito.
 * @param {string} simbolo Texto visible del botón.
 * @param {string} etiqueta Descripción para lectores de pantalla.
 * @param {string} clave Clave de la línea sobre la que actúa.
 * @param {number} delta Cuánto suma o resta.
 * @returns {HTMLButtonElement} Botón listo para insertar.
 */
function crearBotonLinea(simbolo, etiqueta, clave, delta) {
  var boton = document.createElement("button");
  boton.type = "button";
  boton.className = "contador-cantidad__boton";
  boton.textContent = simbolo;
  boton.setAttribute("aria-label", etiqueta);

  boton.addEventListener("click", function () {
    var resultado = cambiarCantidadCarrito(clave, delta);

    if (!resultado.ok) {
      mostrarAviso(resultado.mensaje, "error");
    }

    renderPaginaCarrito();
  });

  return boton;
}

/**
 * Escribe el resumen: cuántas unidades hay y cuánto suman.
 *
 * El carrito muestra precios de lista. El descuento por edad o por código
 * promocional no se calcula aquí porque depende del usuario que confirme
 * la compra, y eso lo resuelve la base de datos al generar el pedido.
 */
function actualizarResumenCarrito() {
  var totales = calcularTotalesCarrito();
  var unidades = document.getElementById("resumen-unidades");
  var subtotal = document.getElementById("resumen-subtotal");
  var total = document.getElementById("resumen-total");

  if (!unidades) {
    return;
  }

  unidades.textContent =
    totales.unidades === 1 ? "1 producto" : totales.unidades + " productos";
  subtotal.textContent = formatearPrecio(totales.subtotal);
  total.textContent = formatearPrecio(totales.subtotal);
}

/**
 * Conecta el botón de vaciar de la página y dibuja el carrito por
 * primera vez.
 */
function activarPaginaCarrito() {
  var vaciar = document.getElementById("carrito-vaciar");

  if (vaciar) {
    vaciar.addEventListener("click", function () {
      var resultado = vaciarCarrito();
      mostrarAviso(resultado.mensaje, "exito");
      renderPaginaCarrito();
    });
  }

  renderPaginaCarrito();
}

document.addEventListener("DOMContentLoaded", activarPaginaCarrito);
