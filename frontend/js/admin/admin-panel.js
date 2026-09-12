/* =====================================================================
   Única responsabilidad: las cifras de resumen y la tabla de lo que hay
   que reponer. El mantenedor de productos vive en admin-productos.js y
   el de usuarios en admin-usuarios.js.

   Depende de, en este orden de carga:
     js/datos/productos.js -> PRODUCTOS
     js/datos/usuarios.js  -> USUARIOS
     js/admin/admin-comunes.js -> puede()
   ===================================================================== */

/**
 * Recorre el catálogo y devuelve las variantes que llegaron a su umbral
 * de stock crítico. Es la misma pregunta que responde la vista
 * vw_stock_critico de la base de datos.
 * @returns {Array} Variantes por reponer, con su producto.
 */
function variantesCriticas() {
  var criticas = [];

  PRODUCTOS.forEach(function (producto) {
    producto.tamanos.forEach(function (tamano) {
      if (
        tamano.stockCritico !== undefined &&
        tamano.stock <= tamano.stockCritico
      ) {
        criticas.push({ producto: producto, tamano: tamano });
      }
    });
  });

  /* Primero lo más urgente: lo que está más abajo de su umbral */
  criticas.sort(function (a, b) {
    return (
      a.tamano.stock -
      a.tamano.stockCritico -
      (b.tamano.stock - b.tamano.stockCritico)
    );
  });

  return criticas;
}

/**
 * Escribe las cuatro cifras de resumen del panel.
 */
function mostrarCifras() {
  var cifraProductos = document.getElementById("cifra-productos");

  if (!cifraProductos) {
    return;
  }

  var variantes = PRODUCTOS.reduce(function (suma, producto) {
    return suma + producto.tamanos.length;
  }, 0);

  cifraProductos.textContent = PRODUCTOS.length;
  document.getElementById("cifra-variantes").textContent = variantes;
  document.getElementById("cifra-criticos").textContent =
    variantesCriticas().length;

  /* La cifra de usuarios solo tiene sentido para quien puede verlos. Su
     tarjeta lleva data-permiso, así que admin-comunes.js ya la esconde;
     esto evita además calcularla de más. */
  var cifraUsuarios = document.getElementById("cifra-usuarios");

  if (cifraUsuarios && puede("USUARIO_VER")) {
    cifraUsuarios.textContent = USUARIOS.length;
  }
}

/**
 * Dibuja la tabla de variantes por reponer.
 */
function mostrarTablaCriticos() {
  var cuerpo = document.getElementById("tabla-criticos");

  if (!cuerpo) {
    return;
  }

  var criticas = variantesCriticas();

  cuerpo.innerHTML = "";

  if (criticas.length === 0) {
    var fila = document.createElement("tr");
    var celda = document.createElement("td");
    celda.colSpan = 5;
    celda.className = "tabla__vacia";
    celda.textContent =
      "Ninguna variante llegó a su stock crítico. Todo en orden.";
    fila.appendChild(celda);
    cuerpo.appendChild(fila);
    return;
  }

  var fragmento = document.createDocumentFragment();

  criticas.forEach(function (item) {
    var fila = document.createElement("tr");

    fila.appendChild(celdaPanel(item.producto.codigo));
    fila.appendChild(celdaPanel(item.producto.nombre));
    fila.appendChild(celdaPanel(item.tamano.nombre));

    var celdaStock = document.createElement("td");
    celdaStock.className = "tabla__numero";
    var insignia = document.createElement("span");
    insignia.className = "estado estado--critico";
    insignia.textContent = item.tamano.stock;
    celdaStock.appendChild(insignia);
    fila.appendChild(celdaStock);

    var celdaUmbral = celdaPanel(item.tamano.stockCritico);
    celdaUmbral.className = "tabla__numero";
    fila.appendChild(celdaUmbral);

    fragmento.appendChild(fila);
  });

  cuerpo.appendChild(fragmento);
}

/**
 * Atajo para crear una celda de texto.
 * @param {*} texto Contenido de la celda.
 * @returns {HTMLElement} Elemento <td>.
 */
function celdaPanel(texto) {
  var celda = document.createElement("td");
  celda.textContent = texto;
  return celda;
}

document.addEventListener("DOMContentLoaded", function () {
  if (!exigirPermiso("PANEL_ACCEDER")) {
    return;
  }

  mostrarCifras();
  mostrarTablaCriticos();
});
