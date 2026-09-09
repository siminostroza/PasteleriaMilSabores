# Especificación de Requisitos de Software (ERS)
## Proyecto: Tienda online "Pastelería 1000 Sabores" — Caso Forma C (DSY1104)

**Estructura basada en:** ISO/IEC/IEEE 29148:2018 (Ingeniería de requisitos)
**Atributos de calidad clasificados según:** ISO/IEC 25010:2011 (Modelo de calidad del producto software)
**Accesibilidad referenciada según:** ISO 9241-171 / WCAG 2.1
**Versión:** 1.0 — Propuesta sujeta a validación del docente

---

## 1. Introducción

### 1.1 Propósito
Este documento especifica los requisitos de la plataforma de comercio electrónico de Pastelería 1000 Sabores. Está dirigido al docente (como cliente/validador), al equipo de desarrollo y a quien realice las pruebas de aceptación.

### 1.2 Alcance
Se construirá una plataforma de e-commerce que permita a los usuarios comprar productos de repostería, personalizar pedidos y acceder a un programa de descuentos basado en edad y promociones especiales.

**Fuera de alcance:** el documento del caso no declara exclusiones. Las siguientes se **proponen** para acotar el trabajo y requieren confirmación explícita del docente antes de considerarse válidas: sistema de gestión logística propio, aplicación móvil nativa, ERP e inventario de bodega. El tratamiento del pago no se declara aquí porque está abierto en PDT-07.

> **Nota del caso:** el enunciado indica que *no todos los requisitos deben realizarse*. La columna "Prioridad" de este documento es una propuesta que debe ser validada por el docente para congelar la línea base.

### 1.3 Definiciones y acrónimos

| Término | Significado |
|---|---|
| RF | Requisito Funcional |
| RNF | Requisito No Funcional |
| RN | Regla de Negocio |
| RI | Requisito de Interfaz |
| RD | Restricción de Diseño |
| CLP | Peso chileno |
| Usuario Senior | Usuario que cumple el criterio de edad de RN-001 (umbral exacto pendiente, ver PDT-08) |
| PDT | Pendiente por definir (*To Be Determined*) |

### 1.4 Convenciones de redacción (ISO/IEC/IEEE 29148, cláusula 5.2)
- **"deberá"** → requisito obligatorio (*shall*).
- **"debería"** → requisito deseable (*should*), no vinculante para la aceptación.
- Cada requisito es **singular** (una sola idea), **verificable** y **trazable** a su origen en el documento del caso.
- Método de verificación: **I** = Inspección, **A** = Análisis, **D** = Demostración, **P** = Prueba.

### 1.5 Prioridad (MoSCoW)
**M** = Must have · **S** = Should have · **C** = Could have · **W** = Won't have (esta versión)

---

## 2. Descripción general

### 2.1 Perspectiva del producto
Sistema web nuevo, autónomo, que reemplaza y moderniza el sistema de ventas online actual de la pastelería con 50 años de trayectoria.

### 2.2 Objetivos de negocio
| ID | Objetivo |
|---|---|
| OBJ-01 | Ofrecer una experiencia de compra moderna y accesible. |
| OBJ-02 | Fidelizar clientes mediante un programa de descuentos por edad y promociones. |
| OBJ-03 | Reforzar la identidad histórica y tradicional de la marca. |
| OBJ-04 | Visibilizar el impacto en la comunidad y en la formación de estudiantes de gastronomía. |

### 2.3 Características de los usuarios

| Perfil | Descripción | Necesidad principal |
|---|---|---|
| Visitante | No registrado | Navegar el catálogo y conocer la marca |
| Cliente registrado | Compra habitual | Comprar, personalizar y seguir pedidos |
| Cliente Senior (50+) | Mayor de 50 años | Acceder al 50% de descuento; interfaz legible |
| Estudiante Duoc | Correo institucional | Torta gratis de cumpleaños |
| Administrador | Personal de la pastelería | Gestionar catálogo y estados de pedidos |

### 2.4 Supuestos y dependencias
- SUP-01: El usuario declara su fecha de nacimiento al registrarse y esta se considera fidedigna.
- SUP-02: La condición de estudiante Duoc se acredita mediante el dominio del correo institucional.
- SUP-03: Los precios están expresados en CLP.
- DEP-01: Disponibilidad de Google Fonts para las tipografías Lato y Pacifico.
- DEP-02: Disponibilidad de las APIs de redes sociales para la función de compartir.

---

## 3. Reglas de negocio

Se separan de los RF porque son políticas comerciales que el sistema debe aplicar, y su cambio no implica cambiar la función sino el parámetro.

| ID | Regla | Origen |
|---|---|---|
| RN-001 | Los usuarios de 50 años o más obtienen un 50% de descuento sobre todos los productos. | Req. Funcionales |
| RN-002 | Los usuarios que se registren con el código `FELICES50` obtienen un 10% de descuento de por vida. | Req. Funcionales |
| RN-003 | Los estudiantes de Duoc registrados con correo institucional reciben una torta gratis el día de su cumpleaños. | Req. Funcionales |
| RN-004 | **PDT-01:** Debe definirse si los descuentos RN-001 y RN-002 son acumulables o si se aplica solo el más favorable. | Ambigüedad detectada |
| RN-005 | **PDT-02:** Debe definirse el alcance de RN-003: producto específico o cualquier torta, y si aplica solo el día exacto del cumpleaños o durante el mes. | Ambigüedad detectada |
| RN-006 | **PDT-03:** Debe definirse si los precios del catálogo incluyen IVA y si el descuento se aplica antes o después del impuesto. | Ambigüedad detectada |

---

## 4. Requisitos funcionales

### 4.1 Registro y autenticación de usuarios

| ID | Requisito | Prioridad | Verif. |
|---|---|---|---|
| RF-001 | El sistema deberá permitir el registro de nuevos usuarios solicitando, como mínimo: nombre completo, correo electrónico, fecha de nacimiento y contraseña. | M | P |
| RF-002 | El sistema deberá validar que el correo electrónico tenga formato válido y que no esté previamente registrado. | M | P |
| RF-003 | El sistema deberá permitir el inicio y cierre de sesión mediante correo y contraseña. | M | P |
| RF-004 | El sistema deberá calcular la edad del usuario a partir de su fecha de nacimiento y asignar automáticamente el beneficio de 50% de descuento cuando la edad alcance el umbral definido en RN-001 (umbral pendiente, ver PDT-08). | M | P |
| RF-005 | El sistema deberá aceptar un campo opcional de código promocional en el formulario de registro y, cuando el valor ingresado sea `FELICES50`, asociar de forma permanente al usuario un descuento del 10% (RN-002). | M | P |
| RF-006 | El sistema deberá identificar como estudiante Duoc a todo usuario cuyo correo pertenezca al dominio institucional y registrar el beneficio de torta gratis de cumpleaños (RN-003). | S | P |
| RF-007 | El sistema deberá mostrar al usuario, tras el registro, los beneficios que le fueron asignados. | S | D |

### 4.2 Gestión de perfiles de usuario

| ID | Requisito | Prioridad | Verif. |
|---|---|---|---|
| RF-008 | El sistema deberá permitir al usuario autenticado visualizar y actualizar su información personal. | M | P |
| RF-009 | El sistema deberá permitir al usuario gestionar sus preferencias de compra (por ejemplo: categorías favoritas, restricciones como sin azúcar, sin gluten o vegano). | S | P |
| RF-010 | El sistema deberá permitir al usuario consultar su historial de pedidos. | S | P |

### 4.3 Visualización del catálogo de productos

| ID | Requisito | Prioridad | Verif. |
|---|---|---|---|
| RF-011 | El sistema deberá mostrar el catálogo de productos organizado en las 8 categorías definidas (Tortas Cuadradas, Tortas Circulares, Postres Individuales, Productos Sin Azúcar, Pastelería Tradicional, Productos Sin Gluten, Productos Veganos, Tortas Especiales). | M | D |
| RF-012 | El sistema deberá mostrar para cada producto: código, categoría, nombre, descripción, precio en CLP e imagen. | M | I |
| RF-013 | El sistema deberá permitir filtrar el catálogo por categoría, por tipo de torta (cuadrada o circular) y por tamaño. | M | P |
| RF-014 | El sistema deberá ofrecer una vista de detalle por producto que incluya la personalización disponible. | M | D |
| RF-015 | El sistema deberá permitir al usuario añadir un mensaje especial personalizado a los productos que admitan personalización, con un máximo de **PDT-04** caracteres. | M | P |
| RF-016 | El sistema deberá mostrar el precio con descuento aplicado cuando el usuario autenticado posea beneficios vigentes, indicando el precio original y el precio final. | M | P |

### 4.4 Carrito de compras

| ID | Requisito | Prioridad | Verif. |
|---|---|---|---|
| RF-017 | El sistema deberá permitir agregar productos al carrito indicando cantidad. | M | P |
| RF-018 | El sistema deberá permitir modificar la cantidad de un producto ya presente en el carrito. | M | P |
| RF-019 | El sistema deberá permitir eliminar productos del carrito. | M | P |
| RF-020 | El sistema deberá mostrar un resumen del carrito con el detalle por línea (producto, cantidad, precio unitario, subtotal), los descuentos aplicados y el total a pagar. | M | P |
| RF-021 | El sistema deberá conservar el contenido del carrito mientras dure la sesión del usuario. | S | P |

### 4.5 Procesamiento y seguimiento de pedidos

| ID | Requisito | Prioridad | Verif. |
|---|---|---|---|
| RF-022 | El sistema deberá permitir confirmar el pedido a partir del contenido del carrito. | M | P |
| RF-023 | El sistema deberá generar una boleta asociada al pedido, con identificador único, fecha, detalle de productos, descuentos aplicados y total. | M | P |
| RF-024 | El sistema deberá registrar y mostrar el estado del pedido en, al menos, los estados: Recibido, En preparación, Despachado y Entregado. | M | D |
| RF-025 | El sistema deberá notificar al usuario cada cambio de estado del pedido. | S | P |

### 4.6 Gestión de envíos

| ID | Requisito | Prioridad | Verif. |
|---|---|---|---|
| RF-026 | El sistema deberá permitir al usuario seleccionar una fecha de entrega preferida durante la confirmación del pedido. | M | P |
| RF-027 | El sistema deberá validar que la fecha de entrega seleccionada respete un plazo mínimo de preparación de **PDT-05** días. | S | P |
| RF-028 | El sistema deberá mostrar el seguimiento del envío, actualizando el estado con una latencia no superior a 60 segundos respecto del cambio registrado en origen. | C | P |

### 4.7 Promoción y difusión

| ID | Requisito | Prioridad | Verif. |
|---|---|---|---|
| RF-029 | El sistema deberá permitir compartir un producto o promoción en redes sociales desde la ficha del producto. | S | D |
| RF-030 | El sistema debería ofrecer una búsqueda avanzada con filtros combinables por nombre, categoría, rango de precio y restricción alimentaria. | S | P |
| RF-031 | El sistema debería incluir una sección de blog y noticias con recetas y consejos de estudiantes de gastronomía de Duoc. | C | I |
| RF-032 | El sistema debería mostrar recomendaciones de productos basadas en el historial de compras y las preferencias del usuario. | C | D |
| RF-033 | El sistema debería incluir una sección que describa la historia y el origen de las recetas tradicionales. | C | I |
| RF-034 | El sistema debería incluir una sección de impacto comunitario que explique cómo las compras apoyan a los estudiantes de gastronomía y a la comunidad local. | C | I |

### 4.8 Administración (requisito derivado)

> No está explícito en el caso, pero RF-011 y RF-024 no son sostenibles sin él. Requiere validación del docente.

| ID | Requisito | Prioridad | Verif. |
|---|---|---|---|
| RF-035 | El sistema deberá permitir a un usuario administrador crear, editar y desactivar productos del catálogo. | S | P |
| RF-036 | El sistema deberá permitir a un usuario administrador actualizar el estado de los pedidos. | S | P |

---

## 5. Requisitos no funcionales (clasificados según ISO/IEC 25010)

### 5.1 Usabilidad

| ID | Requisito | Prioridad | Verif. |
|---|---|---|---|
| RNF-001 | La interfaz deberá reflejar la tradición y la historia de la marca mediante recursos visuales de carácter nostálgico. | M | I |
| RNF-002 | Un usuario nuevo deberá poder completar el flujo de compra (selección, carrito y confirmación) sin instrucciones externas y en un máximo de 5 pasos. | M | D |
| RNF-003 | El sistema deberá presentar mensajes de error claros e indicar la acción correctiva en los formularios de registro, inicio de sesión y compra. | M | I |
| RNF-004 | El sistema deberá cumplir un contraste mínimo de 4.5:1 entre texto y fondo (WCAG 2.1 nivel AA), considerando especialmente al segmento de usuarios mayores de 50 años. | S | A |

### 5.2 Eficiencia de desempeño

| ID | Requisito | Prioridad | Verif. |
|---|---|---|---|
| RNF-005 | Las páginas de catálogo y detalle de producto deberán cargar en un tiempo máximo de 3 segundos con una conexión de 10 Mbps. | S | P |
| RNF-006 | El sistema deberá soportar al menos 100 usuarios concurrentes sin degradación superior al 20% en los tiempos de respuesta. | C | P |

### 5.3 Seguridad

| ID | Requisito | Prioridad | Verif. |
|---|---|---|---|
| RNF-007 | El sistema deberá almacenar las contraseñas cifradas mediante una función de hash con salt; en ningún caso en texto plano. | M | I |
| RNF-008 | El sistema deberá restringir el acceso a los datos del perfil, el historial y las boletas exclusivamente a su usuario propietario y a los administradores. | M | P |
| RNF-009 | El sistema deberá validar y sanitizar toda entrada de usuario para prevenir inyección de código y XSS. | M | P |
| RNF-010 | El tratamiento de datos personales deberá ajustarse a la Ley N° 19.628 sobre protección de la vida privada. | S | I |

### 5.4 Compatibilidad y portabilidad

| ID | Requisito | Prioridad | Verif. |
|---|---|---|---|
| RNF-011 | El sistema deberá operar correctamente en las versiones vigentes de Chrome, Firefox, Edge y Safari. | M | P |
| RNF-012 | La interfaz deberá ser responsiva y adaptarse a resoluciones desde 320 px hasta 1920 px de ancho. | M | D |

### 5.5 Fiabilidad y mantenibilidad

| ID | Requisito | Prioridad | Verif. |
|---|---|---|---|
| RNF-013 | Ante una caída de la conexión durante la confirmación del pedido, el sistema no deberá generar pedidos duplicados. | S | P |
| RNF-014 | El código deberá estar organizado en capas separadas de presentación, lógica de negocio y acceso a datos. | S | I |
| RNF-015 | Los valores de los descuentos (RN-001, RN-002) deberán ser parametrizables sin modificar el código fuente. | C | I |

---

## 6. Restricciones de diseño (interfaz de usuario)

Valores fijados por el cliente en la "Propuesta de Diseño Visual"; no son negociables por el equipo de desarrollo.

| ID | Restricción | Valor |
|---|---|---|
| RD-001 | Color de fondo principal | Crema Pastel `#FFF5E1` |
| RD-002 | Color de acento primario | Rosa Suave `#FFC0CB` |
| RD-003 | Color de acento secundario | Chocolate `#8B4513` |
| RD-004 | Color de texto principal | Marrón Oscuro `#5D4037` |
| RD-005 | Color de texto secundario | Gris Claro `#B0BEC5` |
| RD-006 | Tipografía general | Lato (sans-serif) |
| RD-007 | Tipografía de encabezados | Pacifico (cursiva) |
| RD-008 | Botones y elementos interactivos | Deberán usar RD-002 y RD-003 |

> **Observación de calidad (ISO/IEC 25010 – Usabilidad):** el gris claro `#B0BEC5` sobre el fondo `#FFF5E1` ofrece un contraste aproximado de 1.9:1, insuficiente para cumplir RNF-004. Se recomienda proponer al cliente un tono más oscuro para el texto secundario o restringir su uso a elementos no informativos.

---

## 7. Datos del catálogo (línea base)

| Código | Categoría | Nombre | Precio (CLP) |
|---|---|---|---|
| TC001 | Tortas Cuadradas | Torta Cuadrada de Chocolate | 45.000 |
| TC002 | Tortas Cuadradas | Torta Cuadrada de Frutas | 50.000 |
| TT001 | Tortas Circulares | Torta Circular de Vainilla | 40.000 |
| TT002 | Tortas Circulares | Torta Circular de Manjar | 42.000 |
| PI001 | Postres Individuales | Mousse de Chocolate | 5.000 |
| PI002 | Postres Individuales | Tiramisú Clásico | 5.500 |
| PSA001 | Productos Sin Azúcar | Torta Sin Azúcar de Naranja | 48.000 |
| PSA002 | Productos Sin Azúcar | Cheesecake Sin Azúcar | 47.000 |
| PT001 | Pastelería Tradicional | Empanada de Manzana | 3.000 |
| PT002 | Pastelería Tradicional | Tarta de Santiago | 6.000 |
| PG001 | Productos Sin Gluten | Brownie Sin Gluten | 4.000 |
| PG002 | Productos Sin Gluten | Pan Sin Gluten | 3.500 |
| PV001 | Productos Veganos | Torta Vegana de Chocolate | 50.000 |
| PV002 | Productos Veganos | Galletas Veganas de Avena | 4.500 |
| TE001 | Tortas Especiales | Torta Especial de Cumpleaños | 55.000 |
| TE002 | Tortas Especiales | Torta Especial de Boda | 60.000 |

---

## 8. Matriz de trazabilidad

| Origen en el documento del caso | Requisitos derivados |
|---|---|
| Registro y Autenticación de Usuarios | RF-001 a RF-007, RN-001, RN-002, RN-003 |
| Gestión de Perfiles de Usuario | RF-008, RF-009, RF-010 |
| Visualización de Catálogo de Productos | RF-011 a RF-016 |
| Funcionalidad del Carrito de Compras | RF-017 a RF-021 |
| Procesamiento y Seguimiento de Pedidos | RF-022 a RF-025 |
| Gestión de Envíos | RF-026, RF-027, RF-028 |
| Promoción de Productos / Integración con Redes Sociales | RF-029 |
| Búsqueda Avanzada | RF-030 |
| Contenido Educativo y de Comunidad | RF-031 |
| Recomendaciones personalizadas | RF-032 |
| Origen de productos | RF-033 |
| Sección de Impacto Comunitario | RF-034 |
| Diseño Atractivo e Intuitivo | RNF-001, RNF-002, RD-001 a RD-008 |
| Objetivo "experiencia moderna y accesible" | RNF-004, RNF-005, RNF-011, RNF-012 |
| — (derivado, no explícito en el caso) | RF-035, RF-036, RNF-007 a RNF-010 |

---

## 9. Asuntos pendientes (PDT)

| ID | Asunto | Impacto | Responsable |
|---|---|---|---|
| PDT-01 | ¿Los descuentos RN-001 y RN-002 se acumulan? | Alto — afecta RF-016 y RF-020 | Docente / Cliente |
| PDT-02 | Alcance exacto del beneficio de torta gratis de cumpleaños | Medio — afecta RF-006 | Docente / Cliente |
| PDT-03 | Tratamiento del IVA en los precios publicados | Medio — afecta RF-020, RF-023 | Docente / Cliente |
| PDT-04 | Longitud máxima del mensaje personalizado | Bajo — afecta RF-015 | Equipo |
| PDT-05 | Plazo mínimo de preparación para la fecha de entrega | Bajo — afecta RF-027 | Cliente |
| PDT-06 | Tamaños disponibles por torta y su efecto en el precio | Alto — afecta RF-013 y todo el cálculo de totales | Cliente |
| PDT-07 | Alcance del pago: ¿simulado o pasarela real? | Alto — afecta RF-022 | Docente |
| PDT-08 | El caso dice "mayores de 50 años", que literalmente excluye a quien tiene exactamente 50. ¿El umbral es `edad > 50` o `edad >= 50`? | Alto — el código promocional se llama FELICES50, lo que sugiere `>= 50`, pero es una inferencia | Cliente |

---

## 10. Criterios de verificación de la ERS (ISO/IEC/IEEE 29148, cláusula 5.2.8)

Esta especificación se considera aceptable cuando cumple:

- **Completitud:** todo requisito del enunciado tiene al menos un RF o RNF asociado (ver sección 8).
- **Consistencia:** no existen requisitos contradictorios entre sí.
- **No ambigüedad:** toda ambigüedad detectada quedó registrada como PDT en lugar de resolverse por supuesto tácito.
- **Verificabilidad:** cada requisito tiene asignado un método de verificación (I/A/D/P).
- **Trazabilidad:** cada requisito puede rastrearse hasta su origen en el documento del caso.
- **Priorización:** cada requisito tiene una prioridad MoSCoW propuesta, pendiente de aprobación del docente para congelar la línea base del alcance.

---

## 11. Auditoría de procedencia de los requisitos

Clasificación de cada elemento según su respaldo en el documento del caso (Forma C):

- **E — Explícito:** aparece literalmente en el enunciado, los requerimientos funcionales, los deseos o la propuesta de diseño.
- **D — Derivado:** no aparece literalmente, pero un requisito E no puede funcionar sin él.
- **P — Propuesto:** buena práctica de ingeniería sin respaldo en el caso. **Debe ser aprobado por el docente o eliminado.**

### 11.1 Requisitos explícitos (E)

RN-001, RN-002, RN-003
RF-004, RF-005, RF-006, RF-008, RF-009, RF-011, RF-013, RF-014, RF-015, RF-017, RF-018, RF-019, RF-020, RF-022, RF-023, RF-025, RF-026, RF-028, RF-029, RF-030, RF-031, RF-032, RF-033, RF-034
RNF-001
RD-001 a RD-008
Sección 7 (catálogo completo: 16 productos, códigos, categorías y precios verificados uno a uno contra la tabla original)

### 11.2 Requisitos derivados (D)

| ID | Qué se añadió | Justificación de la derivación |
|---|---|---|
| RF-001 | Los campos "nombre completo" y "contraseña" | El caso pide un sistema de registro pero no enumera los campos. Fecha de nacimiento y correo sí son exigibles (RN-001 y RN-003 dependen de ellos). |
| RF-002 | Validación de formato y unicidad del correo | Sin unicidad, RN-002 y RN-003 son explotables por registro repetido. |
| RF-003 | Inicio y cierre de sesión | La sección del caso se titula "Registro y **Autenticación**". |
| RF-010 | Historial de pedidos visible para el usuario | El caso pide recomendaciones "basadas en el historial de compras", lo que obliga a persistirlo. Mostrarlo es la inferencia. |
| RF-012 | Campo "imagen" del producto | El caso no menciona imágenes en ninguna parte. Se deriva del "diseño atractivo", pero es la derivación más débil de la lista. |
| RF-016 | Mostrar precio original y precio con descuento | El caso pide "precios detallados"; separar ambos valores es interpretación. |
| RF-024 | Los cuatro estados concretos (Recibido, En preparación, Despachado, Entregado) | El caso solo dice "desde la preparación hasta la entrega". Los estados intermedios son propuesta. |
| RF-035, RF-036 | Módulo de administración | El catálogo y los estados de pedido no pueden mantenerse sin él. Ya venía marcado como derivado en la sección 4.8. |
| RNF-004 | El umbral WCAG de 4.5:1 | Deriva de "accesible" (enunciado); el valor numérico y la norma los aporté yo. |
| RNF-007 a RNF-010 | Bloque completo de seguridad y Ley 19.628 | Obligación legal y profesional; el caso no los menciona. Ya venía marcado como derivado en la sección 8. |
| RNF-012 | Diseño responsivo, rango 320–1920 px | Deriva de "accesible"; el rango de resoluciones lo aporté yo. |

### 11.3 Requisitos propuestos sin respaldo (P) — requieren aprobación o eliminación

| ID | Contenido | Observación |
|---|---|---|
| RF-007 | Mostrar los beneficios asignados tras el registro | Mejora de experiencia. Prescindible. |
| RF-021 | Persistencia del carrito durante la sesión | Práctica estándar, pero no pedida. |
| RF-027 | Plazo mínimo de preparación para la fecha de entrega | Restricción de negocio que **yo introduje**. La pastelería no la declaró. |
| RNF-002 | Métrica de "máximo 5 pasos" | El caso pide un diseño intuitivo; el número es mío. |
| RNF-003 | Mensajes de error claros | Práctica estándar, no pedida. |
| RNF-005 | Carga en 3 s con 10 Mbps | Cifra inventada para hacer verificable "moderna". |
| RNF-006 | 100 usuarios concurrentes | Cifra sin ninguna base en el caso. |
| RNF-011 | Compatibilidad con Chrome, Firefox, Edge y Safari | El caso no nombra navegadores. |
| RNF-013 | No duplicar pedidos ante caída de conexión | Práctica estándar, no pedida. |
| RNF-014 | Separación en capas | Restricción de arquitectura, probablemente venga de la asignatura y no del caso. |
| RNF-015 | Descuentos parametrizables | Propuesta de mantenibilidad. |
| §2.3 | Perfil "Administrador" | Coherente con RF-035/036, pero el caso no menciona ningún rol administrativo. |
| RF-028 | Latencia de 60 s para el seguimiento | El "tiempo real" es explícito; los 60 segundos son mi operacionalización. |
| RF-030 | Filtros por rango de precio | El caso pide búsqueda avanzada sin especificar criterios. |

### 11.4 Desviaciones de forma respecto del documento original

| Elemento | En el caso | En esta ERS | Motivo |
|---|---|---|---|
| Categoría | "Productos Vegana" | "Productos Veganos" | Corrección de concordancia. Si el docente exige fidelidad literal al enunciado, debe revertirse. |
| Categoría | "Productos sin gluten" | "Productos Sin Gluten" | Normalización de mayúsculas. |

### 11.5 Verificación de datos

Se contrastaron uno a uno los 16 productos de la sección 7 contra la tabla del documento original: códigos, categorías, nombres y precios coinciden sin excepción. Las 8 categorías coinciden. Los 5 códigos de color y las 2 tipografías coinciden con la Propuesta de Diseño Visual.
