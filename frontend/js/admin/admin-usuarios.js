/* =====================================================================
   Contiene, en este orden:
     1. Listado (admin/usuarios.html)
     2. Formulario de alta y edición (admin/usuario-form.html)
     3. Arranque

   Depende de, en este orden de carga:
     js/datos/usuarios.js  -> USUARIOS, TIPOS_USUARIO, buscarUsuario(), runConFormato()
     js/datos/regiones.js  -> activarRegionYComuna()
     js/formato.js         -> formatearFecha()
     js/comunes.js         -> mostrarAviso()
     js/validaciones.js    -> configurarValidacion(), esquemaUsuario(), limpiarRun()
     js/admin/admin-comunes.js -> puede(), exigirPermiso(), rolActual()
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. LISTADO
   --------------------------------------------------------------------- */

var filtroUsuarios = { texto: "", tipo: "" };

/**
 * Dibuja las filas de la tabla de usuarios con los filtros aplicados.
 */
function mostrarTablaUsuarios() {
  var cuerpo = document.getElementById("tabla-usuarios");

  if (!cuerpo) {
    return;
  }

  var visibles = USUARIOS.filter(function (usuario) {
    if (filtroUsuarios.tipo && usuario.tipoUsuario !== filtroUsuarios.tipo) {
      return false;
    }

    if (filtroUsuarios.texto) {
      var texto = (
        usuario.run +
        " " +
        usuario.nombre +
        " " +
        usuario.apellidos +
        " " +
        usuario.correo
      ).toLowerCase();

      return texto.indexOf(filtroUsuarios.texto) !== -1;
    }

    return true;
  });

  cuerpo.innerHTML = "";

  var contador = document.getElementById("usuarios-contador");

  if (contador) {
    contador.textContent =
      "Mostrando " + visibles.length + " de " + USUARIOS.length + " usuarios";
  }

  if (visibles.length === 0) {
    var fila = document.createElement("tr");
    var celda = document.createElement("td");
    celda.colSpan = 7;
    celda.className = "tabla__vacia";
    celda.textContent = "Ningún usuario coincide con la búsqueda.";
    fila.appendChild(celda);
    cuerpo.appendChild(fila);
    return;
  }

  var fragmento = document.createDocumentFragment();

  visibles.forEach(function (usuario) {
    fragmento.appendChild(crearFilaUsuario(usuario));
  });

  cuerpo.appendChild(fragmento);
}

/**
 * Arma una fila de la tabla de usuarios.
 * @param {Object} usuario Usuario del sistema.
 * @returns {HTMLElement} Elemento <tr>.
 */
function crearFilaUsuario(usuario) {
  var fila = document.createElement("tr");

  /* En el listado el RUN se lee con puntos; en el formulario se edita sin
     ellos, que es el formato que pide el enunciado para almacenarlo. */
  fila.appendChild(celdaTextoUsuario(runConFormato(usuario.run)));
  fila.appendChild(celdaTextoUsuario(usuario.nombre + " " + usuario.apellidos));
  fila.appendChild(celdaTextoUsuario(usuario.correo));

  var celdaTipo = document.createElement("td");
  var insigniaTipo = document.createElement("span");
  insigniaTipo.className = "estado estado--rol";
  insigniaTipo.textContent = usuario.tipoUsuario;
  celdaTipo.appendChild(insigniaTipo);
  fila.appendChild(celdaTipo);

  fila.appendChild(celdaTextoUsuario(usuario.comuna + ", " + usuario.region));

  var celdaEstado = document.createElement("td");
  var insigniaEstado = document.createElement("span");
  insigniaEstado.className = usuario.activo
    ? "estado estado--activo"
    : "estado estado--inactivo";
  insigniaEstado.textContent = usuario.activo ? "Activo" : "Inactivo";
  celdaEstado.appendChild(insigniaEstado);
  fila.appendChild(celdaEstado);

  var celdaAcciones = document.createElement("td");
  var acciones = document.createElement("div");
  acciones.className = "tabla__acciones";

  if (puede("USUARIO_EDITAR")) {
    var editar = document.createElement("a");
    editar.className = "boton boton--borde boton--chico";
    editar.href = "usuario-form.html?run=" + encodeURIComponent(usuario.run);
    editar.textContent = "Editar";
    editar.setAttribute(
      "aria-label",
      "Editar a " + usuario.nombre + " " + usuario.apellidos,
    );
    acciones.appendChild(editar);
  }

  if (puede("USUARIO_ELIMINAR")) {
    var eliminar = document.createElement("button");
    eliminar.type = "button";
    eliminar.className = "boton boton--borde boton--chico";
    eliminar.textContent = usuario.activo ? "Desactivar" : "Reactivar";

    eliminar.addEventListener("click", function () {
      alternarUsuario(usuario);
    });

    acciones.appendChild(eliminar);
  }

  if (acciones.childNodes.length === 0) {
    acciones.textContent = "Solo lectura";
  }

  celdaAcciones.appendChild(acciones);
  fila.appendChild(celdaAcciones);

  return fila;
}

/**
 * Activa o desactiva un usuario, con el mismo resguardo que la base de
 * datos: el sistema no puede quedarse sin administradores activos.
 * @param {Object} usuario Usuario a alternar.
 */
function alternarUsuario(usuario) {
  if (usuario.activo && usuario.tipoUsuario === "ADMINISTRADOR") {
    var administradoresActivos = USUARIOS.filter(function (otro) {
      return otro.tipoUsuario === "ADMINISTRADOR" && otro.activo;
    }).length;

    if (administradoresActivos <= 1) {
      mostrarAviso(
        "No se puede desactivar al único administrador activo del sistema.",
        "error",
      );
      return;
    }
  }

  usuario.activo = !usuario.activo;

  mostrarAviso(
    usuario.nombre +
      " quedó " +
      (usuario.activo ? "activo" : "inactivo") +
      ". Al no haber backend, el cambio se pierde al recargar.",
    "exito",
  );

  mostrarTablaUsuarios();
}

/**
 * Atajo para crear una celda de texto.
 * @param {string} texto Contenido de la celda.
 * @returns {HTMLElement} Elemento <td>.
 */
function celdaTextoUsuario(texto) {
  var celda = document.createElement("td");
  celda.textContent = texto;
  return celda;
}

/**
 * Conecta la búsqueda y el filtro por tipo del listado.
 */
function activarFiltrosUsuarios() {
  var busqueda = document.getElementById("buscar-usuario");
  var tipo = document.getElementById("filtrar-tipo");

  if (tipo) {
    TIPOS_USUARIO.forEach(function (nombre) {
      var opcion = document.createElement("option");
      opcion.value = nombre;
      opcion.textContent = nombre;
      tipo.appendChild(opcion);
    });

    tipo.addEventListener("change", function () {
      filtroUsuarios.tipo = tipo.value;
      mostrarTablaUsuarios();
    });
  }

  if (busqueda) {
    busqueda.addEventListener("input", function () {
      filtroUsuarios.texto = busqueda.value.trim().toLowerCase();
      mostrarTablaUsuarios();
    });
  }
}

/* ---------------------------------------------------------------------
   2. FORMULARIO DE ALTA Y EDICIÓN
   --------------------------------------------------------------------- */

/**
 * Prepara el formulario de usuario.
 *
 * Como en el de productos, una sola pantalla crea y edita: si la
 * dirección trae un RUN se cargan sus datos y se exige el permiso de
 * editar; si no, es un alta y se exige el de crear.
 */
function prepararFormularioUsuario() {
  var formulario = document.getElementById("formulario-usuario");

  if (!formulario) {
    return;
  }

  var parametros = new URLSearchParams(window.location.search);
  var run = parametros.get("run");
  var usuario = run ? buscarUsuario(run) : null;
  var esEdicion = Boolean(usuario);

  if (!exigirPermiso(esEdicion ? "USUARIO_EDITAR" : "USUARIO_CREAR")) {
    return;
  }

  if (run && !usuario) {
    mostrarAviso("No existe un usuario con el RUN " + run + ".", "error");
  }

  poblarTiposUsuario();
  ajustarTitulosUsuario(esEdicion, usuario);

  if (esEdicion) {
    volcarUsuarioEnFormulario(usuario);
    activarRegionYComuna(usuario.region, usuario.comuna);
  } else {
    activarRegionYComuna("", "");
  }

  normalizarRunAlSalir();

  /* El esquema se pide con tipo de usuario porque esta es la vista del
     administrador. El registro de la tienda usa el mismo esquema sin ese
     campo: esquemaUsuario(false). */
  configurarValidacion(formulario, esquemaUsuario(true), function (datos) {
    console.log("Usuario validado, listo para enviar:", datos);
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
 * Llena el desplegable de tipo de usuario con los tres roles del caso.
 */
function poblarTiposUsuario() {
  var select = document.getElementById("tipoUsuario");

  if (!select) {
    return;
  }

  TIPOS_USUARIO.forEach(function (tipo) {
    var opcion = document.createElement("option");
    opcion.value = tipo;
    opcion.textContent = tipo;
    select.appendChild(opcion);
  });
}

/**
 * Cambia los títulos según si se está creando o editando.
 * @param {boolean} esEdicion true si se edita un usuario existente.
 * @param {Object} usuario Usuario en edición, si corresponde.
 */
function ajustarTitulosUsuario(esEdicion, usuario) {
  var titulo = document.getElementById("admin-titulo");
  var bajada = document.getElementById("admin-bajada");
  var boton = document.getElementById("boton-guardar");

  if (titulo) {
    titulo.textContent = esEdicion ? "Editar usuario" : "Nuevo usuario";
  }

  if (bajada) {
    bajada.textContent = esEdicion
      ? "Estás editando a " + usuario.nombre + " " + usuario.apellidos + "."
      : "Completa los datos del usuario. Los campos con asterisco son obligatorios.";
  }

  if (boton) {
    boton.textContent = esEdicion ? "Guardar cambios" : "Crear usuario";
  }

  document.title =
    (esEdicion ? "Editar usuario" : "Nuevo usuario") +
    " — Administración Pastelería 1000 Sabores";
}

/**
 * Escribe los datos de un usuario en los campos del formulario.
 * @param {Object} usuario Usuario a editar.
 */
function volcarUsuarioEnFormulario(usuario) {
  asignarValorUsuario("run", usuario.run);
  asignarValorUsuario("nombre", usuario.nombre);
  asignarValorUsuario("apellidos", usuario.apellidos);
  asignarValorUsuario("correo", usuario.correo);
  asignarValorUsuario("fechaNacimiento", usuario.fechaNacimiento);
  asignarValorUsuario("tipoUsuario", usuario.tipoUsuario);
  asignarValorUsuario("direccion", usuario.direccion);

  /* El RUN de un usuario que ya existe no se cambia: es su identificador.
     Se muestra pero no se edita. */
  var campoRun = document.getElementById("run");

  if (campoRun) {
    campoRun.readOnly = true;
    campoRun.setAttribute("aria-describedby", "ayuda-run");
  }
}

/**
 * Asigna un valor a un campo si existe.
 * @param {string} id id del campo.
 * @param {*} valor Valor a escribir.
 */
function asignarValorUsuario(id, valor) {
  var campo = document.getElementById(id);

  if (campo && valor !== undefined && valor !== null) {
    campo.value = valor;
  }
}

/**
 * Al salir del campo, deja el RUN en el formato que pide el enunciado:
 * sin puntos, sin guion y en mayúscula. La persona puede escribirlo como
 * quiera y el sistema lo ordena, en vez de rechazarlo por el formato.
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
   3. ARRANQUE
   --------------------------------------------------------------------- */
document.addEventListener("DOMContentLoaded", function () {
  if (document.getElementById("tabla-usuarios")) {
    if (!exigirPermiso("USUARIO_VER")) {
      return;
    }

    activarFiltrosUsuarios();
    mostrarTablaUsuarios();
  }

  prepararFormularioUsuario();
});
