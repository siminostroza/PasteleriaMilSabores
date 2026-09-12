/* =====================================================================
   Alimenta el mantenedor de usuarios del administrador. Igual que
   datos/productos.js, la forma de cada objeto es la misma que tendrá la
   tabla usuario de la base de datos, de modo que al conectar el backend
   solo cambie este archivo.

   El RUN se guarda sin puntos ni guion, como pide el enunciado. La base
   de datos lo recibe en cualquier formato y lo normaliza.

   Los tipos de usuario son los tres roles del caso:
     ADMINISTRADOR  acceso total al sistema
     VENDEDOR       solo consulta de productos y de pedidos
     CLIENTE        solo la tienda
   ===================================================================== */

var TIPOS_USUARIO = ["ADMINISTRADOR", "VENDEDOR", "CLIENTE"];

var USUARIOS = [
  {
    run: "190110222",
    nombre: "Simón",
    apellidos: "Inostroza Rivas",
    correo: "admin@duoc.cl",
    fechaNacimiento: "1985-06-15",
    tipoUsuario: "ADMINISTRADOR",
    region: "Metropolitana de Santiago",
    comuna: "Providencia",
    direccion: "Av. Providencia 1234, oficina 52",
    activo: true,
  },
  {
    run: "123456785",
    nombre: "Paula",
    apellidos: "Vergara Soto",
    correo: "vendedor@duoc.cl",
    fechaNacimiento: "1992-09-01",
    tipoUsuario: "VENDEDOR",
    region: "Metropolitana de Santiago",
    comuna: "Ñuñoa",
    direccion: "Irarrázaval 2050, depto. 31",
    activo: true,
  },
  {
    run: "12345674",
    nombre: "Camila",
    apellidos: "Reyes Contreras",
    correo: "camila.reyes@gmail.com",
    fechaNacimiento: "1998-03-20",
    tipoUsuario: "CLIENTE",
    region: "Valparaíso",
    comuna: "Viña del Mar",
    direccion: "5 Norte 620",
    activo: true,
  },
  {
    run: "19000001K",
    nombre: "Diego",
    apellidos: "Muñoz Araya",
    correo: "diego.munoz@duocuc.cl",
    fechaNacimiento: "2001-11-08",
    tipoUsuario: "CLIENTE",
    region: "Metropolitana de Santiago",
    comuna: "Maipú",
    direccion: "Pajaritos 3400, casa 12",
    activo: true,
  },
  {
    run: "111111111",
    nombre: "Rosa",
    apellidos: "González Pérez",
    correo: "rosa.gonzalez@gmail.com",
    fechaNacimiento: "1960-05-10",
    tipoUsuario: "CLIENTE",
    region: "Biobío",
    comuna: "Concepción",
    direccion: "Barros Arana 890",
    activo: true,
  },
  {
    run: "1234560",
    nombre: "Tomás",
    apellidos: "Fuentes Lagos",
    correo: "tomas.fuentes@gmail.com",
    fechaNacimiento: "1995-07-22",
    tipoUsuario: "VENDEDOR",
    region: "Los Lagos",
    comuna: "Puerto Varas",
    direccion: "San José 145",
    activo: false,
  },
];

/**
 * Busca un usuario por su RUN, sin importar el formato en que venga.
 * @param {string} run RUN en cualquier formato.
 * @returns {Object|undefined} Usuario, o undefined si no existe.
 */
function buscarUsuario(run) {
  if (!run) {
    return undefined;
  }

  var buscado = limpiarRun(run);

  return USUARIOS.find(function (usuario) {
    return limpiarRun(usuario.run) === buscado;
  });
}

/**
 * Formatea el RUN para mostrarlo: 190110222 -> 19.011.022-2
 * En el formulario se edita sin puntos, como pide el enunciado, pero en el
 * listado se lee mejor con separadores.
 * @param {string} run RUN en cualquier formato.
 * @returns {string} RUN con puntos y guion.
 */
function runConFormato(run) {
  var limpio = limpiarRun(run);

  if (limpio.length < 2) {
    return limpio;
  }

  var cuerpo = limpio.slice(0, -1);
  var digito = limpio.slice(-1);
  var salida = "";

  for (var i = 0; i < cuerpo.length; i++) {
    salida += cuerpo.charAt(i);

    if ((cuerpo.length - 1 - i) % 3 === 0 && i < cuerpo.length - 1) {
      salida += ".";
    }
  }

  return salida + "-" + digito;
}
