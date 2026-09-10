/* 
   Los 16 productos del caso, con sus códigos, categorías, descripciones y
   precios tal como aparecen en el documento.

   La forma de este arreglo es a propósito la misma que tendrá la base de
   datos: cada producto tiene una lista de tamaños, y cada tamaño su propio
   precio y su propio stock. Cuando exista el backend, este archivo se
   reemplaza por una llamada a la API y NINGUNA otra parte del frontend
   cambia, porque todas leen desde aquí.

   El tamaño marcado con esBase:true es el que trae el precio publicado en
   el caso; los otros dos se derivan (-20% el pequeño, +30% el grande).
   ===================================================================== */

const CATEGORIAS = [
  "Tortas Cuadradas",
  "Tortas Circulares",
  "Postres Individuales",
  "Productos Sin Azúcar",
  "Pastelería Tradicional",
  "Productos Sin Gluten",
  "Productos Vegana",
  "Tortas Especiales",
];

const PRODUCTOS = [
  {
    codigo: "TC001",
    nombre: "Torta Cuadrada de Chocolate",
    categoria: "Tortas Cuadradas",
    descripcion:
      "Deliciosa torta de chocolate con capas de ganache y un toque de avellanas. Personalizable con mensajes especiales.",
    esTorta: true,
    tipoTorta: "Cuadrada",
    permiteMensaje: true,
    imagen: "img/productos/tc001.jpg",
    tamanos: [
      {
        nombre: "Pequeña",
        porciones: 8,
        precio: 36000,
        stock: 10,
        stockCritico: 3,
      },
      {
        nombre: "Mediana",
        porciones: 12,
        precio: 45000,
        stock: 20,
        stockCritico: 5,
        esBase: true,
      },
      {
        nombre: "Grande",
        porciones: 20,
        precio: 58500,
        stock: 10,
        stockCritico: 3,
      },
    ],
  },
  {
    codigo: "TC002",
    nombre: "Torta Cuadrada de Frutas",
    categoria: "Tortas Cuadradas",
    descripcion:
      "Una mezcla de frutas frescas y crema chantilly sobre un suave bizcocho de vainilla, ideal para celebraciones.",
    esTorta: true,
    tipoTorta: "Cuadrada",
    permiteMensaje: true,
    imagen: "img/productos/tc002.jpg",
    tamanos: [
      {
        nombre: "Pequeña",
        porciones: 8,
        precio: 40000,
        stock: 10,
        stockCritico: 3,
      },
      {
        nombre: "Mediana",
        porciones: 12,
        precio: 50000,
        stock: 20,
        stockCritico: 5,
        esBase: true,
      },
      {
        nombre: "Grande",
        porciones: 20,
        precio: 65000,
        stock: 10,
        stockCritico: 3,
      },
    ],
  },
  {
    codigo: "TT001",
    nombre: "Torta Circular de Vainilla",
    categoria: "Tortas Circulares",
    descripcion:
      "Bizcocho de vainilla clásico relleno con crema pastelera y cubierto con un glaseado dulce, perfecto para cualquier ocasión.",
    esTorta: true,
    tipoTorta: "Circular",
    permiteMensaje: true,
    imagen: "img/productos/tt001.jpg",
    tamanos: [
      {
        nombre: "Pequeña",
        porciones: 8,
        precio: 32000,
        stock: 10,
        stockCritico: 3,
      },
      {
        nombre: "Mediana",
        porciones: 12,
        precio: 40000,
        stock: 20,
        stockCritico: 5,
        esBase: true,
      },
      {
        nombre: "Grande",
        porciones: 20,
        precio: 52000,
        stock: 10,
        stockCritico: 3,
      },
    ],
  },
  {
    codigo: "TT002",
    nombre: "Torta Circular de Manjar",
    categoria: "Tortas Circulares",
    descripcion:
      "Torta tradicional chilena con manjar y nueces, un deleite para los amantes de los sabores dulces y clásicos.",
    esTorta: true,
    tipoTorta: "Circular",
    permiteMensaje: true,
    imagen: "img/productos/tt002.jpg",
    tamanos: [
      {
        nombre: "Pequeña",
        porciones: 8,
        precio: 33600,
        stock: 10,
        stockCritico: 3,
      },
      {
        nombre: "Mediana",
        porciones: 12,
        precio: 42000,
        stock: 20,
        stockCritico: 5,
        esBase: true,
      },
      {
        nombre: "Grande",
        porciones: 20,
        precio: 54600,
        stock: 10,
        stockCritico: 3,
      },
    ],
  },
  {
    codigo: "PI001",
    nombre: "Mousse de Chocolate",
    categoria: "Postres Individuales",
    descripcion:
      "Postre individual cremoso y suave, hecho con chocolate de alta calidad, ideal para los amantes del chocolate.",
    esTorta: false,
    tipoTorta: null,
    permiteMensaje: false,
    imagen: "img/productos/pi001.jpg",
    tamanos: [
      {
        nombre: "Individual",
        porciones: 1,
        precio: 5000,
        stock: 20,
        stockCritico: 5,
        esBase: true,
      },
    ],
  },
  {
    codigo: "PI002",
    nombre: "Tiramisú Clásico",
    categoria: "Postres Individuales",
    descripcion:
      "Un postre italiano individual con capas de café, mascarpone y cacao, perfecto para finalizar cualquier comida.",
    esTorta: false,
    tipoTorta: null,
    permiteMensaje: false,
    imagen: "img/productos/pi002.jpg",
    tamanos: [
      {
        nombre: "Individual",
        porciones: 1,
        precio: 5500,
        stock: 20,
        stockCritico: 5,
        esBase: true,
      },
    ],
  },
  {
    codigo: "PSA001",
    nombre: "Torta Sin Azúcar de Naranja",
    categoria: "Productos Sin Azúcar",
    descripcion:
      "Torta ligera y deliciosa, endulzada naturalmente, ideal para quienes buscan opciones más saludables.",
    esTorta: true,
    tipoTorta: null,
    permiteMensaje: true,
    imagen: "img/productos/psa001.jpg",
    tamanos: [
      {
        nombre: "Pequeña",
        porciones: 8,
        precio: 38400,
        stock: 10,
        stockCritico: 3,
      },
      {
        nombre: "Mediana",
        porciones: 12,
        precio: 48000,
        stock: 20,
        stockCritico: 5,
        esBase: true,
      },
      {
        nombre: "Grande",
        porciones: 20,
        precio: 62400,
        stock: 10,
        stockCritico: 3,
      },
    ],
  },
  {
    codigo: "PSA002",
    nombre: "Cheesecake Sin Azúcar",
    categoria: "Productos Sin Azúcar",
    descripcion:
      "Suave y cremoso, este cheesecake es una opción perfecta para disfrutar sin culpa.",
    esTorta: true,
    tipoTorta: null,
    permiteMensaje: true,
    imagen: "img/productos/psa002.jpg",
    tamanos: [
      {
        nombre: "Pequeña",
        porciones: 8,
        precio: 37600,
        stock: 10,
        stockCritico: 3,
      },
      {
        nombre: "Mediana",
        porciones: 12,
        precio: 47000,
        stock: 20,
        stockCritico: 5,
        esBase: true,
      },
      {
        nombre: "Grande",
        porciones: 20,
        precio: 61100,
        stock: 10,
        stockCritico: 3,
      },
    ],
  },
  {
    codigo: "PT001",
    nombre: "Empanada de Manzana",
    categoria: "Pastelería Tradicional",
    descripcion:
      "Pastelería tradicional rellena de manzanas especiadas, perfecta para un dulce desayuno o merienda.",
    esTorta: false,
    tipoTorta: null,
    permiteMensaje: false,
    imagen: "img/productos/pt001.jpg",
    tamanos: [
      {
        nombre: "Individual",
        porciones: 1,
        precio: 3000,
        stock: 20,
        stockCritico: 5,
        esBase: true,
      },
    ],
  },
  {
    codigo: "PT002",
    nombre: "Tarta de Santiago",
    categoria: "Pastelería Tradicional",
    descripcion:
      "Tradicional tarta española hecha con almendras, azúcar y huevos, una delicia para los amantes de los postres clásicos.",
    esTorta: false,
    tipoTorta: null,
    permiteMensaje: false,
    imagen: "img/productos/pt002.jpg",
    tamanos: [
      {
        nombre: "Individual",
        porciones: 1,
        precio: 6000,
        stock: 20,
        stockCritico: 5,
        esBase: true,
      },
    ],
  },
  {
    codigo: "PG001",
    nombre: "Brownie Sin Gluten",
    categoria: "Productos Sin Gluten",
    descripcion:
      "Rico y denso, este brownie es perfecto para quienes necesitan evitar el gluten sin sacrificar el sabor.",
    esTorta: false,
    tipoTorta: null,
    permiteMensaje: false,
    imagen: "img/productos/pg001.jpg",
    tamanos: [
      {
        nombre: "Individual",
        porciones: 1,
        precio: 4000,
        stock: 20,
        stockCritico: 5,
        esBase: true,
      },
    ],
  },
  {
    codigo: "PG002",
    nombre: "Pan Sin Gluten",
    categoria: "Productos Sin Gluten",
    descripcion:
      "Suave y esponjoso, ideal para sándwiches o para acompañar cualquier comida.",
    esTorta: false,
    tipoTorta: null,
    permiteMensaje: false,
    imagen: "img/productos/pg002.jpg",
    tamanos: [
      {
        nombre: "Individual",
        porciones: 1,
        precio: 3500,
        stock: 20,
        stockCritico: 5,
        esBase: true,
      },
    ],
  },
  {
    codigo: "PV001",
    nombre: "Torta Vegana de Chocolate",
    categoria: "Productos Vegana",
    descripcion:
      "Torta de chocolate húmeda y deliciosa, hecha sin productos de origen animal, perfecta para veganos.",
    esTorta: true,
    tipoTorta: null,
    permiteMensaje: true,
    imagen: "img/productos/pv001.jpg",
    tamanos: [
      {
        nombre: "Pequeña",
        porciones: 8,
        precio: 40000,
        stock: 10,
        stockCritico: 3,
      },
      {
        nombre: "Mediana",
        porciones: 12,
        precio: 50000,
        stock: 20,
        stockCritico: 5,
        esBase: true,
      },
      {
        nombre: "Grande",
        porciones: 20,
        precio: 65000,
        stock: 10,
        stockCritico: 3,
      },
    ],
  },
  {
    codigo: "PV002",
    nombre: "Galletas Veganas de Avena",
    categoria: "Productos Vegana",
    descripcion:
      "Crujientes y sabrosas, estas galletas son una excelente opción para un snack saludable y vegano.",
    esTorta: false,
    tipoTorta: null,
    permiteMensaje: false,
    imagen: "img/productos/pv002.jpg",
    tamanos: [
      {
        nombre: "Individual",
        porciones: 1,
        precio: 4500,
        stock: 20,
        stockCritico: 5,
        esBase: true,
      },
    ],
  },
  {
    codigo: "TE001",
    nombre: "Torta Especial de Cumpleaños",
    categoria: "Tortas Especiales",
    descripcion:
      "Diseñada especialmente para celebraciones, personalizable con decoraciones y mensajes únicos.",
    esTorta: true,
    tipoTorta: null,
    permiteMensaje: true,
    imagen: "img/productos/te001.jpg",
    tamanos: [
      {
        nombre: "Pequeña",
        porciones: 8,
        precio: 44000,
        stock: 10,
        stockCritico: 3,
      },
      {
        nombre: "Mediana",
        porciones: 12,
        precio: 55000,
        stock: 20,
        stockCritico: 5,
        esBase: true,
      },
      {
        nombre: "Grande",
        porciones: 20,
        precio: 71500,
        stock: 10,
        stockCritico: 3,
      },
    ],
  },
  {
    codigo: "TE002",
    nombre: "Torta Especial de Boda",
    categoria: "Tortas Especiales",
    descripcion:
      "Elegante y deliciosa, esta torta está diseñada para ser el centro de atención en cualquier boda.",
    esTorta: true,
    tipoTorta: null,
    permiteMensaje: true,
    imagen: "img/productos/te002.jpg",
    tamanos: [
      {
        nombre: "Pequeña",
        porciones: 8,
        precio: 48000,
        stock: 10,
        stockCritico: 3,
      },
      {
        nombre: "Mediana",
        porciones: 12,
        precio: 60000,
        stock: 20,
        stockCritico: 5,
        esBase: true,
      },
      {
        nombre: "Grande",
        porciones: 20,
        precio: 78000,
        stock: 10,
        stockCritico: 3,
      },
    ],
  },
];

/* Códigos que se muestran destacados en la página de inicio.
   Se eligen a mano para que la portada muestre variedad de categorías. */
const CODIGOS_DESTACADOS = [
  "TC001",
  "TT002",
  "TE001",
  "PI002",
  "PV001",
  "PG001",
];

/**
 * Busca un producto por su código. Devuelve undefined si no existe.
 * @param {string} codigo Código del producto, por ejemplo 'TC001'.
 */
function buscarProducto(codigo) {
  if (!codigo) {
    return undefined;
  }
  return PRODUCTOS.find(function (producto) {
    return producto.codigo === codigo.toUpperCase();
  });
}

/**
 * Devuelve el tamaño de referencia de un producto: el que trae el precio
 * publicado en el caso. Si ninguno está marcado, usa el primero.
 * @param {Object} producto Producto del arreglo PRODUCTOS.
 */
function tamanoBase(producto) {
  return (
    producto.tamanos.find(function (tamano) {
      return tamano.esBase === true;
    }) || producto.tamanos[0]
  );
}

/**
 * Precio de referencia de un producto, en pesos.
 * @param {Object} producto Producto del arreglo PRODUCTOS.
 */
function precioBase(producto) {
  return tamanoBase(producto).precio;
}
