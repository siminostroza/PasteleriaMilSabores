/*
   Funciones que convierten un dato en el texto que ve el usuario. No
   validan, no calculan reglas de negocio y no tocan el DOM: solo dan
   formato. Al estar en un archivo aparte, el precio se muestra igual en
   la portada, en el catálogo, en el carrito y en el administrador.

/**
 * Formatea un monto en pesos chilenos: 45000 -> "$45.000".
 * Los CLP no llevan decimales.
 * @param {number} valor Monto en pesos.
 * @returns {string} Monto listo para mostrar.
 */
function formatearPrecio(valor) {
  var numero = Number(valor);

  if (isNaN(numero)) {
    return "$0";
  }

  return "$" + numero.toLocaleString("es-CL", { maximumFractionDigits: 0 });
}

/**
 * Formatea una fecha como "9 de septiembre de 2026".
 * @param {Date|string} fecha Fecha o texto que Date pueda interpretar.
 * @returns {string} Fecha lista para mostrar, o '' si no es válida.
 */
function formatearFecha(fecha) {
  var valor = fecha instanceof Date ? fecha : new Date(fecha);

  if (isNaN(valor.getTime())) {
    return "";
  }

  return valor.toLocaleDateString("es-CL", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Recorta un texto largo y le agrega puntos suspensivos.
 * Útil en las tarjetas, donde las descripciones del caso son extensas.
 * @param {string} texto Texto original.
 * @param {number} largoMaximo Cantidad máxima de caracteres.
 * @returns {string} Texto recortado.
 */
function recortarTexto(texto, largoMaximo) {
  if (!texto || texto.length <= largoMaximo) {
    return texto || "";
  }

  return texto.slice(0, largoMaximo).trimEnd() + "…";
}
