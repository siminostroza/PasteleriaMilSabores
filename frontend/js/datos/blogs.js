/* =====================================================================
   Alimenta el listado de blogs.html. El texto largo de cada entrada NO
   vive aquí: está escrito como HTML en su propia página, porque son
   párrafos, subtítulos y citas, y meterlos en una cadena de JavaScript
   los dejaría fuera del alcance del marcado semántico.

   Aquí va solo lo que necesita la tarjeta del listado: imagen, título y
   descripción corta, que es justo lo que pide el enunciado.

   Para agregar una entrada nueva: un objeto más en este arreglo y su
   página de detalle. El listado la toma sola.
   ===================================================================== */

var BLOGS = [
  {
    enlace: "blog-01.html",
    titulo: "La torta más grande del mundo: cómo fue estar ahí",
    resumen:
      "En 1995 un grupo de pastelerías chilenas batió un récord Guinness. " +
      "Nosotros pusimos el relleno de manjar. Esto es lo que recordamos de " +
      "esa semana.",
    fecha: "2026-08-14",
    autor: "Equipo 1000 Sabores",
    categoria: "Historia",
    minutosLectura: 4,
    imagen: "img/blog/record-guinness.jpg",
    alt: "Pasteleros trabajando sobre una torta de gran tamaño",
  },
  {
    enlace: "blog-02.html",
    titulo: "Por qué el manjar chileno sabe distinto",
    resumen:
      "No es lo mismo que el dulce de leche ni que la cajeta. La diferencia " +
      "está en el tiempo de cocción y en algo que casi nadie menciona: la " +
      "leche con que se empieza.",
    fecha: "2026-07-02",
    autor: "Taller de repostería",
    categoria: "Recetas",
    minutosLectura: 5,
    imagen: "img/blog/manjar.jpg",
    alt: "Olla de cobre con manjar en cocción y una cuchara de madera",
  },
];
