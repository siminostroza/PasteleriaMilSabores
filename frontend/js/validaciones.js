/* =====================================================================
   La idea del archivo: una regla es una función que recibe un valor y
   devuelve null si está bien, o el mensaje de error si está mal. Un
   formulario se describe como una lista de reglas por campo, y el motor
   de la sección 6 se encarga del resto: validar mientras se escribe,
   pintar los mensajes, bloquear el envío y avisar.

   Así, agregar un campo a un formulario es agregar una línea al esquema,
   no escribir otra función de validación. Y los cinco formularios del
   sitio (login, registro, contacto y los dos mantenedores del
   administrador) comparten exactamente las mismas comprobaciones.
   ===================================================================== */

/* ---------------------------------------------------------------------
   1. CONSTANTES DE LAS REGLAS DEL ENUNCIADO
   --------------------------------------------------------------------- */

/* Dominios de correo aceptados. Son los tres que exige el documento de la
   evaluación.

   Nota para cuando se conecte el backend: la base de datos acepta además
   duocuc.cl y profesor.duocuc.cl, que es la escritura real del dominio
   institucional de Duoc UC. Si el equipo decide alinear las dos capas,
   este arreglo es el único lugar que hay que tocar. */
var DOMINIOS_PERMITIDOS = [
  "duoc.cl",
  "duocuc.cl",
  "profesor.duoc.cl",
  "gmail.com",
];

/* Largos máximos, tomados del enunciado campo por campo */
var LARGO = {
  CORREO: 100,
  CLAVE_MIN: 4,
  CLAVE_MAX: 10,
  NOMBRE_CONTACTO: 100,
  COMENTARIO: 500,
  NOMBRE_USUARIO: 50,
  APELLIDOS: 100,
  DIRECCION: 300,
  CODIGO_PRODUCTO_MIN: 3,
  NOMBRE_PRODUCTO: 100,
  DESCRIPCION_PRODUCTO: 500,
  RUN_MIN: 7,
  RUN_MAX: 9,
};

/* Dominios mal escritos que la gente teclea a menudo, y a qué dominio
   válido corresponden. Alimentan la sugerencia de la sección 4. */
var CONFUSIONES_DE_DOMINIO = {
  "gmial.com": "gmail.com",
  "gmai.com": "gmail.com",
  "gmail.cl": "gmail.com",
  "gmail.co": "gmail.com",
  "gamil.com": "gmail.com",
  "hotmail.com": "gmail.com",
  "outlook.com": "gmail.com",
  "duoc.com": "duoc.cl",
  "duocuc.cl": "duoc.cl",
  "duoc.c": "duoc.cl",
  "profesor.duocuc.cl": "profesor.duoc.cl",
};

/* ---------------------------------------------------------------------
   2. COMPROBACIONES SUELTAS
   Funciones puras: reciben un valor y devuelven true o false. No tocan el
   DOM ni arman mensajes, así que se pueden probar por separado.
   --------------------------------------------------------------------- */

/**
 * ¿El valor trae algo más que espacios?
 * @param {string} valor Texto a revisar.
 * @returns {boolean} true si tiene contenido.
 */
function tieneContenido(valor) {
  return typeof valor === "string" && valor.trim().length > 0;
}

/**
 * Devuelve el dominio de un correo, en minúsculas.
 * @param {string} correo Correo completo.
 * @returns {string} Dominio, o cadena vacía si no hay arroba.
 */
function dominioDelCorreo(correo) {
  var texto = String(correo || "")
    .trim()
    .toLowerCase();
  var posicion = texto.lastIndexOf("@");

  if (posicion === -1) {
    return "";
  }

  return texto.slice(posicion + 1);
}

/**
 * ¿El correo tiene forma de correo y un dominio de los permitidos?
 * @param {string} correo Correo a revisar.
 * @returns {boolean} true si es aceptable.
 */
function esCorreoPermitido(correo) {
  var texto = String(correo || "")
    .trim()
    .toLowerCase();

  if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(texto)) {
    return false;
  }

  return DOMINIOS_PERMITIDOS.indexOf(dominioDelCorreo(texto)) !== -1;
}

/**
 * Deja el RUN sin puntos, sin guion, sin espacios y en mayúscula.
 * El enunciado pide almacenarlo así, por ejemplo 19011022K, pero la gente
 * lo escribe con puntos: se acepta cualquier forma y se normaliza.
 * @param {string} run RUN en cualquier formato.
 * @returns {string} RUN limpio.
 */
function limpiarRun(run) {
  return String(run || "")
    .replace(/[^0-9kK]/g, "")
    .toUpperCase();
}

/**
 * Valida un RUN chileno con el algoritmo módulo 11.
 *
 * El dígito verificador se calcula multiplicando los dígitos del cuerpo,
 * de derecha a izquierda, por la serie 2, 3, 4, 5, 6, 7 que se reinicia, y
 * viendo qué falta para completar el múltiplo de 11 más cercano.
 *
 * @param {string} run RUN en cualquier formato.
 * @returns {boolean} true si el dígito verificador cuadra.
 */
function esRunValido(run) {
  var limpio = limpiarRun(run);

  if (limpio.length < LARGO.RUN_MIN || limpio.length > LARGO.RUN_MAX) {
    return false;
  }

  if (!/^[0-9]+[0-9K]$/.test(limpio)) {
    return false;
  }

  var cuerpo = limpio.slice(0, -1);
  var digito = limpio.slice(-1);
  var suma = 0;
  var multiplicador = 2;

  for (var i = cuerpo.length - 1; i >= 0; i--) {
    suma += Number(cuerpo.charAt(i)) * multiplicador;
    multiplicador = multiplicador === 7 ? 2 : multiplicador + 1;
  }

  var resto = 11 - (suma % 11);
  var esperado = resto === 11 ? "0" : resto === 10 ? "K" : String(resto);

  return digito === esperado;
}

/**
 * ¿El texto representa un número entero mayor o igual a cero?
 * @param {string|number} valor Valor a revisar.
 * @returns {boolean} true si es entero no negativo.
 */
function esEnteroNoNegativo(valor) {
  var texto = String(valor).trim();

  if (!/^\d+$/.test(texto)) {
    return false;
  }

  return Number(texto) >= 0;
}

/**
 * ¿El texto representa un número mayor o igual a cero? Acepta decimales,
 * que es lo que el enunciado pide para el precio de un producto.
 * @param {string|number} valor Valor a revisar.
 * @returns {boolean} true si es número no negativo.
 */
function esNumeroNoNegativo(valor) {
  var texto = String(valor).trim().replace(",", ".");

  if (!/^\d+(\.\d+)?$/.test(texto)) {
    return false;
  }

  return Number(texto) >= 0;
}

/**
 * ¿La fecha existe y quedó en el pasado?
 * @param {string} valor Fecha en formato AAAA-MM-DD.
 * @returns {boolean} true si es una fecha pasada válida.
 */
function esFechaPasada(valor) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(valor).trim())) {
    return false;
  }

  var partes = valor.split("-");
  var fecha = new Date(
    Number(partes[0]),
    Number(partes[1]) - 1,
    Number(partes[2]),
  );

  /* Comparar las tres partes descarta fechas que el constructor "arregla"
     solo, como el 31 de febrero, que se convertiría en marzo. */
  if (
    fecha.getFullYear() !== Number(partes[0]) ||
    fecha.getMonth() !== Number(partes[1]) - 1 ||
    fecha.getDate() !== Number(partes[2])
  ) {
    return false;
  }

  var hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  return fecha < hoy;
}

/* ---------------------------------------------------------------------
   3. FÁBRICAS DE REGLAS
   Cada fábrica devuelve una regla: una función que recibe el valor y
   devuelve null si está bien, o el mensaje de error si está mal.
   El nombre del campo se pasa como texto para que el mensaje hable el
   idioma del usuario y no el de la base de datos.
   --------------------------------------------------------------------- */

/**
 * Exige que el campo venga con algo.
 * @param {string} campo Nombre visible del campo.
 * @returns {Function} Regla de validación.
 */
function reglaRequerido(campo) {
  return function (valor) {
    return tieneContenido(valor) ? null : campo + " es obligatorio.";
  };
}

/**
 * Limita el largo del texto.
 * @param {number} maximo Cantidad máxima de caracteres.
 * @param {string} campo Nombre visible del campo.
 * @returns {Function} Regla de validación.
 */
function reglaLargoMaximo(maximo, campo) {
  return function (valor) {
    var texto = String(valor || "").trim();

    if (texto.length <= maximo) {
      return null;
    }

    return (
      campo +
      " no puede superar los " +
      maximo +
      " caracteres. " +
      "Llevas " +
      texto.length +
      "."
    );
  };
}

/**
 * Exige un largo mínimo.
 * @param {number} minimo Cantidad mínima de caracteres.
 * @param {string} campo Nombre visible del campo.
 * @returns {Function} Regla de validación.
 */
function reglaLargoMinimo(minimo, campo) {
  return function (valor) {
    var texto = String(valor || "").trim();

    if (!tieneContenido(texto) || texto.length >= minimo) {
      return null;
    }

    return campo + " necesita al menos " + minimo + " caracteres.";
  };
}

/**
 * Exige un largo dentro de un rango.
 * @param {number} minimo Mínimo de caracteres.
 * @param {number} maximo Máximo de caracteres.
 * @param {string} campo Nombre visible del campo.
 * @returns {Function} Regla de validación.
 */
function reglaLargoEntre(minimo, maximo, campo) {
  return function (valor) {
    var texto = String(valor || "");

    if (
      !tieneContenido(texto) ||
      (texto.length >= minimo && texto.length <= maximo)
    ) {
      return null;
    }

    return (
      campo + " debe tener entre " + minimo + " y " + maximo + " caracteres."
    );
  };
}

/**
 * Exige un correo con dominio permitido.
 * Si detecta un dominio mal escrito, lo dice en el mensaje.
 * @returns {Function} Regla de validación.
 */
function reglaCorreo() {
  return function (valor) {
    if (!tieneContenido(valor)) {
      return null;
    }

    if (esCorreoPermitido(valor)) {
      return null;
    }

    var sugerencia = sugerirCorreo(valor);

    if (sugerencia) {
      return (
        "Ese dominio no está permitido. ¿Quisiste escribir " + sugerencia + "?"
      );
    }

    return "Solo aceptamos correos " + listaDeDominios() + ".";
  };
}

/**
 * Exige un RUN chileno válido.
 * @returns {Function} Regla de validación.
 */
function reglaRun() {
  return function (valor) {
    if (!tieneContenido(valor)) {
      return null;
    }

    var limpio = limpiarRun(valor);

    if (limpio.length < LARGO.RUN_MIN || limpio.length > LARGO.RUN_MAX) {
      return (
        "El RUN debe tener entre " +
        LARGO.RUN_MIN +
        " y " +
        LARGO.RUN_MAX +
        " caracteres, sin puntos ni guion. Por ejemplo: 19011022K."
      );
    }

    if (!esRunValido(valor)) {
      return "El RUN no es válido: el dígito verificador no corresponde.";
    }

    return null;
  };
}

/**
 * Exige un número entero mayor o igual a cero.
 * @param {string} campo Nombre visible del campo.
 * @returns {Function} Regla de validación.
 */
function reglaEnteroNoNegativo(campo) {
  return function (valor) {
    if (!tieneContenido(valor)) {
      return null;
    }

    return esEnteroNoNegativo(valor)
      ? null
      : campo +
          " debe ser un número entero mayor o igual a cero, sin decimales.";
  };
}

/**
 * Exige un número mayor o igual a cero, con decimales permitidos.
 * @param {string} campo Nombre visible del campo.
 * @returns {Function} Regla de validación.
 */
function reglaNumeroNoNegativo(campo) {
  return function (valor) {
    if (!tieneContenido(valor)) {
      return null;
    }

    return esNumeroNoNegativo(valor)
      ? null
      : campo + " debe ser un número mayor o igual a cero.";
  };
}

/**
 * Exige una fecha pasada y válida.
 * @param {string} campo Nombre visible del campo.
 * @returns {Function} Regla de validación.
 */
function reglaFechaPasada(campo) {
  return function (valor) {
    if (!tieneContenido(valor)) {
      return null;
    }

    return esFechaPasada(valor)
      ? null
      : campo + " debe ser una fecha válida anterior a hoy.";
  };
}

/**
 * Exige que se haya elegido una opción de un desplegable.
 * @param {string} campo Nombre visible del campo.
 * @returns {Function} Regla de validación.
 */
function reglaOpcionElegida(campo) {
  return function (valor) {
    return tieneContenido(valor) ? null : "Elige " + campo + ".";
  };
}

/**
 * Exige que el valor coincida con el de otro campo del formulario.
 * Se usa para confirmar la contraseña.
 * @param {string} idOtroCampo id del campo con el que se compara.
 * @param {string} mensaje Mensaje a mostrar si no coinciden.
 * @returns {Function} Regla de validación.
 */
function reglaIgualA(idOtroCampo, mensaje) {
  return function (valor) {
    var otro = document.getElementById(idOtroCampo);

    if (!otro || valor === otro.value) {
      return null;
    }

    return mensaje;
  };
}

/* ---------------------------------------------------------------------
   4. SUGERENCIAS
   El enunciado pide sugerencias además de mensajes de error. Adivinar el
   dominio que el usuario quiso escribir evita el ida y vuelta de
   "correo inválido" sin decir por qué.
   --------------------------------------------------------------------- */

/**
 * Arma el listado de dominios permitidos para los mensajes.
 * @returns {string} Texto como "@duoc.cl, @profesor.duoc.cl o @gmail.com".
 */
function listaDeDominios() {
  var conArroba = DOMINIOS_PERMITIDOS.map(function (dominio) {
    return "@" + dominio;
  });

  if (conArroba.length === 1) {
    return conArroba[0];
  }

  return (
    conArroba.slice(0, -1).join(", ") + " o " + conArroba[conArroba.length - 1]
  );
}

/**
 * Propone un correo corregido cuando el dominio parece un error de tipeo.
 * @param {string} correo Correo escrito por el usuario.
 * @returns {string|null} Correo sugerido, o null si no hay sugerencia.
 */
function sugerirCorreo(correo) {
  var texto = String(correo || "")
    .trim()
    .toLowerCase();
  var dominio = dominioDelCorreo(texto);

  if (!dominio || !CONFUSIONES_DE_DOMINIO[dominio]) {
    return null;
  }

  var usuario = texto.slice(0, texto.lastIndexOf("@"));

  if (!usuario) {
    return null;
  }

  return usuario + "@" + CONFUSIONES_DE_DOMINIO[dominio];
}

/* ---------------------------------------------------------------------
   5. MOSTRAR Y LIMPIAR ERRORES EN PANTALLA

   Cada control lleva su mensaje en un elemento con id "error-" más el id
   del control. Además de pintarlo, se marca el control con aria-invalid y
   se apunta aria-describedby al mensaje: así un lector de pantalla
   anuncia el error al llegar al campo, y no solo lo ve quien mira.
   --------------------------------------------------------------------- */

/**
 * Devuelve el elemento donde va el mensaje de error de un control.
 * @param {HTMLElement} control Campo del formulario.
 * @returns {HTMLElement|null} Elemento del mensaje.
 */
function contenedorDeError(control) {
  return document.getElementById("error-" + control.id);
}

/**
 * Pinta el error de un campo.
 * @param {HTMLElement} control Campo del formulario.
 * @param {string} mensaje Texto del error.
 */
function mostrarErrorCampo(control, mensaje) {
  var destino = contenedorDeError(control);

  control.classList.add("campo__control--error");
  control.setAttribute("aria-invalid", "true");

  if (destino) {
    destino.textContent = mensaje;
    destino.hidden = false;
    control.setAttribute("aria-describedby", destino.id);
  }
}

/**
 * Borra el error de un campo.
 * @param {HTMLElement} control Campo del formulario.
 */
function limpiarErrorCampo(control) {
  var destino = contenedorDeError(control);

  control.classList.remove("campo__control--error");
  control.removeAttribute("aria-invalid");

  if (destino) {
    destino.textContent = "";
    destino.hidden = true;
    control.removeAttribute("aria-describedby");
  }
}

/* ---------------------------------------------------------------------
   6. MOTOR DE VALIDACIÓN DE UN FORMULARIO
   --------------------------------------------------------------------- */

/**
 * Corre las reglas de un campo y pinta el resultado.
 * @param {HTMLElement} control Campo del formulario.
 * @param {Array} reglas Reglas a aplicar, en orden.
 * @returns {boolean} true si el campo quedó válido.
 */
function validarCampo(control, reglas) {
  var valor =
    control.type === "checkbox" ? (control.checked ? "si" : "") : control.value;

  for (var i = 0; i < reglas.length; i++) {
    var mensaje = reglas[i](valor);

    if (mensaje) {
      mostrarErrorCampo(control, mensaje);
      return false;
    }
  }

  limpiarErrorCampo(control);
  return true;
}

/**
 * Conecta un formulario con su esquema de validación.
 *
 * El momento en que se valida está elegido a propósito:
 *   - al salir del campo (blur) se valida siempre;
 *   - mientras se escribe (input) se valida solo si el campo YA tenía un
 *     error visible.
 * Si se validara en cada tecla desde el principio, el formulario estaría
 * en rojo desde la primera letra del correo. Así el error aparece cuando
 * la persona terminó de escribir, y desaparece apenas lo corrige.
 *
 * @param {HTMLFormElement} formulario Formulario a validar.
 * @param {Object} esquema Objeto { idDelCampo: [reglas] }.
 * @param {Function} alEnviarValido Se llama con los datos si todo está bien.
 */
function configurarValidacion(formulario, esquema, alEnviarValido) {
  if (!formulario) {
    return;
  }

  /* El navegador tiene su propia validación, con mensajes que no podemos
     redactar ni traducir. Se apaga para quedarnos con la nuestra. */
  formulario.setAttribute("novalidate", "novalidate");

  Object.keys(esquema).forEach(function (id) {
    var control = document.getElementById(id);

    if (!control) {
      return;
    }

    control.addEventListener("blur", function () {
      validarCampo(control, esquema[id]);
    });

    control.addEventListener("input", function () {
      if (control.classList.contains("campo__control--error")) {
        validarCampo(control, esquema[id]);
      }
    });
  });

  formulario.addEventListener("submit", function (evento) {
    evento.preventDefault();

    var primerInvalido = null;
    var datos = {};

    Object.keys(esquema).forEach(function (id) {
      var control = document.getElementById(id);

      if (!control) {
        return;
      }

      if (!validarCampo(control, esquema[id]) && !primerInvalido) {
        primerInvalido = control;
      }

      datos[id] =
        control.type === "checkbox" ? control.checked : control.value.trim();
    });

    if (primerInvalido) {
      /* Llevar el foco al primer problema evita que el usuario tenga que
         buscar cuál de ocho campos quedó mal. */
      primerInvalido.focus();
      mostrarAviso("Revisa los campos marcados en rojo.", "error");
      return;
    }

    alEnviarValido(datos, formulario);
  });
}

/* ---------------------------------------------------------------------
   7. ESQUEMAS DE LOS FORMULARIOS DEL SITIO

   Aquí se traduce, campo por campo, la lista de reglas del enunciado.
   Cada formulario toma el suyo y se lo pasa al motor de arriba.
   --------------------------------------------------------------------- */

/**
 * Inicio de sesión: correo y contraseña.
 * @returns {Object} Esquema de validación.
 */
function esquemaLogin() {
  return {
    correo: [
      reglaRequerido("El correo"),
      reglaLargoMaximo(LARGO.CORREO, "El correo"),
      reglaCorreo(),
    ],
    clave: [
      reglaRequerido("La contraseña"),
      reglaLargoEntre(LARGO.CLAVE_MIN, LARGO.CLAVE_MAX, "La contraseña"),
    ],
  };
}

/**
 * Contacto: nombre, correo y comentario.
 *
 * El correo no lleva reglaRequerido porque el enunciado, a diferencia del
 * nombre y el comentario, no lo marca como obligatorio. Si el docente
 * pide que lo sea, basta con agregar reglaRequerido("El correo") al
 * principio de su lista.
 *
 * @returns {Object} Esquema de validación.
 */
function esquemaContacto() {
  return {
    nombre: [
      reglaRequerido("El nombre"),
      reglaLargoMaximo(LARGO.NOMBRE_CONTACTO, "El nombre"),
    ],
    correo: [reglaLargoMaximo(LARGO.CORREO, "El correo"), reglaCorreo()],
    comentario: [
      reglaRequerido("El comentario"),
      reglaLargoMaximo(LARGO.COMENTARIO, "El comentario"),
    ],
  };
}

/**
 * Registro de usuario y mantenedor de usuarios del administrador.
 * El enunciado dice que son el mismo conjunto de reglas; el administrador
 * agrega el tipo de usuario, que en la tienda no existe.
 * @param {boolean} conTipoUsuario true para la vista del administrador.
 * @returns {Object} Esquema de validación.
 */
function esquemaUsuario(conTipoUsuario) {
  var esquema = {
    run: [reglaRequerido("El RUN"), reglaRun()],
    nombre: [
      reglaRequerido("El nombre"),
      reglaLargoMaximo(LARGO.NOMBRE_USUARIO, "El nombre"),
    ],
    apellidos: [
      reglaRequerido("Los apellidos"),
      reglaLargoMaximo(LARGO.APELLIDOS, "Los apellidos"),
    ],
    correo: [
      reglaRequerido("El correo"),
      reglaLargoMaximo(LARGO.CORREO, "El correo"),
      reglaCorreo(),
    ],
    fechaNacimiento: [reglaFechaPasada("La fecha de nacimiento")],
    region: [reglaOpcionElegida("una región")],
    comuna: [reglaOpcionElegida("una comuna")],
    direccion: [
      reglaRequerido("La dirección"),
      reglaLargoMaximo(LARGO.DIRECCION, "La dirección"),
    ],
  };

  if (conTipoUsuario) {
    esquema.tipoUsuario = [reglaOpcionElegida("un tipo de usuario")];
  }

  return esquema;
}

/**
 * Reglas de la contraseña al registrarse. Se suman al esquema de usuario.
 * El enunciado no las lista para el mantenedor, pero un registro en la
 * tienda necesita contraseña, y el largo se toma del inicio de sesión
 * para que las dos pantallas no se contradigan.
 * @returns {Object} Reglas adicionales.
 */
function reglasClaveRegistro() {
  return {
    clave: [
      reglaRequerido("La contraseña"),
      reglaLargoEntre(LARGO.CLAVE_MIN, LARGO.CLAVE_MAX, "La contraseña"),
    ],
    claveRepetida: [
      reglaRequerido("La confirmación de contraseña"),
      reglaIgualA("clave", "Las dos contraseñas no coinciden."),
    ],
  };
}

/**
 * Mantenedor de productos del administrador.
 * @returns {Object} Esquema de validación.
 */
function esquemaProducto() {
  return {
    codigo: [
      reglaRequerido("El código del producto"),
      reglaLargoMinimo(LARGO.CODIGO_PRODUCTO_MIN, "El código del producto"),
    ],
    nombre: [
      reglaRequerido("El nombre"),
      reglaLargoMaximo(LARGO.NOMBRE_PRODUCTO, "El nombre"),
    ],
    descripcion: [
      reglaLargoMaximo(LARGO.DESCRIPCION_PRODUCTO, "La descripción"),
    ],
    precio: [reglaRequerido("El precio"), reglaNumeroNoNegativo("El precio")],
    stock: [reglaRequerido("El stock"), reglaEnteroNoNegativo("El stock")],
    stockCritico: [reglaEnteroNoNegativo("El stock crítico")],
    categoria: [reglaOpcionElegida("una categoría")],
  };
}
