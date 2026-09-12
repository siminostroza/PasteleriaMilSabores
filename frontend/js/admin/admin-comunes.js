/* =====================================================================
   Contiene, en este orden:
     1. Rutas desde la carpeta admin/
     2. Sesión y rol
     3. Permisos por rol
     4. Menú lateral
     5. Arranque

   Se carga en las cinco vistas de admin/. Es el equivalente de
   comunes.js para la tienda, pero no lo reemplaza: la tienda y el
   administrador tienen cabeceras distintas y viven en carpetas distintas.

   Depende de:
     js/datos/usuarios.js -> TIPOS_USUARIO
     js/comunes.js        -> mostrarAviso()
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. RUTAS DESDE LA CARPETA admin/

   Las páginas del administrador están un nivel más abajo que la tienda,
   así que las rutas guardadas en los datos, como "img/productos/tc001.jpg",
   apuntarían a "admin/img/..." y no existirían. Esta función las corrige
   en un solo lugar, en vez de repartir "../" por todo el código.
   --------------------------------------------------------------------- */

/**
 * Convierte una ruta relativa a la raíz del frontend en una ruta usable
 * desde admin/.
 * @param {string} ruta Ruta como "img/productos/tc001.jpg".
 * @returns {string} Ruta como "../img/productos/tc001.jpg".
 */
function rutaDesdeAdmin(ruta) {
  if (!ruta) {
    return "";
  }

  /* Si ya viene absoluta o con ../, se deja como está */
  if (
    ruta.indexOf("../") === 0 ||
    ruta.indexOf("/") === 0 ||
    ruta.indexOf("data:") === 0
  ) {
    return ruta;
  }

  return "../" + ruta;
}

/* ---------------------------------------------------------------------
   2. SESIÓN Y ROL

   Todavía no existe el inicio de sesión real, y el enunciado exige que
   las vistas del administrador estén protegidas por autenticación y
   permisos. Mientras eso llega, el rol vigente se guarda en el navegador
   bajo la misma llave que usará el login cuando esté listo: así, cuando
   se conecte, esta parte no cambia.

   El selector de rol de la barra superior existe para poder demostrar en
   la presentación que el menú y los permisos cambian de verdad. Cuando el
   inicio de sesión funcione, ese selector se quita y el rol viene de la
   sesión del usuario.
   --------------------------------------------------------------------- */
var CLAVE_SESION = "pms_sesion";

/**
 * Devuelve el rol con el que se está operando el administrador.
 * @returns {string} ADMINISTRADOR, VENDEDOR o CLIENTE.
 */
function rolActual() {
  try {
    var guardado = JSON.parse(localStorage.getItem(CLAVE_SESION) || "null");

    if (guardado && TIPOS_USUARIO.indexOf(guardado.rol) !== -1) {
      return guardado.rol;
    }
  } catch (error) {
    console.warn("No se pudo leer la sesión.", error);
  }

  return "ADMINISTRADOR";
}

/**
 * Cambia el rol vigente.
 * @param {string} rol Rol a dejar activo.
 */
function cambiarRol(rol) {
  try {
    localStorage.setItem(CLAVE_SESION, JSON.stringify({ rol: rol }));
  } catch (error) {
    console.warn("No se pudo guardar la sesión.", error);
  }
}

/* ---------------------------------------------------------------------
   3. PERMISOS POR ROL

   Es la misma matriz que la tabla rol_permiso de la base de datos, con
   los permisos que tocan al administrador. Se repite aquí porque el
   frontend todavía no consulta la base, pero los códigos son idénticos
   para que al conectar el backend se reemplace la lectura, no las reglas.

   Del enunciado: el administrador tiene acceso total; el vendedor solo
   puede ver el listado y el detalle de productos y de órdenes, y el resto
   no debe aparecer en su vista; el cliente no entra al administrador.
   --------------------------------------------------------------------- */
var PERMISOS_POR_ROL = {
  ADMINISTRADOR: [
    "PANEL_ACCEDER",
    "PRODUCTO_VER",
    "PRODUCTO_CREAR",
    "PRODUCTO_EDITAR",
    "PRODUCTO_ELIMINAR",
    "PEDIDO_VER",
    "USUARIO_VER",
    "USUARIO_CREAR",
    "USUARIO_EDITAR",
    "USUARIO_ELIMINAR",
  ],
  VENDEDOR: ["PANEL_ACCEDER", "PRODUCTO_VER", "PEDIDO_VER"],
  CLIENTE: [],
};

/**
 * ¿El rol vigente tiene este permiso?
 * @param {string} permiso Código del permiso.
 * @returns {boolean} true si lo tiene.
 */
function puede(permiso) {
  var permisos = PERMISOS_POR_ROL[rolActual()] || [];

  return permisos.indexOf(permiso) !== -1;
}

/**
 * Corta el paso si el rol vigente no puede estar en esta página.
 *
 * Es una protección de pantalla, no de seguridad: cualquiera puede editar
 * el localStorage. La protección de verdad la hacen los permisos de la
 * base de datos, que ya están implementados en sp_validar_permiso. Esto
 * es lo que corresponde a la capa de presentación: no mostrar lo que la
 * persona no puede usar.
 *
 * @param {string} permiso Permiso que la página exige.
 * @returns {boolean} true si puede seguir.
 */
function exigirPermiso(permiso) {
  if (puede(permiso)) {
    return true;
  }

  var contenido = document.getElementById("admin-contenido");

  if (contenido) {
    contenido.innerHTML =
      '<div class="estado-vacio">' +
      "<p><strong>No tienes acceso a esta sección.</strong></p>" +
      "<p>Tu rol es " +
      rolActual() +
      ", que no incluye el permiso " +
      permiso +
      ".</p>" +
      '<p class="margen-superior-lg"><a class="boton" href="index.html">Volver al inicio del panel</a></p>' +
      "</div>";
  }

  return false;
}

/* ---------------------------------------------------------------------
   4. MENÚ LATERAL
   --------------------------------------------------------------------- */

/**
 * Marca en el menú la página que se está viendo.
 */
function marcarMenuActivo() {
  var actual = window.location.pathname.split("/").pop() || "index.html";

  document.querySelectorAll(".admin-menu__enlace").forEach(function (enlace) {
    if (enlace.getAttribute("href") === actual) {
      enlace.classList.add("admin-menu__enlace--activo");
      enlace.setAttribute("aria-current", "page");
    }
  });
}

/**
 * Esconde del menú lo que el rol vigente no puede abrir.
 *
 * El enunciado es explícito: "todos los demás accesos no deben aparecer
 * en la vista del vendedor". No basta con bloquear la página: el enlace
 * no tiene que estar.
 */
function ajustarMenuAlRol() {
  document.querySelectorAll("[data-permiso]").forEach(function (elemento) {
    elemento.hidden = !puede(elemento.getAttribute("data-permiso"));
  });

  var etiqueta = document.getElementById("admin-rol-actual");

  if (etiqueta) {
    etiqueta.textContent = rolActual();
  }
}

/**
 * Conecta el selector de rol de la barra superior.
 */
function activarSelectorDeRol() {
  var select = document.getElementById("admin-rol-select");

  if (!select) {
    return;
  }

  TIPOS_USUARIO.forEach(function (rol) {
    var opcion = document.createElement("option");
    opcion.value = rol;
    opcion.textContent = rol;
    select.appendChild(opcion);
  });

  select.value = rolActual();

  select.addEventListener("change", function () {
    cambiarRol(select.value);
    /* Se recarga para que la página entera se vuelva a evaluar con el rol
       nuevo, incluida la comprobación de permiso de entrada. */
    window.location.reload();
  });
}

/* ---------------------------------------------------------------------
   5. ARRANQUE
   --------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", function () {
  marcarMenuActivo();
  ajustarMenuAlRol();
  activarSelectorDeRol();
});
