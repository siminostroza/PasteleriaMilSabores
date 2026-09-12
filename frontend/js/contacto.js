/* =====================================================================

   Contiene, en este orden:
     1. Contador de caracteres del comentario
     2. Arranque

   Como en login y registro, aquí no se escribe ninguna regla: las tres
   del enunciado (nombre, correo y comentario) están en esquemaContacto().

   Depende de, en este orden de carga:
     js/comunes.js      -> mostrarAviso()
     js/validaciones.js -> configurarValidacion(), esquemaContacto(), LARGO
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. CONTADOR DE CARACTERES

   El enunciado limita el comentario a 500. Mostrar cuántos van mientras se
   escribe evita que alguien redacte un mensaje largo y recién al enviarlo
   se entere de que no cabe.
   --------------------------------------------------------------------- */

/**
 * Enciende el contador del comentario y lo mantiene al día.
 */
function activarContadorComentario() {
  var textarea = document.getElementById("comentario");
  var contador = document.getElementById("comentario-contador");

  if (!textarea || !contador) {
    return;
  }

  var refrescar = function () {
    contador.textContent =
      textarea.value.length + " de " + LARGO.COMENTARIO + " caracteres";
  };

  textarea.addEventListener("input", refrescar);
  refrescar();
}

/* ---------------------------------------------------------------------
   2. ARRANQUE
   --------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", function () {
  var formulario = document.getElementById("formulario-contacto");

  activarContadorComentario();

  configurarValidacion(formulario, esquemaContacto(), function (datos) {
    /* Sin backend no hay a quién enviarle el mensaje. Se muestran los datos
       ya validados, que es exactamente lo que recibiría la API. */
    console.log("Mensaje validado, listo para enviar:", datos);

    mostrarAviso(
      "¡Gracias, " +
        datos.nombre +
        "! Recibimos tu mensaje y te " +
        "responderemos dentro de las próximas 24 horas.",
      "exito",
    );

    formulario.reset();
    activarContadorComentario();
  });
});
