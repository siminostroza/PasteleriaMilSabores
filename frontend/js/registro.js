/* =====================================================================
   REGISTRO.JS — Registro de clientes (registro.html)
   Pastelería 1000 Sabores

   Contiene, en este orden:
     1. Normalización del RUN
     2. Arranque

   El enunciado dice que registrarse es lo mismo que crear un usuario en el
   administrador, así que este archivo no escribe ni una regla: usa
   esquemaRegistro(), que se arma sobre el mismo esquemaUsuario() del
   mantenedor y le suma teléfono y contraseña.

   Depende de, en este orden de carga:
     js/datos/regiones.js -> activarRegionYComuna()
     js/comunes.js        -> mostrarAviso()
     js/validaciones.js   -> configurarValidacion(), esquemaRegistro(), limpiarRun()
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. NORMALIZACIÓN DEL RUN
   --------------------------------------------------------------------- */

/**
 * Al salir del campo, deja el RUN sin puntos ni guion y en mayúscula, que
 * es el formato que pide el enunciado para almacenarlo.
 *
 * La persona lo escribe como quiera y el sistema lo ordena, en vez de
 * rechazarlo por el formato. Por eso el campo acepta más caracteres de los
 * que va a guardar: si tuviera maxlength 9, el navegador cortaría
 * "12.345.678-5" antes de que se pudiera limpiar.
 */
function normalizarRunAlSalir() {
  var campo = document.getElementById("run");

  if (!campo) {
    return;
  }

  campo.addEventListener("blur", function () {
    if (campo.value.trim()) {
      campo.value = limpiarRun(campo.value);
    }
  });
}

/* ---------------------------------------------------------------------
   2. ARRANQUE
   --------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", function () {
  var formulario = document.getElementById("formulario-registro");

  activarRegionYComuna("", "");
  normalizarRunAlSalir();

  configurarValidacion(formulario, esquemaRegistro(), function (datos) {
    /* Sin backend no hay dónde crear la cuenta. Se muestran los datos ya
       validados, que es exactamente lo que recibiría la API. */
    console.log("Registro validado, listo para enviar:", datos);

    mostrarAviso(
      "¡Listo, " + datos.nombre + "! Tus datos pasaron todas las validaciones.",
      "exito"
    );

    formulario.reset();
    activarRegionYComuna("", "");
  });
});
