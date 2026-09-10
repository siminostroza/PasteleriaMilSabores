/* =====================================================================

   La página se abre como producto.html?codigo=TC001. Si el código no
   viene o no existe, se muestra un aviso con salida al catálogo en vez
   de una ficha vacía.

   Depende de, en este orden de carga:
     js/datos/productos.js -> PRODUCTOS, buscarProducto(), tamanoBase()
     js/formato.js         -> formatearPrecio()
     js/comunes.js         -> protegerImagen(), mostrarAviso()
     js/carrito.js         -> agregarAlCarrito(), renderMiniCarrito(),
                              MAX_UNIDADES_POR_ITEM
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. ESTADO DE LA FICHA
   Tres datos que cambian mientras el usuario arma su pedido. Se guardan
   aquí y no en el DOM, para no tener que leer el HTML para saber qué
   eligió: el HTML muestra el estado, no lo almacena.
   --------------------------------------------------------------------- */
var productoActual = null;
var tamanoElegido = null;
var cantidadElegida = 1;

/* ---------------------------------------------------------------------
   2. LECTURA DEL PRODUCTO PEDIDO
   --------------------------------------------------------------------- */

/**
 * Devuelve el producto que pide la dirección, o null si no corresponde.
 * @returns {Object|null} Producto del catálogo.
 */
function productoDeLaUrl() {
  var parametros = new URLSearchParams(window.location.search);
  var codigo = parametros.get("codigo");

  if (!codigo) {
    return null;
  }

  return buscarProducto(codigo) || null;
}

/**
 * Muestra el bloque de "producto no encontrado" y esconde la ficha.
 */
function mostrarNoEncontrado() {
  var ficha = document.getElementById("detalle-articulo");
  var error = document.getElementById("detalle-no-encontrado");

  if (ficha) {
    ficha.hidden = true;
  }

  if (error) {
    error.hidden = false;
  }
}

/* ---------------------------------------------------------------------
   3. DIBUJO DE LA FICHA
   --------------------------------------------------------------------- */

/**
 * Vuelca los datos del producto en el esqueleto que ya trae el HTML.
 *
 * Se usa textContent en todos los campos: el contenido viene hoy de un
 * arreglo nuestro, pero mañana llegará de la base de datos y no debe
 * poder inyectar etiquetas en la página.
 *
 * @param {Object} producto Producto del catálogo.
 */
function dibujarFicha(producto) {
  document.title = producto.nombre + " — Pastelería 1000 Sabores";

  var imagen = document.getElementById("detalle-imagen");
  imagen.src = producto.imagen;
  imagen.alt = producto.nombre;
  protegerImagen(imagen);

  document.getElementById("detalle-categoria").textContent = producto.categoria;
  document.getElementById("detalle-nombre").textContent = producto.nombre;
  document.getElementById("detalle-codigo").textContent =
    "Código " + producto.codigo;
  document.getElementById("detalle-descripcion").textContent =
    producto.descripcion;
  document.getElementById("migas-actual").textContent = producto.nombre;

  dibujarDatos(producto);
  dibujarOpcionesTamano(producto);
  prepararMensaje(producto);
}

/**
 * Lista las características del producto que no son ni precio ni tamaño.
 * @param {Object} producto Producto del catálogo.
 */
function dibujarDatos(producto) {
  var lista = document.getElementById("detalle-datos");
  lista.innerHTML = "";

  var datos = [];

  if (producto.tipoTorta) {
    datos.push(["Forma", producto.tipoTorta]);
  }

  datos.push(["Categoría", producto.categoria]);
  datos.push([
    "Personalizable",
    producto.permiteMensaje ? "Sí, admite mensaje escrito" : "No",
  ]);
  datos.push(["Tamaños disponibles", String(producto.tamanos.length)]);

  datos.forEach(function (par) {
    var item = document.createElement("li");
    item.className = "detalle__dato";

    var titulo = document.createElement("span");
    titulo.className = "detalle__dato-titulo";
    titulo.textContent = par[0];

    var valor = document.createElement("span");
    valor.textContent = par[1];

    item.appendChild(titulo);
    item.appendChild(valor);
    lista.appendChild(item);
  });
}

/* ---------------------------------------------------------------------
   4. SELECTOR DE TAMAÑO
   --------------------------------------------------------------------- */

/**
 * Arma las opciones de tamaño como botones de radio.
 *
 * Se usan radios de verdad y no una lista de divs con clic: así el
 * selector funciona con teclado y los lectores de pantalla lo anuncian
 * como lo que es, un grupo de opciones excluyentes.
 *
 * Cuando el producto tiene un solo tamaño, el grupo se esconde: obligar
 * a elegir entre una alternativa no aporta nada.
 *
 * @param {Object} producto Producto del catálogo.
 */
function dibujarOpcionesTamano(producto) {
  var grupo = document.getElementById("grupo-tamanos");
  var contenedor = document.getElementById("opciones-tamano");

  contenedor.innerHTML = "";
  grupo.hidden = producto.tamanos.length <= 1;

  producto.tamanos.forEach(function (tamano, indice) {
    var etiqueta = document.createElement("label");
    etiqueta.className = "opcion-tamano";

    var radio = document.createElement("input");
    radio.type = "radio";
    radio.name = "tamano";
    radio.value = tamano.nombre;
    radio.className = "opcion-tamano__radio";
    radio.checked =
      tamano.esBase === true || (indice === 0 && producto.tamanos.length === 1);
    radio.disabled = tamano.stock === 0;

    radio.addEventListener("change", function () {
      elegirTamano(tamano);
    });

    var texto = document.createElement("span");
    texto.className = "opcion-tamano__texto";

    var nombre = document.createElement("span");
    nombre.className = "opcion-tamano__nombre";
    nombre.textContent = tamano.nombre;
    texto.appendChild(nombre);

    var detalle = document.createElement("span");
    detalle.className = "opcion-tamano__detalle";
    detalle.textContent =
      tamano.porciones === 1 ? "1 porción" : tamano.porciones + " porciones";
    texto.appendChild(detalle);

    var precio = document.createElement("span");
    precio.className = "opcion-tamano__precio";
    precio.textContent =
      tamano.stock === 0 ? "Sin stock" : formatearPrecio(tamano.precio);
    texto.appendChild(precio);

    etiqueta.appendChild(radio);
    etiqueta.appendChild(texto);
    contenedor.appendChild(etiqueta);

    if (radio.checked) {
      elegirTamano(tamano);
    }
  });

  /* Si el tamaño de referencia está agotado, se elige el primero que sí
     tenga existencias, para que la ficha no abra en un estado inservible. */
  if (!tamanoElegido || tamanoElegido.stock === 0) {
    var conStock = producto.tamanos.find(function (t) {
      return t.stock > 0;
    });

    if (conStock) {
      var radios = contenedor.querySelectorAll(".opcion-tamano__radio");
      producto.tamanos.forEach(function (t, i) {
        if (t === conStock) {
          radios[i].checked = true;
        }
      });
      elegirTamano(conStock);
    }
  }
}

/**
 * Fija el tamaño elegido y refresca precio, stock y cantidad.
 * @param {Object} tamano Tamaño del producto.
 */
function elegirTamano(tamano) {
  tamanoElegido = tamano;
  cantidadElegida = Math.min(cantidadElegida, maximoPermitido());

  if (cantidadElegida < 1) {
    cantidadElegida = 1;
  }

  actualizarPrecio();
  actualizarStock();
  actualizarCantidad();
}

/**
 * Escribe el precio de la combinación elegida.
 */
function actualizarPrecio() {
  var destino = document.getElementById("detalle-precio");

  if (!tamanoElegido) {
    destino.textContent = "";
    return;
  }

  destino.textContent = formatearPrecio(tamanoElegido.precio * cantidadElegida);

  var unitario = document.getElementById("detalle-precio-unitario");
  unitario.textContent =
    cantidadElegida > 1
      ? formatearPrecio(tamanoElegido.precio) + " por unidad"
      : "";
}

/**
 * Informa las existencias del tamaño elegido y bloquea el botón si no hay.
 */
function actualizarStock() {
  var aviso = document.getElementById("detalle-stock");
  var boton = document.getElementById("boton-agregar");

  if (!tamanoElegido || tamanoElegido.stock === 0) {
    aviso.textContent = "Sin stock por ahora";
    aviso.className = "detalle__stock detalle__stock--agotado";
    boton.disabled = true;
    boton.textContent = "Sin stock";
    return;
  }

  boton.disabled = false;
  boton.textContent = "Añadir al carrito";

  if (
    tamanoElegido.stockCritico &&
    tamanoElegido.stock <= tamanoElegido.stockCritico
  ) {
    aviso.textContent = "Últimas " + tamanoElegido.stock + " unidades";
    aviso.className = "detalle__stock detalle__stock--bajo";
    return;
  }

  aviso.textContent = "Disponible: " + tamanoElegido.stock + " unidades";
  aviso.className = "detalle__stock";
}

/* ---------------------------------------------------------------------
   5. CANTIDAD
   --------------------------------------------------------------------- */

/**
 * Cuántas unidades se pueden pedir del tamaño elegido.
 * Es el menor entre el tope por línea del carrito y el stock real, para
 * que la ficha no ofrezca algo que el carrito después va a rechazar.
 * @returns {number} Máximo permitido.
 */
function maximoPermitido() {
  if (!tamanoElegido) {
    return 1;
  }

  return Math.min(MAX_UNIDADES_POR_ITEM, tamanoElegido.stock);
}

/**
 * Refresca el número visible y habilita o bloquea los botones + y −.
 */
function actualizarCantidad() {
  var valor = document.getElementById("cantidad-valor");
  var menos = document.getElementById("cantidad-menos");
  var mas = document.getElementById("cantidad-mas");
  var tope = maximoPermitido();

  valor.textContent = cantidadElegida;
  menos.disabled = cantidadElegida <= 1;
  mas.disabled = cantidadElegida >= tope;

  actualizarPrecio();
}

/**
 * Conecta los botones + y − de la cantidad.
 */
function activarCantidad() {
  var menos = document.getElementById("cantidad-menos");
  var mas = document.getElementById("cantidad-mas");

  menos.addEventListener("click", function () {
    if (cantidadElegida > 1) {
      cantidadElegida -= 1;
      actualizarCantidad();
    }
  });

  mas.addEventListener("click", function () {
    var tope = maximoPermitido();

    if (cantidadElegida < tope) {
      cantidadElegida += 1;
      actualizarCantidad();
      return;
    }

    if (tope === MAX_UNIDADES_POR_ITEM) {
      mostrarAviso(
        "Máximo " +
          MAX_UNIDADES_POR_ITEM +
          " unidades por producto. " +
          "Para pedidos mayores, escríbenos desde Contacto.",
        "error",
      );
      return;
    }

    mostrarAviso("Solo quedan " + tope + " unidades de este tamaño.", "error");
  });
}

/* ---------------------------------------------------------------------
   6. MENSAJE PERSONALIZADO
   --------------------------------------------------------------------- */

/* El largo máximo es el mismo que acepta la base de datos en la columna
   mensaje_personalizado, para que nunca se escriba algo que después no
   se pueda guardar. */
var LARGO_MAXIMO_MENSAJE = 200;

/**
 * Muestra u oculta el campo de mensaje según lo admita el producto, y
 * enciende el contador de caracteres.
 * @param {Object} producto Producto del catálogo.
 */
function prepararMensaje(producto) {
  var campo = document.getElementById("campo-mensaje");
  var textarea = document.getElementById("mensaje-personalizado");
  var contador = document.getElementById("mensaje-contador");

  campo.hidden = !producto.permiteMensaje;

  if (!producto.permiteMensaje) {
    textarea.value = "";
    return;
  }

  textarea.maxLength = LARGO_MAXIMO_MENSAJE;

  var refrescar = function () {
    contador.textContent =
      textarea.value.length + " de " + LARGO_MAXIMO_MENSAJE + " caracteres";
  };

  textarea.addEventListener("input", refrescar);
  refrescar();
}

/* ---------------------------------------------------------------------
   7. AÑADIR AL CARRITO
   --------------------------------------------------------------------- */

/**
 * Conecta el formulario de compra con la lógica del carrito.
 */
function activarFormularioCompra() {
  var formulario = document.getElementById("formulario-compra");

  formulario.addEventListener("submit", function (evento) {
    /* El formulario no viaja a ningún servidor: el carrito vive en el
       navegador. Se corta el envío para que la página no se recargue. */
    evento.preventDefault();

    if (!productoActual || !tamanoElegido) {
      return;
    }

    var textarea = document.getElementById("mensaje-personalizado");
    var mensaje = productoActual.permiteMensaje ? textarea.value.trim() : "";

    var resultado = agregarAlCarrito(
      productoActual.codigo,
      tamanoElegido.nombre,
      cantidadElegida,
      mensaje,
    );

    mostrarAviso(resultado.mensaje, resultado.ok ? "exito" : "error");

    if (resultado.ok) {
      renderMiniCarrito();
      cantidadElegida = 1;
      actualizarCantidad();
    }
  });
}

/* ---------------------------------------------------------------------
   8. COMPARTIR EN REDES SOCIALES

   El caso pide que los usuarios puedan compartir tortas y promociones.
   El posteo lo hace la red social; aquí solo se arma el enlace con el
   texto y la dirección de esta ficha.
   --------------------------------------------------------------------- */

/**
 * Conecta los botones de compartir con la ficha que se está viendo.
 * @param {Object} producto Producto del catálogo.
 */
function activarCompartir(producto) {
  var direccion = window.location.href;
  var texto =
    "Mira este producto de Pastelería 1000 Sabores: " + producto.nombre;

  var destinos = {
    "compartir-facebook":
      "https://www.facebook.com/sharer/sharer.php?u=" +
      encodeURIComponent(direccion),
    "compartir-x":
      "https://twitter.com/intent/tweet?text=" +
      encodeURIComponent(texto) +
      "&url=" +
      encodeURIComponent(direccion),
    "compartir-whatsapp":
      "https://api.whatsapp.com/send?text=" +
      encodeURIComponent(texto + " " + direccion),
  };

  Object.keys(destinos).forEach(function (id) {
    var enlace = document.getElementById(id);

    if (enlace) {
      enlace.href = destinos[id];
    }
  });

  var copiar = document.getElementById("compartir-copiar");

  if (copiar) {
    copiar.addEventListener("click", function () {
      copiarEnlace(direccion);
    });
  }
}

/**
 * Copia la dirección al portapapeles.
 *
 * navigator.clipboard solo existe en páginas servidas por https o desde
 * localhost, así que abriendo el archivo con doble clic no está
 * disponible. Por eso hay un camino alternativo con un campo de texto
 * temporal, y si los dos fallan se muestra la dirección para copiarla a
 * mano en lugar de no hacer nada.
 *
 * @param {string} direccion Dirección a copiar.
 */
function copiarEnlace(direccion) {
  if (navigator.clipboard && window.isSecureContext) {
    navigator.clipboard.writeText(direccion).then(
      function () {
        mostrarAviso("Enlace copiado al portapapeles.", "exito");
      },
      function () {
        copiarConCampoTemporal(direccion);
      },
    );
    return;
  }

  copiarConCampoTemporal(direccion);
}

/**
 * Copia usando un campo de texto fuera de pantalla.
 * @param {string} direccion Dirección a copiar.
 */
function copiarConCampoTemporal(direccion) {
  var campo = document.createElement("textarea");
  campo.value = direccion;
  campo.setAttribute("readonly", "");
  campo.className = "solo-lectores";
  document.body.appendChild(campo);
  campo.select();

  var copiado = false;

  try {
    copiado = document.execCommand("copy");
  } catch (error) {
    copiado = false;
  }

  campo.remove();

  mostrarAviso(
    copiado
      ? "Enlace copiado al portapapeles."
      : "Copia el enlace desde la barra del navegador.",
    copiado ? "exito" : "neutro",
  );
}

/* ---------------------------------------------------------------------
   9. PRODUCTOS RELACIONADOS
   --------------------------------------------------------------------- */

/**
 * Muestra hasta tres productos de la misma categoría.
 * Reutiliza las clases de la tarjeta del catálogo, así que no necesita
 * estilos propios.
 * @param {Object} producto Producto que se está viendo.
 */
function mostrarRelacionados(producto) {
  var seccion = document.getElementById("seccion-relacionados");
  var contenedor = document.getElementById("relacionados");

  var parecidos = PRODUCTOS.filter(function (otro) {
    return (
      otro.categoria === producto.categoria && otro.codigo !== producto.codigo
    );
  }).slice(0, 3);

  if (parecidos.length === 0) {
    seccion.hidden = true;
    return;
  }

  seccion.hidden = false;
  contenedor.innerHTML = "";

  var fragmento = document.createDocumentFragment();

  parecidos.forEach(function (otro) {
    fragmento.appendChild(crearTarjetaRelacionado(otro));
  });

  contenedor.appendChild(fragmento);
}

/**
 * Tarjeta simple para la lista de relacionados: imagen, nombre y precio.
 * @param {Object} producto Producto a mostrar.
 * @returns {HTMLElement} Elemento <article>.
 */
function crearTarjetaRelacionado(producto) {
  var enlaceDestino =
    "producto.html?codigo=" + encodeURIComponent(producto.codigo);

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

  var nombre = document.createElement("h3");
  nombre.className = "tarjeta-producto__nombre";

  var enlace = document.createElement("a");
  enlace.href = enlaceDestino;
  enlace.textContent = producto.nombre;
  nombre.appendChild(enlace);
  cuerpo.appendChild(nombre);

  var precio = document.createElement("p");
  precio.className = "tarjeta-producto__precio";
  precio.textContent = formatearPrecio(precioBase(producto));
  cuerpo.appendChild(precio);

  articulo.appendChild(cuerpo);

  return articulo;
}

/* ---------------------------------------------------------------------
   10. ARRANQUE
   --------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", function () {
  productoActual = productoDeLaUrl();

  if (!productoActual) {
    mostrarNoEncontrado();
    return;
  }

  dibujarFicha(productoActual);
  activarCantidad();
  activarFormularioCompra();
  activarCompartir(productoActual);
  mostrarRelacionados(productoActual);
});
