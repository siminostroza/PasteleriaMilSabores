/* =====================================================================
   Contiene, en este orden:
     1. Listado (admin/productos.html)
     2. Formulario de alta y edición (admin/producto-form.html)
     3. Arranque

   Un mismo archivo atiende las dos pantallas del mantenedor. Cada
   función se va sin hacer nada si la página no tiene sus elementos, igual
   que en el resto del proyecto.

   Depende de, en este orden de carga:
     js/datos/productos.js  -> PRODUCTOS, CATEGORIAS, buscarProducto(), tamanoBase()
     js/formato.js          -> formatearPrecio()
     js/comunes.js          -> protegerImagen(), mostrarAviso()
     js/validaciones.js     -> configurarValidacion(), esquemaProducto()
     js/admin/admin-comunes.js -> rutaDesdeAdmin(), puede(), exigirPermiso()
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. LISTADO
   --------------------------------------------------------------------- */

var filtroProductos = { texto: "", categoria: "" };

/**
 * Dibuja las filas de la tabla de productos con los filtros aplicados.
 *
 * Cada fila muestra el tamaño de referencia. Un producto con tres tamaños
 * tiene tres precios y tres stocks distintos; el listado resume con el de
 * referencia y el detalle completo se ve al editar.
 */
function mostrarTablaProductos() {
  var cuerpo = document.getElementById("tabla-productos");

  if (!cuerpo) {
    return;
  }

  var visibles = PRODUCTOS.filter(function (producto) {
    if (
      filtroProductos.categoria &&
      producto.categoria !== filtroProductos.categoria
    ) {
      return false;
    }

    if (filtroProductos.texto) {
      var texto = (producto.codigo + " " + producto.nombre).toLowerCase();
      return texto.indexOf(filtroProductos.texto) !== -1;
    }

    return true;
  });

  cuerpo.innerHTML = "";

  var contador = document.getElementById("productos-contador");

  if (contador) {
    contador.textContent =
      "Mostrando " + visibles.length + " de " + PRODUCTOS.length + " productos";
  }

  if (visibles.length === 0) {
    var fila = document.createElement("tr");
    var celda = document.createElement("td");
    celda.colSpan = 8;
    celda.className = "tabla__vacia";
    celda.textContent = "Ningún producto coincide con la búsqueda.";
    fila.appendChild(celda);
    cuerpo.appendChild(fila);
    return;
  }

  var fragmento = document.createDocumentFragment();

  visibles.forEach(function (producto) {
    fragmento.appendChild(crearFilaProducto(producto));
  });

  cuerpo.appendChild(fragmento);
}

/**
 * Arma una fila de la tabla de productos.
 * @param {Object} producto Producto del catálogo.
 * @returns {HTMLElement} Elemento <tr>.
 */
function crearFilaProducto(producto) {
  var base = tamanoBase(producto);
  var fila = document.createElement("tr");

  /* Miniatura */
  var celdaImagen = document.createElement("td");
  var imagen = document.createElement("img");
  imagen.className = "tabla__miniatura";
  imagen.src = rutaDesdeAdmin(producto.imagen);
  imagen.alt = producto.nombre;
  imagen.loading = "lazy";
  protegerImagen(imagen);
  celdaImagen.appendChild(imagen);
  fila.appendChild(celdaImagen);

  fila.appendChild(celdaTexto(producto.codigo));
  fila.appendChild(celdaTexto(producto.nombre));
  fila.appendChild(celdaTexto(producto.categoria));
  fila.appendChild(celdaTexto(base.nombre));

  var celdaPrecio = celdaTexto(formatearPrecio(base.precio));
  celdaPrecio.className = "tabla__numero";
  fila.appendChild(celdaPrecio);

  /* Stock, con aviso cuando llegó a su umbral crítico */
  var celdaStock = document.createElement("td");
  celdaStock.className = "tabla__numero";

  if (base.stockCritico !== undefined && base.stock <= base.stockCritico) {
    var insignia = document.createElement("span");
    insignia.className = "estado estado--critico";
    insignia.textContent = base.stock + " · reponer";
    celdaStock.appendChild(insignia);
  } else {
    celdaStock.textContent = base.stock;
  }

  fila.appendChild(celdaStock);

  /* Acciones, solo las que el rol permite */
  var celdaAcciones = document.createElement("td");
  var acciones = document.createElement("div");
  acciones.className = "tabla__acciones";

  if (puede("PRODUCTO_EDITAR")) {
    var editar = document.createElement("a");
    editar.className = "boton boton--borde boton--chico";
    editar.href =
      "producto-form.html?codigo=" + encodeURIComponent(producto.codigo);
    editar.textContent = "Editar";
    editar.setAttribute("aria-label", "Editar " + producto.nombre);
    acciones.appendChild(editar);
  }

  if (puede("PRODUCTO_ELIMINAR")) {
    var eliminar = document.createElement("button");
    eliminar.type = "button";
    eliminar.className = "boton boton--borde boton--chico";
    eliminar.textContent = "Dar de baja";
    eliminar.setAttribute("aria-label", "Dar de baja " + producto.nombre);

    eliminar.addEventListener("click", function () {
      /* Baja lógica, igual que en la base de datos: el producto deja de
         aparecer en la tienda pero la fila no se borra, porque hay
         pedidos históricos que la referencian. */
      if (
        !window.confirm("¿Dar de baja " + producto.nombre + " del catálogo?")
      ) {
        return;
      }

      producto.activo = false;
      mostrarAviso(
        producto.nombre +
          " quedó fuera del catálogo. " +
          "Al no haber backend, el cambio se pierde al recargar.",
        "exito",
      );
      mostrarTablaProductos();
    });

    acciones.appendChild(eliminar);
  }

  if (acciones.childNodes.length === 0) {
    acciones.textContent = "Solo lectura";
  }

  celdaAcciones.appendChild(acciones);
  fila.appendChild(celdaAcciones);

  if (producto.activo === false) {
    fila.classList.add("tabla__fila--inactiva");
  }

  return fila;
}

/**
 * Atajo para crear una celda de texto.
 * @param {string} texto Contenido de la celda.
 * @returns {HTMLElement} Elemento <td>.
 */
function celdaTexto(texto) {
  var celda = document.createElement("td");
  celda.textContent = texto;
  return celda;
}

/**
 * Conecta la búsqueda y el filtro por categoría del listado.
 */
function activarFiltrosProductos() {
  var busqueda = document.getElementById("buscar-producto");
  var categoria = document.getElementById("filtrar-categoria");

  if (categoria) {
    CATEGORIAS.forEach(function (nombre) {
      var opcion = document.createElement("option");
      opcion.value = nombre;
      opcion.textContent = nombre;
      categoria.appendChild(opcion);
    });

    categoria.addEventListener("change", function () {
      filtroProductos.categoria = categoria.value;
      mostrarTablaProductos();
    });
  }

  if (busqueda) {
    busqueda.addEventListener("input", function () {
      filtroProductos.texto = busqueda.value.trim().toLowerCase();
      mostrarTablaProductos();
    });
  }
}

/* ---------------------------------------------------------------------
   2. FORMULARIO DE ALTA Y EDICIÓN
   --------------------------------------------------------------------- */

/**
 * Prepara el formulario de producto.
 *
 * Una sola pantalla sirve para crear y para editar: si la dirección trae
 * un código, se cargan los datos de ese producto y se exige el permiso de
 * editar; si no lo trae, es un alta y se exige el de crear.
 */
function prepararFormularioProducto() {
  var formulario = document.getElementById("formulario-producto");

  if (!formulario) {
    return;
  }

  var parametros = new URLSearchParams(window.location.search);
  var codigo = parametros.get("codigo");
  var producto = codigo ? buscarProducto(codigo) : null;
  var esEdicion = Boolean(producto);

  if (!exigirPermiso(esEdicion ? "PRODUCTO_EDITAR" : "PRODUCTO_CREAR")) {
    return;
  }

  if (codigo && !producto) {
    mostrarAviso(
      "No existe un producto con el código " + codigo + ".",
      "error",
    );
  }

  poblarCategoriasFormulario();
  ajustarTitulosProducto(esEdicion, producto);

  if (esEdicion) {
    volcarProductoEnFormulario(producto);
  }

  activarContadorDescripcion();

  configurarValidacion(formulario, esquemaProducto(), function (datos) {
    /* Sin backend no hay dónde guardar. Se avisa con los datos ya
       validados, que es exactamente lo que recibiría la API. */
    console.log("Producto validado, listo para enviar:", datos);
    mostrarAviso(
      esEdicion
        ? "Los cambios de " + datos.nombre + " pasaron todas las validaciones."
        : datos.nombre +
            " pasó todas las validaciones y está listo para guardarse.",
      "exito",
    );
  });
}

/**
 * Llena el desplegable de categorías del formulario.
 */
function poblarCategoriasFormulario() {
  var select = document.getElementById("categoria");

  if (!select) {
    return;
  }

  CATEGORIAS.forEach(function (nombre) {
    var opcion = document.createElement("option");
    opcion.value = nombre;
    opcion.textContent = nombre;
    select.appendChild(opcion);
  });
}

/**
 * Cambia los títulos según si se está creando o editando.
 * @param {boolean} esEdicion true si se edita un producto existente.
 * @param {Object} producto Producto en edición, si corresponde.
 */
function ajustarTitulosProducto(esEdicion, producto) {
  var titulo = document.getElementById("admin-titulo");
  var bajada = document.getElementById("admin-bajada");
  var boton = document.getElementById("boton-guardar");

  if (titulo) {
    titulo.textContent = esEdicion ? "Editar producto" : "Nuevo producto";
  }

  if (bajada) {
    bajada.textContent = esEdicion
      ? "Estás editando " + producto.nombre + " (" + producto.codigo + ")."
      : "Completa los datos del producto. Los campos con asterisco son obligatorios.";
  }

  if (boton) {
    boton.textContent = esEdicion ? "Guardar cambios" : "Crear producto";
  }

  document.title =
    (esEdicion ? "Editar producto" : "Nuevo producto") +
    " — Administración Pastelería 1000 Sabores";
}

/**
 * Escribe los datos de un producto en los campos del formulario.
 * @param {Object} producto Producto a editar.
 */
function volcarProductoEnFormulario(producto) {
  var base = tamanoBase(producto);

  asignarValor("codigo", producto.codigo);
  asignarValor("nombre", producto.nombre);
  asignarValor("descripcion", producto.descripcion);
  asignarValor("categoria", producto.categoria);
  asignarValor("precio", base.precio);
  asignarValor("stock", base.stock);
  asignarValor("stockCritico", base.stockCritico);

  var tamano = document.getElementById("tamano");

  if (tamano) {
    tamano.value = base.nombre;
  }
}

/**
 * Asigna un valor a un campo si existe.
 * @param {string} id id del campo.
 * @param {*} valor Valor a escribir.
 */
function asignarValor(id, valor) {
  var campo = document.getElementById(id);

  if (campo && valor !== undefined && valor !== null) {
    campo.value = valor;
  }
}

/**
 * Cuenta los caracteres de la descripción mientras se escribe.
 * El enunciado la limita a 500 y avisar antes de llegar al tope es más
 * útil que rechazar el texto cuando ya está escrito.
 */
function activarContadorDescripcion() {
  var textarea = document.getElementById("descripcion");
  var contador = document.getElementById("descripcion-contador");

  if (!textarea || !contador) {
    return;
  }

  var refrescar = function () {
    contador.textContent = textarea.value.length + " de 500 caracteres";
  };

  textarea.addEventListener("input", refrescar);
  refrescar();
}

/* ---------------------------------------------------------------------
   3. ARRANQUE
   --------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("tabla-productos")) {
    if (!exigirPermiso("PRODUCTO_VER")) {
      return;
    }

    activarFiltrosProductos();
    mostrarTablaProductos();
  }

  prepararFormularioProducto();
});
