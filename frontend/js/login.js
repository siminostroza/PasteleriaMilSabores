/* =====================================================================
   LOGIN.JS — Inicio de sesión (login.html)
   Pastelería 1000 Sabores

   Toda la validación la hace el motor de validaciones.js; aquí solo se
   conecta el formulario con su esquema y se decide qué pasa cuando los
   datos están correctos.

   Depende de, en este orden de carga:
     js/comunes.js      -> mostrarAviso()
     js/validaciones.js -> configurarValidacion(), esquemaLogin()
   ===================================================================== */

/* Llave de la sesión en el navegador. Es la misma que lee el área de
   administración en admin-comunes.js: cuando exista un backend de verdad,
   lo único que cambia es de dónde sale el rol. */
var CLAVE_SESION_TIENDA = "pms_sesion";

/**
 * Deja constancia de la sesión iniciada.
 *
 * Esto NO es autenticación: no hay servidor que verifique la contraseña,
 * y cualquiera puede editar el localStorage. Es lo que corresponde a la
 * capa de presentación mientras el backend no existe, y permite que el
 * área de administración sepa con qué rol se está navegando.
 *
 * @param {string} correo Correo con el que se inició sesión.
 */
function guardarSesion(correo) {
  /* Mientras no haya backend, el rol sale del dominio del correo: los
     institucionales entran como administrador para poder mostrar el panel
     en la presentación, y el resto como cliente. */
  var esInstitucional = /@(duoc\.cl|duocuc\.cl|profesor\.duoc\.cl)$/i.test(correo);

  try {
    localStorage.setItem(
      CLAVE_SESION_TIENDA,
      JSON.stringify({
        correo: correo,
        rol: esInstitucional ? "ADMINISTRADOR" : "CLIENTE",
      })
    );
  } catch (error) {
    console.warn("No se pudo guardar la sesión.", error);
  }
}

document.addEventListener("DOMContentLoaded", function () {
  var formulario = document.getElementById("formulario-login");

  configurarValidacion(formulario, esquemaLogin(), function (datos) {
    guardarSesion(datos.correo);

    mostrarAviso(
      "¡Hola de nuevo! Iniciaste sesión como " + datos.correo + ".",
      "exito"
    );

    /* Se deja un momento para que el aviso alcance a leerse antes de salir
       de la página. */
    window.setTimeout(function () {
      window.location.href = "index.html";
    }, 1200);
  });
});
