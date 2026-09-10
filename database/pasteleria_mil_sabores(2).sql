/* =====================================================================================
   PASTELERÍA 1000 SABORES  —  MODELO DE BASE DE DATOS
   Motor : Oracle Database 12c o superior (identity columns, columnas virtuales,
           FETCH FIRST n ROWS ONLY)
   Caso  : DSY1104 — Forma C, "Caso Pastelería Mil Sabores" (Duoc UC)

   ------------------------------------------------------------------------------------
   COBERTURA DE LOS REQUERIMIENTOS FUNCIONALES DEL CASO
   ------------------------------------------------------------------------------------
   RF1  Registro y autenticación            -> usuario, rol, trg_usuario_bi,
                                               fn_correo_valido, fn_rut_valido
   RF1a Descuento 50% mayores de 50 años    -> fn_descuento_usuario, trg_pedido_bi
   RF1b Descuento 10% de por vida FELICES50 -> codigo_promocional, fn_descuento_usuario
   RF1c Torta gratis cumpleaños Duoc UC     -> fn_es_correo_duoc, beneficio_cumpleanos,
                                               fn_beneficio_cumpleanos_disponible,
                                               sp_confirmar_pedido
   RF2  Gestión de perfil y preferencias    -> usuario, usuario_direccion,
                                               usuario_preferencia
   RF3  Catálogo, filtro tipo/tamaño        -> categoria, producto, tamanio,
                                               producto_tamanio, vw_catalogo
   RF3a Personalización con mensajes        -> producto.permite_mensaje,
                                               detalle_carrito.mensaje_personalizado
   RF4  Carrito (agregar/editar/eliminar)   -> carrito, detalle_carrito,
                                               sp_agregar_al_carrito,
                                               sp_actualizar_item_carrito,
                                               sp_eliminar_item_carrito, sp_vaciar_carrito
   RF4a Resumen con precios y totales       -> vw_carrito_resumen
   RF5  Confirmación de pedido y boleta     -> pedido, detalle_pedido, boleta,
                                               sp_confirmar_pedido
   RF5a Notificaciones de estado            -> notificacion, historial_estado_pedido,
                                               trg_pedido_ai, trg_pedido_estado_au
   RF6  Envíos, seguimiento y fecha         -> envio, seguimiento_envio,
                                               vw_pedido_seguimiento
   RF7  Compartir en redes sociales         -> publicacion_red_social
   Extra Recomendaciones personalizadas     -> vw_recomendaciones_usuario
   Extra Búsqueda avanzada                  -> ix_producto_nombre_upper, vw_catalogo
   Extra Alerta de stock crítico            -> producto_tamanio.stock_critico,
                                               vw_stock_critico

   ADM1 Roles y control de acceso           -> rol, permiso, rol_permiso,
                                               fn_tiene_permiso, sp_validar_permiso,
                                               vw_rol_permiso, vw_usuario_permiso
   ADM2 Mantenedor de productos             -> sp_guardar_producto, sp_guardar_variante,
                                               sp_eliminar_producto
   ADM3 Mantenedor de usuarios              -> sp_guardar_usuario, sp_eliminar_usuario

   FUERA DE ALCANCE (no son datos transaccionales): paleta de colores, tipografías,
   misión/visión, historia de la marca y blog de contenidos. Son contenido de la capa
   de presentación, no entidades del modelo.

   ------------------------------------------------------------------------------------
   DECISIONES DE DISEÑO (para la defensa)
   ------------------------------------------------------------------------------------
   1. Los descuentos NO se acumulan. El caso no indica acumulación, por lo que se
      aplica el beneficio mayor: 50% por edad tiene prioridad sobre el 10% de
      FELICES50 (ver fn_descuento_usuario). El origen queda registrado en
      pedido.origen_descuento para poder auditar la decisión.
   2. "Mayores de 50 años" se interpreta de forma ESTRICTA: edad > 50. Quien tiene
      exactamente 50 años todavía no accede al 50%. La edad NO se almacena: se
      calcula desde fecha_nacimiento, así el beneficio sigue siendo correcto con el
      paso del tiempo.
   7. Dominios de correo aceptados (fn_correo_valido): duocuc.cl, duoc.cl,
      profesor.duocuc.cl, profesor.duoc.cl y gmail.com. Los cuatro primeros son
      institucionales y habilitan la torta gratis de cumpleaños (fn_es_correo_duoc);
      gmail.com es un correo válido para comprar, pero SIN ese beneficio.
   9. El control de acceso se declara como DATOS, no como código. rol_permiso dice qué
      puede hacer cada rol y todo el sistema hace la misma pregunta: fn_tiene_permiso.
      Mover un acceso de un rol a otro es un INSERT o un DELETE, no reprogramar.
      Y vive en la base, no solo en la pantalla: esconder un botón no es seguridad, así
      que los procedimientos administrativos validan el permiso antes de tocar nada y
      los triggers de carrito y pedido exigen acceso a la tienda. Un CLIENTE no llega
      al mantenedor porque su rol no tiene PANEL_ACCEDER, y un VENDEDOR no crea ni
      edita nada porque solo tiene los permisos de ver.
  10. Las bajas son LÓGICAS (activo = 'N'), nunca DELETE: los pedidos históricos
      referencian productos y usuarios, y borrarlos rompería la trazabilidad.

   8. El RUT se recibe en CUALQUIER formato (12.345.678-5, 12345678-5, 123456785,
      1.23.456-0 e incluso con los puntos mal puestos). La base lo limpia, valida el
      dígito verificador con módulo 11 y lo guarda SIEMPRE en el formato canónico con
      puntos y guion, así la UNIQUE detecta duplicados aunque cada pantalla lo escriba
      distinto (ver fn_rut_limpio / fn_rut_valido / fn_rut_formatear).
   3. El tamaño es una VARIANTE del producto, no un atributo. El caso exige filtrar
      "por diferentes tamaños" y cada tamaño tiene precio y stock propios, por lo que
      se modela producto_tamanio(id_producto, id_tamanio, precio, stock). El carrito y
      el detalle del pedido apuntan a la variante, nunca al producto genérico.
   4. Precio y descuento se CONGELAN en la transacción: detalle_* guarda una copia del
      precio unitario y pedido guarda el porcentaje aplicado. Cambiar el catálogo o la
      edad del cliente después no altera pedidos ya emitidos.
   5. Los procedimientos NO hacen COMMIT. La transacción la controla quien los invoca
      (la aplicación), de modo que confirmar un pedido y registrar su envío puedan ser
      una sola unidad atómica.
   6. usuario.clave almacena SIEMPRE un hash, nunca la clave en texto plano. El hash
      se calcula en la capa de aplicación.
   ===================================================================================== */

SET DEFINE OFF;


-- =====================================================================================
-- 0. LIMPIEZA (opcional). Descomentar solo para reconstruir el esquema desde cero.
-- =====================================================================================
-- DROP VIEW vw_recomendaciones_usuario;
-- DROP VIEW vw_stock_critico;
-- DROP VIEW vw_usuario_permiso;
-- DROP VIEW vw_rol_permiso;
-- DROP VIEW vw_pedido_seguimiento;
-- DROP VIEW vw_carrito_resumen;
-- DROP VIEW vw_usuario_descuento;
-- DROP VIEW vw_catalogo;
-- DROP PROCEDURE sp_eliminar_usuario;
-- DROP PROCEDURE sp_guardar_usuario;
-- DROP PROCEDURE sp_eliminar_producto;
-- DROP PROCEDURE sp_guardar_variante;
-- DROP PROCEDURE sp_guardar_producto;
-- DROP PROCEDURE sp_cambiar_estado_pedido;
-- DROP PROCEDURE sp_registrar_envio;
-- DROP PROCEDURE sp_vaciar_carrito;
-- DROP PROCEDURE sp_eliminar_item_carrito;
-- DROP PROCEDURE sp_actualizar_item_carrito;
-- DROP PROCEDURE sp_agregar_al_carrito;
-- DROP PROCEDURE sp_confirmar_pedido;
-- DROP FUNCTION fn_beneficio_cumpleanos_disponible;
-- DROP FUNCTION fn_origen_descuento;
-- DROP FUNCTION fn_descuento_usuario;
-- DROP FUNCTION fn_calcular_edad;
-- DROP PROCEDURE sp_validar_permiso;
-- DROP FUNCTION fn_tiene_permiso;
-- DROP FUNCTION fn_rol_usuario;
-- DROP FUNCTION fn_es_correo_duoc;
-- DROP FUNCTION fn_correo_valido;
-- DROP FUNCTION fn_rut_formatear;
-- DROP FUNCTION fn_rut_valido;
-- DROP FUNCTION fn_rut_limpio;
-- DROP TABLE publicacion_red_social  CASCADE CONSTRAINTS;
-- DROP TABLE beneficio_cumpleanos    CASCADE CONSTRAINTS;
-- DROP TABLE seguimiento_envio       CASCADE CONSTRAINTS;
-- DROP TABLE envio                   CASCADE CONSTRAINTS;
-- DROP TABLE boleta                  CASCADE CONSTRAINTS;
-- DROP TABLE notificacion            CASCADE CONSTRAINTS;
-- DROP TABLE historial_estado_pedido CASCADE CONSTRAINTS;
-- DROP TABLE detalle_pedido          CASCADE CONSTRAINTS;
-- DROP TABLE pedido                  CASCADE CONSTRAINTS;
-- DROP TABLE estado_pedido           CASCADE CONSTRAINTS;
-- DROP TABLE detalle_carrito         CASCADE CONSTRAINTS;
-- DROP TABLE carrito                 CASCADE CONSTRAINTS;
-- DROP TABLE usuario_preferencia     CASCADE CONSTRAINTS;
-- DROP TABLE usuario_direccion       CASCADE CONSTRAINTS;
-- DROP TABLE usuario                 CASCADE CONSTRAINTS;
-- DROP TABLE codigo_promocional      CASCADE CONSTRAINTS;
-- DROP TABLE rol_permiso             CASCADE CONSTRAINTS;
-- DROP TABLE permiso                 CASCADE CONSTRAINTS;
-- DROP TABLE rol                     CASCADE CONSTRAINTS;
-- DROP TABLE producto_tamanio        CASCADE CONSTRAINTS;
-- DROP TABLE producto                CASCADE CONSTRAINTS;
-- DROP TABLE tamanio                 CASCADE CONSTRAINTS;
-- DROP TABLE categoria               CASCADE CONSTRAINTS;


-- =====================================================================================
-- 1. CATÁLOGO: CATEGORÍA, TAMAÑO, PRODUCTO Y VARIANTES
-- =====================================================================================

CREATE TABLE categoria (
    id_categoria     NUMBER       GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    nombre_categoria VARCHAR2(50) NOT NULL,
    descripcion      VARCHAR2(255),
    activo           CHAR(1)      DEFAULT 'S' NOT NULL,
    CONSTRAINT uq_categoria_nombre UNIQUE (nombre_categoria),
    CONSTRAINT ck_categoria_activo CHECK (activo IN ('S','N'))
);

-- Tamaños disponibles en el catálogo (requerimiento: filtrar por diferentes tamaños)
CREATE TABLE tamanio (
    id_tamanio     NUMBER       GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    nombre_tamanio VARCHAR2(30) NOT NULL,
    porciones      NUMBER(3,0),
    orden          NUMBER(2,0)  DEFAULT 1 NOT NULL,
    CONSTRAINT uq_tamanio_nombre    UNIQUE (nombre_tamanio),
    CONSTRAINT ck_tamanio_porciones CHECK (porciones IS NULL OR porciones > 0)
);

CREATE TABLE producto (
    id_producto     NUMBER        GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    codigo          VARCHAR2(10)  NOT NULL,
    id_categoria    NUMBER        NOT NULL,
    nombre          VARCHAR2(100) NOT NULL,
    descripcion     VARCHAR2(500),
    es_torta        CHAR(1)       DEFAULT 'N' NOT NULL,  -- habilita el beneficio de cumpleaños
    tipo_torta      VARCHAR2(10),                        -- CUADRADA / CIRCULAR / NULL si no aplica
    permite_mensaje CHAR(1)       DEFAULT 'N' NOT NULL,  -- personalización con mensaje especial
    activo          CHAR(1)       DEFAULT 'S' NOT NULL,
    CONSTRAINT uq_producto_codigo     UNIQUE (codigo),
    CONSTRAINT fk_producto_categoria  FOREIGN KEY (id_categoria) REFERENCES categoria (id_categoria),
    CONSTRAINT ck_producto_es_torta   CHECK (es_torta IN ('S','N')),
    CONSTRAINT ck_producto_mensaje    CHECK (permite_mensaje IN ('S','N')),
    CONSTRAINT ck_producto_activo     CHECK (activo IN ('S','N')),
    CONSTRAINT ck_producto_tipo_torta CHECK (tipo_torta IS NULL OR
                                            (tipo_torta IN ('CUADRADA','CIRCULAR') AND es_torta = 'S'))
);

-- Variante vendible: un producto en un tamaño concreto, con su precio y su stock.
CREATE TABLE producto_tamanio (
    id_producto_tamanio NUMBER       GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    id_producto         NUMBER       NOT NULL,
    id_tamanio          NUMBER       NOT NULL,
    precio              NUMBER(10,0) NOT NULL,   -- CLP sin decimales
    stock               NUMBER(6,0)  DEFAULT 0 NOT NULL,
    stock_critico       NUMBER(6,0),             -- opcional: umbral de alerta de reposición
    activo              CHAR(1)      DEFAULT 'S' NOT NULL,
    CONSTRAINT uq_prodtam            UNIQUE (id_producto, id_tamanio),
    CONSTRAINT fk_prodtam_producto   FOREIGN KEY (id_producto) REFERENCES producto (id_producto),
    CONSTRAINT fk_prodtam_tamanio    FOREIGN KEY (id_tamanio)  REFERENCES tamanio (id_tamanio),
    CONSTRAINT ck_prodtam_precio     CHECK (precio >= 0),
    CONSTRAINT ck_prodtam_stock      CHECK (stock  >= 0),
    CONSTRAINT ck_prodtam_stock_crit CHECK (stock_critico IS NULL OR stock_critico >= 0),
    CONSTRAINT ck_prodtam_activo     CHECK (activo IN ('S','N'))
);

CREATE TABLE codigo_promocional (
    id_codigo            NUMBER       GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    codigo               VARCHAR2(30) NOT NULL,
    descripcion          VARCHAR2(200),
    porcentaje_descuento NUMBER(5,2)  NOT NULL,
    vigente              CHAR(1)      DEFAULT 'S' NOT NULL,
    fecha_inicio         DATE         DEFAULT SYSDATE NOT NULL,
    fecha_fin            DATE,                                  -- NULL = sin vencimiento
    CONSTRAINT uq_codigo_promo    UNIQUE (codigo),
    CONSTRAINT ck_codigo_pct      CHECK (porcentaje_descuento BETWEEN 0 AND 100),
    CONSTRAINT ck_codigo_vigente  CHECK (vigente IN ('S','N')),
    CONSTRAINT ck_codigo_fechas   CHECK (fecha_fin IS NULL OR fecha_fin >= fecha_inicio)
);


-- =====================================================================================
-- 2. ROLES Y PERMISOS
--
--    El control de acceso NO se escribe con "IF rol = 'ADMINISTRADOR'" repartido por
--    el código. Se declara como datos en rol_permiso, y todo el sistema pregunta lo
--    mismo: fn_tiene_permiso(usuario, permiso). Agregar un rol o mover un acceso es
--    entonces un INSERT o un DELETE, no un cambio de programa.
-- =====================================================================================

CREATE TABLE rol (
    id_rol      NUMBER       GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    codigo_rol  VARCHAR2(20) NOT NULL,
    nombre_rol  VARCHAR2(50) NOT NULL,
    descripcion VARCHAR2(200),
    CONSTRAINT uq_rol_codigo UNIQUE (codigo_rol),
    CONSTRAINT ck_rol_codigo CHECK (codigo_rol IN ('ADMINISTRADOR','VENDEDOR','CLIENTE'))
);

-- Catálogo de accesos del sistema. Un permiso es una acción concreta, no una pantalla:
-- así la misma regla sirve para la vista, para el backend y para la base de datos.
CREATE TABLE permiso (
    id_permiso     NUMBER        GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    codigo_permiso VARCHAR2(40)  NOT NULL,
    modulo         VARCHAR2(20)  NOT NULL,
    descripcion    VARCHAR2(200) NOT NULL,
    CONSTRAINT uq_permiso_codigo UNIQUE (codigo_permiso),
    CONSTRAINT ck_permiso_modulo CHECK (modulo IN ('TIENDA','PANEL','PRODUCTOS','PEDIDOS','USUARIOS'))
);

CREATE TABLE rol_permiso (
    id_rol     NUMBER NOT NULL,
    id_permiso NUMBER NOT NULL,
    CONSTRAINT pk_rol_permiso     PRIMARY KEY (id_rol, id_permiso),
    CONSTRAINT fk_rolperm_rol     FOREIGN KEY (id_rol)     REFERENCES rol (id_rol)         ON DELETE CASCADE,
    CONSTRAINT fk_rolperm_permiso FOREIGN KEY (id_permiso) REFERENCES permiso (id_permiso) ON DELETE CASCADE
);


-- =====================================================================================
-- 3. USUARIOS, DIRECCIONES Y PREFERENCIAS
--
--    Una sola tabla para las tres clases de persona del sistema. El rol decide qué
--    puede hacer cada una; las columnas propias de la tienda (código promocional,
--    estudiante Duoc) simplemente quedan en NULL o en 'N' para el personal interno.
-- =====================================================================================

CREATE TABLE usuario (
    id_usuario           NUMBER        GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    rut                  VARCHAR2(15),   -- se guarda formateado: 12.345.678-5
    nombres              VARCHAR2(100) NOT NULL,
    apellidos            VARCHAR2(100) NOT NULL,
    fecha_nacimiento     DATE          NOT NULL,  -- base del descuento por edad y del cumpleaños
    correo               VARCHAR2(150) NOT NULL,  -- normalizado a minúsculas por trigger
    clave                VARCHAR2(255) NOT NULL,  -- SIEMPRE un hash
    telefono             VARCHAR2(20),
    fecha_registro       DATE          DEFAULT SYSDATE NOT NULL,
    fecha_actualizacion  DATE,
    id_rol               NUMBER        NOT NULL,  -- si no se indica, trg_usuario_bi asume CLIENTE
    id_codigo_promo      NUMBER,                  -- código usado al registrarse (FELICES50)
    es_estudiante_duoc   CHAR(1)       DEFAULT 'N' NOT NULL,  -- lo deduce el trigger del correo
    acepta_notificaciones CHAR(1)      DEFAULT 'S' NOT NULL,
    activo               CHAR(1)       DEFAULT 'S' NOT NULL,
    CONSTRAINT uq_usuario_rut     UNIQUE (rut),
    CONSTRAINT uq_usuario_correo  UNIQUE (correo),
    CONSTRAINT fk_usuario_rol     FOREIGN KEY (id_rol)          REFERENCES rol (id_rol),
    CONSTRAINT fk_usuario_codigo  FOREIGN KEY (id_codigo_promo) REFERENCES codigo_promocional (id_codigo),
    CONSTRAINT ck_usuario_duoc    CHECK (es_estudiante_duoc IN ('S','N')),
    CONSTRAINT ck_usuario_notif   CHECK (acepta_notificaciones IN ('S','N')),
    CONSTRAINT ck_usuario_activo  CHECK (activo IN ('S','N')),
    CONSTRAINT ck_usuario_correo  CHECK (correo LIKE '%@%.%')
);

-- Direcciones de despacho del cliente (gestión de perfil + envíos)
CREATE TABLE usuario_direccion (
    id_direccion NUMBER        GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    id_usuario   NUMBER        NOT NULL,
    alias        VARCHAR2(40),                 -- 'Casa', 'Trabajo', ...
    calle        VARCHAR2(150) NOT NULL,
    numero       VARCHAR2(20),
    depto        VARCHAR2(20),
    comuna       VARCHAR2(60)  NOT NULL,
    ciudad       VARCHAR2(60)  NOT NULL,
    region       VARCHAR2(60),
    es_principal CHAR(1)       DEFAULT 'N' NOT NULL,
    CONSTRAINT fk_direccion_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    CONSTRAINT ck_direccion_princ   CHECK (es_principal IN ('S','N'))
);

-- Solo una dirección principal por cliente (índice único parcial)
CREATE UNIQUE INDEX ux_direccion_principal
    ON usuario_direccion (CASE WHEN es_principal = 'S' THEN id_usuario END);

-- Preferencias de compra: categorías favoritas, base de las recomendaciones
CREATE TABLE usuario_preferencia (
    id_usuario   NUMBER NOT NULL,
    id_categoria NUMBER NOT NULL,
    CONSTRAINT pk_usuario_preferencia PRIMARY KEY (id_usuario, id_categoria),
    CONSTRAINT fk_pref_usuario   FOREIGN KEY (id_usuario)   REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_pref_categoria FOREIGN KEY (id_categoria) REFERENCES categoria (id_categoria)
);


-- =====================================================================================
-- 4. CARRITO DE COMPRAS
-- =====================================================================================

CREATE TABLE carrito (
    id_carrito     NUMBER       GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    id_usuario     NUMBER       NOT NULL,
    fecha_creacion DATE         DEFAULT SYSDATE NOT NULL,
    estado         VARCHAR2(15) DEFAULT 'ACTIVO' NOT NULL,
    CONSTRAINT fk_carrito_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario),
    CONSTRAINT ck_carrito_estado  CHECK (estado IN ('ACTIVO','CONVERTIDO','ABANDONADO'))
);

-- Un cliente no puede tener dos carritos ACTIVOS al mismo tiempo
CREATE UNIQUE INDEX ux_carrito_activo
    ON carrito (CASE WHEN estado = 'ACTIVO' THEN id_usuario END);

CREATE TABLE detalle_carrito (
    id_detalle_carrito    NUMBER       GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    id_carrito            NUMBER       NOT NULL,
    id_producto_tamanio   NUMBER       NOT NULL,
    cantidad              NUMBER(4,0)  NOT NULL,
    precio_unitario       NUMBER(10,0) NOT NULL,   -- copia del precio al agregar el ítem
    mensaje_personalizado VARCHAR2(200),
    subtotal              NUMBER(12,0) GENERATED ALWAYS AS (cantidad * precio_unitario) VIRTUAL,
    CONSTRAINT fk_detcarrito_carrito FOREIGN KEY (id_carrito) REFERENCES carrito (id_carrito) ON DELETE CASCADE,
    CONSTRAINT fk_detcarrito_prodtam FOREIGN KEY (id_producto_tamanio) REFERENCES producto_tamanio (id_producto_tamanio),
    CONSTRAINT ck_detcarrito_cant    CHECK (cantidad > 0),
    CONSTRAINT ck_detcarrito_precio  CHECK (precio_unitario >= 0)
);


-- =====================================================================================
-- 5. PEDIDOS, TRAZABILIDAD, NOTIFICACIONES Y BOLETA
-- =====================================================================================

CREATE TABLE estado_pedido (
    id_estado     NUMBER       GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    nombre_estado VARCHAR2(30) NOT NULL,
    orden         NUMBER(2,0)  NOT NULL,        -- secuencia natural del flujo
    es_final      CHAR(1)      DEFAULT 'N' NOT NULL,
    CONSTRAINT uq_estado_nombre UNIQUE (nombre_estado),
    CONSTRAINT ck_estado_final  CHECK (es_final IN ('S','N'))
);

CREATE TABLE pedido (
    id_pedido            NUMBER       GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    id_usuario           NUMBER       NOT NULL,
    fecha_pedido         DATE         DEFAULT SYSDATE NOT NULL,
    id_estado            NUMBER       NOT NULL,
    subtotal             NUMBER(12,0) DEFAULT 0 NOT NULL,
    porcentaje_descuento NUMBER(5,2)  DEFAULT 0 NOT NULL,   -- congelado al confirmar
    origen_descuento     VARCHAR2(20) DEFAULT 'SIN_DESCUENTO' NOT NULL,
    monto_descuento      NUMBER(12,0) GENERATED ALWAYS AS (ROUND(subtotal * porcentaje_descuento / 100)) VIRTUAL,
    total                NUMBER(12,0) GENERATED ALWAYS AS (subtotal - ROUND(subtotal * porcentaje_descuento / 100)) VIRTUAL,
    CONSTRAINT fk_pedido_usuario  FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario),
    CONSTRAINT fk_pedido_estado   FOREIGN KEY (id_estado)  REFERENCES estado_pedido (id_estado),
    CONSTRAINT ck_pedido_subtotal CHECK (subtotal >= 0),
    CONSTRAINT ck_pedido_pct      CHECK (porcentaje_descuento BETWEEN 0 AND 100),
    CONSTRAINT ck_pedido_origen   CHECK (origen_descuento IN ('SIN_DESCUENTO','EDAD_MAYOR_50','CODIGO_PROMOCIONAL'))
);

CREATE TABLE detalle_pedido (
    id_detalle_pedido       NUMBER       GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    id_pedido               NUMBER       NOT NULL,
    id_producto_tamanio     NUMBER       NOT NULL,
    cantidad                NUMBER(4,0)  NOT NULL,
    precio_unitario         NUMBER(10,0) NOT NULL,   -- 0 cuando es la torta de cumpleaños
    mensaje_personalizado   VARCHAR2(200),
    es_beneficio_cumpleanos CHAR(1)      DEFAULT 'N' NOT NULL,
    subtotal                NUMBER(12,0) GENERATED ALWAYS AS (cantidad * precio_unitario) VIRTUAL,
    CONSTRAINT fk_detpedido_pedido  FOREIGN KEY (id_pedido) REFERENCES pedido (id_pedido) ON DELETE CASCADE,
    CONSTRAINT fk_detpedido_prodtam FOREIGN KEY (id_producto_tamanio) REFERENCES producto_tamanio (id_producto_tamanio),
    CONSTRAINT ck_detpedido_cant    CHECK (cantidad > 0),
    CONSTRAINT ck_detpedido_precio  CHECK (precio_unitario >= 0),
    CONSTRAINT ck_detpedido_benef   CHECK (es_beneficio_cumpleanos IN ('S','N'))
);

CREATE TABLE historial_estado_pedido (
    id_historial NUMBER        GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    id_pedido    NUMBER        NOT NULL,
    id_estado    NUMBER        NOT NULL,
    fecha_cambio DATE          DEFAULT SYSDATE NOT NULL,
    comentario   VARCHAR2(200),
    CONSTRAINT fk_hist_pedido FOREIGN KEY (id_pedido) REFERENCES pedido (id_pedido) ON DELETE CASCADE,
    CONSTRAINT fk_hist_estado FOREIGN KEY (id_estado) REFERENCES estado_pedido (id_estado)
);

-- Bandeja de notificaciones al cliente ("notificaciones de estado de pedido desde
-- la preparación hasta la entrega"). La generan los triggers de pedido y envío.
CREATE TABLE notificacion (
    id_notificacion NUMBER        GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    id_usuario      NUMBER        NOT NULL,
    id_pedido       NUMBER,
    tipo            VARCHAR2(20)  NOT NULL,
    titulo          VARCHAR2(100) NOT NULL,
    mensaje         VARCHAR2(400) NOT NULL,
    fecha_creacion  DATE          DEFAULT SYSDATE NOT NULL,
    leida           CHAR(1)       DEFAULT 'N' NOT NULL,
    CONSTRAINT fk_notif_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario) ON DELETE CASCADE,
    CONSTRAINT fk_notif_pedido  FOREIGN KEY (id_pedido)  REFERENCES pedido (id_pedido) ON DELETE CASCADE,
    CONSTRAINT ck_notif_tipo    CHECK (tipo IN ('PEDIDO_CREADO','CAMBIO_ESTADO','ENVIO','BENEFICIO')),
    CONSTRAINT ck_notif_leida   CHECK (leida IN ('S','N'))
);

CREATE TABLE boleta (
    id_boleta     NUMBER       GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    id_pedido     NUMBER       NOT NULL,
    folio         VARCHAR2(20) NOT NULL,
    fecha_emision DATE         DEFAULT SYSDATE NOT NULL,
    total         NUMBER(12,0) NOT NULL,
    CONSTRAINT uq_boleta_pedido UNIQUE (id_pedido),
    CONSTRAINT uq_boleta_folio  UNIQUE (folio),
    CONSTRAINT fk_boleta_pedido FOREIGN KEY (id_pedido) REFERENCES pedido (id_pedido),
    CONSTRAINT ck_boleta_total  CHECK (total >= 0)
);


-- =====================================================================================
-- 6. ENVÍOS Y SEGUIMIENTO
-- =====================================================================================

CREATE TABLE envio (
    id_envio                NUMBER        GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    id_pedido               NUMBER        NOT NULL,
    id_direccion            NUMBER,                        -- dirección del perfil usada
    direccion               VARCHAR2(200) NOT NULL,        -- copia congelada al despachar
    comuna                  VARCHAR2(60)  NOT NULL,
    ciudad                  VARCHAR2(60)  NOT NULL,
    region                  VARCHAR2(60),
    costo_envio             NUMBER(10,0)  DEFAULT 0 NOT NULL,
    fecha_entrega_preferida DATE,                          -- la elige el cliente
    fecha_entrega_real      DATE,
    estado_envio            VARCHAR2(20)  DEFAULT 'PENDIENTE' NOT NULL,
    numero_seguimiento      VARCHAR2(30),
    CONSTRAINT uq_envio_pedido      UNIQUE (id_pedido),
    CONSTRAINT uq_envio_seguimiento UNIQUE (numero_seguimiento),
    CONSTRAINT fk_envio_pedido      FOREIGN KEY (id_pedido)    REFERENCES pedido (id_pedido),
    CONSTRAINT fk_envio_direccion   FOREIGN KEY (id_direccion) REFERENCES usuario_direccion (id_direccion),
    CONSTRAINT ck_envio_estado      CHECK (estado_envio IN ('PENDIENTE','EN_CAMINO','ENTREGADO','FALLIDO')),
    CONSTRAINT ck_envio_costo       CHECK (costo_envio >= 0)
);

-- Eventos de trazabilidad del envío (seguimiento "en tiempo real")
CREATE TABLE seguimiento_envio (
    id_seguimiento NUMBER        GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    id_envio       NUMBER        NOT NULL,
    fecha_evento   DATE          DEFAULT SYSDATE NOT NULL,
    estado_envio   VARCHAR2(20)  NOT NULL,
    ubicacion      VARCHAR2(120),
    descripcion    VARCHAR2(200),
    CONSTRAINT fk_seguimiento_envio FOREIGN KEY (id_envio) REFERENCES envio (id_envio) ON DELETE CASCADE,
    CONSTRAINT ck_seguimiento_estado CHECK (estado_envio IN ('PENDIENTE','EN_CAMINO','ENTREGADO','FALLIDO'))
);


-- =====================================================================================
-- 7. BENEFICIO DE CUMPLEAÑOS Y REDES SOCIALES
-- =====================================================================================

-- Control del beneficio "torta gratis de cumpleaños" para estudiantes Duoc UC.
-- La UNIQUE (id_usuario, anio) es la garantía última de "una vez al año".
CREATE TABLE beneficio_cumpleanos (
    id_beneficio NUMBER      GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    id_usuario   NUMBER      NOT NULL,
    anio         NUMBER(4,0) NOT NULL,
    fecha_uso    DATE        DEFAULT SYSDATE NOT NULL,
    id_pedido    NUMBER,
    CONSTRAINT uq_beneficio_usuario_anio UNIQUE (id_usuario, anio),
    CONSTRAINT fk_beneficio_usuario FOREIGN KEY (id_usuario) REFERENCES usuario (id_usuario),
    CONSTRAINT fk_beneficio_pedido  FOREIGN KEY (id_pedido)  REFERENCES pedido (id_pedido)
);

-- Registro de productos/promociones compartidos en redes sociales.
-- El posteo lo hace una API externa; aquí solo se persiste la métrica.
CREATE TABLE publicacion_red_social (
    id_publicacion NUMBER       GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    id_usuario     NUMBER,
    id_producto    NUMBER       NOT NULL,
    red_social     VARCHAR2(20) NOT NULL,
    fecha_compartido DATE       DEFAULT SYSDATE NOT NULL,
    url_compartida VARCHAR2(300),
    CONSTRAINT fk_publicacion_usuario  FOREIGN KEY (id_usuario)  REFERENCES usuario (id_usuario) ON DELETE SET NULL,
    CONSTRAINT fk_publicacion_producto FOREIGN KEY (id_producto) REFERENCES producto (id_producto),
    CONSTRAINT ck_publicacion_red      CHECK (red_social IN ('FACEBOOK','INSTAGRAM','X','WHATSAPP','TIKTOK','PINTEREST'))
);


-- =====================================================================================
-- 8. ÍNDICES DE APOYO (claves foráneas y búsquedas frecuentes)
-- =====================================================================================

CREATE INDEX ix_producto_categoria    ON producto (id_categoria);
CREATE INDEX ix_producto_nombre_upper ON producto (UPPER(nombre));   -- búsqueda avanzada
CREATE INDEX ix_prodtam_producto      ON producto_tamanio (id_producto);
CREATE INDEX ix_prodtam_tamanio       ON producto_tamanio (id_tamanio);
CREATE INDEX ix_usuario_rol           ON usuario (id_rol);
CREATE INDEX ix_usuario_codigo        ON usuario (id_codigo_promo);
CREATE INDEX ix_rolperm_permiso       ON rol_permiso (id_permiso);
CREATE INDEX ix_direccion_usuario     ON usuario_direccion (id_usuario);
CREATE INDEX ix_carrito_usuario       ON carrito (id_usuario);
CREATE INDEX ix_detcarrito_carrito    ON detalle_carrito (id_carrito);
CREATE INDEX ix_detcarrito_prodtam    ON detalle_carrito (id_producto_tamanio);
CREATE INDEX ix_pedido_usuario        ON pedido (id_usuario);
CREATE INDEX ix_pedido_estado         ON pedido (id_estado);
CREATE INDEX ix_detpedido_pedido      ON detalle_pedido (id_pedido);
CREATE INDEX ix_detpedido_prodtam     ON detalle_pedido (id_producto_tamanio);
CREATE INDEX ix_historial_pedido      ON historial_estado_pedido (id_pedido);
CREATE INDEX ix_notif_usuario         ON notificacion (id_usuario, leida);
CREATE INDEX ix_seguimiento_envio     ON seguimiento_envio (id_envio);
CREATE INDEX ix_beneficio_usuario     ON beneficio_cumpleanos (id_usuario);
CREATE INDEX ix_publicacion_producto  ON publicacion_red_social (id_producto);


-- =====================================================================================
-- 9. COMENTARIOS DE DOCUMENTACIÓN
-- =====================================================================================

COMMENT ON TABLE categoria                IS 'Categorías del catálogo definidas en el caso';
COMMENT ON TABLE tamanio                  IS 'Tamaños disponibles para los productos';
COMMENT ON TABLE producto                 IS 'Catálogo de productos de la pastelería';
COMMENT ON TABLE producto_tamanio         IS 'Variante vendible: producto + tamaño, con precio y stock propios';
COMMENT ON TABLE codigo_promocional       IS 'Códigos de descuento de registro (FELICES50)';
COMMENT ON TABLE usuario                  IS 'Personas del sistema: administradores, vendedores y clientes';
COMMENT ON TABLE rol                      IS 'Roles del sistema: Administrador, Vendedor y Cliente';
COMMENT ON TABLE permiso                  IS 'Catálogo de accesos concretos que el sistema sabe controlar';
COMMENT ON TABLE rol_permiso              IS 'Matriz de acceso: qué permisos tiene cada rol';
COMMENT ON TABLE usuario_direccion        IS 'Direcciones de despacho asociadas al perfil del cliente';
COMMENT ON TABLE usuario_preferencia      IS 'Categorías preferidas del cliente, base de las recomendaciones';
COMMENT ON TABLE carrito                  IS 'Carrito de compras vigente o histórico de un cliente';
COMMENT ON TABLE detalle_carrito          IS 'Ítems del carrito, con precio congelado y mensaje personalizado';
COMMENT ON TABLE estado_pedido            IS 'Catálogo de estados del flujo de un pedido';
COMMENT ON TABLE pedido                   IS 'Pedidos confirmados, con descuento congelado y total calculado';
COMMENT ON TABLE detalle_pedido           IS 'Líneas del pedido; precio 0 marca la torta gratis de cumpleaños';
COMMENT ON TABLE historial_estado_pedido  IS 'Trazabilidad de los cambios de estado de un pedido';
COMMENT ON TABLE notificacion             IS 'Notificaciones al cliente sobre su pedido y su envío';
COMMENT ON TABLE boleta                   IS 'Boleta emitida por cada pedido confirmado';
COMMENT ON TABLE envio                    IS 'Datos de despacho, fecha preferida y estado de entrega';
COMMENT ON TABLE seguimiento_envio        IS 'Eventos de seguimiento del envío';
COMMENT ON TABLE beneficio_cumpleanos     IS 'Uso anual de la torta gratis de cumpleaños (estudiantes Duoc UC)';
COMMENT ON TABLE publicacion_red_social   IS 'Registro de productos compartidos en redes sociales';

COMMENT ON COLUMN usuario.clave                   IS 'Hash de la contraseña. Nunca texto plano.';
COMMENT ON COLUMN usuario.id_rol                  IS 'Rol del usuario. Si no se indica al insertar, trg_usuario_bi asume CLIENTE';
COMMENT ON COLUMN usuario.es_estudiante_duoc      IS 'Se deduce del dominio institucional Duoc UC mediante fn_es_correo_duoc';
COMMENT ON COLUMN pedido.porcentaje_descuento     IS 'Descuento congelado al confirmar el pedido';
COMMENT ON COLUMN pedido.origen_descuento         IS 'Regla que originó el descuento: EDAD_MAYOR_50 o CODIGO_PROMOCIONAL';
COMMENT ON COLUMN producto_tamanio.stock_critico  IS 'Umbral de alerta: cuando stock <= stock_critico hay que reponer';
COMMENT ON COLUMN usuario.rut                     IS 'RUT normalizado y formateado por trg_usuario_bi (12.345.678-5)';
COMMENT ON COLUMN detalle_pedido.es_beneficio_cumpleanos IS 'S = línea regalada por el beneficio de cumpleaños Duoc';


-- =====================================================================================
-- 10. DATOS BASE DEL CASO
-- =====================================================================================

-- 10.1 Roles del sistema
INSERT INTO rol (codigo_rol, nombre_rol, descripcion) VALUES
    ('ADMINISTRADOR', 'Administrador', 'Acceso total al sistema: tienda, productos, pedidos y usuarios');
INSERT INTO rol (codigo_rol, nombre_rol, descripcion) VALUES
    ('VENDEDOR', 'Vendedor', 'Solo consulta: listado y detalle de productos y de pedidos');
INSERT INTO rol (codigo_rol, nombre_rol, descripcion) VALUES
    ('CLIENTE', 'Cliente', 'Solo la tienda: catálogo, carrito, pedidos propios y su perfil');

-- 10.2 Catálogo de permisos
INSERT INTO permiso (codigo_permiso, modulo, descripcion) VALUES ('TIENDA_NAVEGAR',        'TIENDA',    'Navegar el catálogo público de la tienda');
INSERT INTO permiso (codigo_permiso, modulo, descripcion) VALUES ('TIENDA_COMPRAR',        'TIENDA',    'Usar el carrito de compras y confirmar pedidos');
INSERT INTO permiso (codigo_permiso, modulo, descripcion) VALUES ('TIENDA_PERFIL',         'TIENDA',    'Gestionar su propio perfil, direcciones y preferencias');
INSERT INTO permiso (codigo_permiso, modulo, descripcion) VALUES ('PANEL_ACCEDER',         'PANEL',     'Entrar al sistema administrativo');
INSERT INTO permiso (codigo_permiso, modulo, descripcion) VALUES ('PRODUCTO_VER',          'PRODUCTOS', 'Ver el listado y el detalle de los productos');
INSERT INTO permiso (codigo_permiso, modulo, descripcion) VALUES ('PRODUCTO_CREAR',        'PRODUCTOS', 'Crear productos y variantes de tamaño');
INSERT INTO permiso (codigo_permiso, modulo, descripcion) VALUES ('PRODUCTO_EDITAR',       'PRODUCTOS', 'Editar productos, precios y stock');
INSERT INTO permiso (codigo_permiso, modulo, descripcion) VALUES ('PRODUCTO_ELIMINAR',     'PRODUCTOS', 'Dar de baja productos del catálogo');
INSERT INTO permiso (codigo_permiso, modulo, descripcion) VALUES ('PEDIDO_VER',            'PEDIDOS',   'Ver el listado y el detalle de las órdenes');
INSERT INTO permiso (codigo_permiso, modulo, descripcion) VALUES ('PEDIDO_CAMBIAR_ESTADO', 'PEDIDOS',   'Avanzar un pedido en su flujo de estados');
INSERT INTO permiso (codigo_permiso, modulo, descripcion) VALUES ('USUARIO_VER',           'USUARIOS',  'Ver el listado y el detalle de los usuarios');
INSERT INTO permiso (codigo_permiso, modulo, descripcion) VALUES ('USUARIO_CREAR',         'USUARIOS',  'Crear usuarios y asignarles rol');
INSERT INTO permiso (codigo_permiso, modulo, descripcion) VALUES ('USUARIO_EDITAR',        'USUARIOS',  'Editar los datos y el rol de un usuario');
INSERT INTO permiso (codigo_permiso, modulo, descripcion) VALUES ('USUARIO_ELIMINAR',      'USUARIOS',  'Dar de baja usuarios del sistema');

-- 10.3 Matriz de acceso: qué puede hacer cada rol.
--      Esta es la tabla que responde la pregunta "¿por qué el vendedor no ve esto?".

-- El administrador tiene acceso total: se le asignan todos los permisos existentes,
-- así cualquier permiso que se agregue a futuro lo incluye automáticamente.
INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM rol r CROSS JOIN permiso p
WHERE r.codigo_rol = 'ADMINISTRADOR';

-- El vendedor solo consulta productos y órdenes. Nada de crear, editar ni eliminar,
-- y nada del módulo de usuarios.
INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM rol r, permiso p
WHERE r.codigo_rol = 'VENDEDOR'
  AND p.codigo_permiso IN ('PANEL_ACCEDER', 'PRODUCTO_VER', 'PEDIDO_VER');

-- El cliente solo accede a la tienda. No recibe PANEL_ACCEDER, por lo que no existe
-- forma de que entre al sistema administrativo.
INSERT INTO rol_permiso (id_rol, id_permiso)
SELECT r.id_rol, p.id_permiso
FROM rol r, permiso p
WHERE r.codigo_rol = 'CLIENTE'
  AND p.codigo_permiso IN ('TIENDA_NAVEGAR', 'TIENDA_COMPRAR', 'TIENDA_PERFIL');

-- 10.4 Categorías (listado textual del caso)
INSERT INTO categoria (nombre_categoria, descripcion) VALUES ('Tortas Cuadradas',       'Tortas en formato cuadrado, ideales para eventos y porciones amplias');
INSERT INTO categoria (nombre_categoria, descripcion) VALUES ('Tortas Circulares',      'Tortas en formato circular, clásicas para toda ocasión');
INSERT INTO categoria (nombre_categoria, descripcion) VALUES ('Postres Individuales',   'Postres en porciones individuales');
INSERT INTO categoria (nombre_categoria, descripcion) VALUES ('Productos Sin Azúcar',   'Productos elaborados sin azúcar añadida');
INSERT INTO categoria (nombre_categoria, descripcion) VALUES ('Pastelería Tradicional', 'Clásicos de la repostería chilena y tradicional');
INSERT INTO categoria (nombre_categoria, descripcion) VALUES ('Productos Sin Gluten',   'Productos aptos para personas con intolerancia al gluten');
INSERT INTO categoria (nombre_categoria, descripcion) VALUES ('Productos Vegana',       'Productos elaborados sin ingredientes de origen animal');
INSERT INTO categoria (nombre_categoria, descripcion) VALUES ('Tortas Especiales',      'Tortas diseñadas para celebraciones como cumpleaños y matrimonios');

-- 10.5 Tamaños
INSERT INTO tamanio (nombre_tamanio, porciones, orden) VALUES ('Individual',  1, 1);
INSERT INTO tamanio (nombre_tamanio, porciones, orden) VALUES ('Pequeña',     8, 2);
INSERT INTO tamanio (nombre_tamanio, porciones, orden) VALUES ('Mediana',    12, 3);
INSERT INTO tamanio (nombre_tamanio, porciones, orden) VALUES ('Grande',     20, 4);

-- 10.6 Productos (los 16 del detalle del caso, con sus descripciones textuales).
--     es_torta = 'S' habilita el beneficio de cumpleaños y el mensaje personalizado.
INSERT INTO producto (codigo, id_categoria, nombre, descripcion, es_torta, tipo_torta, permite_mensaje)
SELECT 'TC001', id_categoria, 'Torta Cuadrada de Chocolate',
       'Deliciosa torta de chocolate con capas de ganache y un toque de avellanas. Personalizable con mensajes especiales.',
       'S', 'CUADRADA', 'S' FROM categoria WHERE nombre_categoria = 'Tortas Cuadradas';

INSERT INTO producto (codigo, id_categoria, nombre, descripcion, es_torta, tipo_torta, permite_mensaje)
SELECT 'TC002', id_categoria, 'Torta Cuadrada de Frutas',
       'Una mezcla de frutas frescas y crema chantilly sobre un suave bizcocho de vainilla, ideal para celebraciones.',
       'S', 'CUADRADA', 'S' FROM categoria WHERE nombre_categoria = 'Tortas Cuadradas';

INSERT INTO producto (codigo, id_categoria, nombre, descripcion, es_torta, tipo_torta, permite_mensaje)
SELECT 'TT001', id_categoria, 'Torta Circular de Vainilla',
       'Bizcocho de vainilla clásico relleno con crema pastelera y cubierto con un glaseado dulce, perfecto para cualquier ocasión.',
       'S', 'CIRCULAR', 'S' FROM categoria WHERE nombre_categoria = 'Tortas Circulares';

INSERT INTO producto (codigo, id_categoria, nombre, descripcion, es_torta, tipo_torta, permite_mensaje)
SELECT 'TT002', id_categoria, 'Torta Circular de Manjar',
       'Torta tradicional chilena con manjar y nueces, un deleite para los amantes de los sabores dulces y clásicos.',
       'S', 'CIRCULAR', 'S' FROM categoria WHERE nombre_categoria = 'Tortas Circulares';

INSERT INTO producto (codigo, id_categoria, nombre, descripcion)
SELECT 'PI001', id_categoria, 'Mousse de Chocolate',
       'Postre individual cremoso y suave, hecho con chocolate de alta calidad, ideal para los amantes del chocolate.'
FROM categoria WHERE nombre_categoria = 'Postres Individuales';

INSERT INTO producto (codigo, id_categoria, nombre, descripcion)
SELECT 'PI002', id_categoria, 'Tiramisú Clásico',
       'Un postre italiano individual con capas de café, mascarpone y cacao, perfecto para finalizar cualquier comida.'
FROM categoria WHERE nombre_categoria = 'Postres Individuales';

INSERT INTO producto (codigo, id_categoria, nombre, descripcion, es_torta, permite_mensaje)
SELECT 'PSA001', id_categoria, 'Torta Sin Azúcar de Naranja',
       'Torta ligera y deliciosa, endulzada naturalmente, ideal para quienes buscan opciones más saludables.',
       'S', 'S' FROM categoria WHERE nombre_categoria = 'Productos Sin Azúcar';

INSERT INTO producto (codigo, id_categoria, nombre, descripcion, es_torta, permite_mensaje)
SELECT 'PSA002', id_categoria, 'Cheesecake Sin Azúcar',
       'Suave y cremoso, este cheesecake es una opción perfecta para disfrutar sin culpa.',
       'S', 'S' FROM categoria WHERE nombre_categoria = 'Productos Sin Azúcar';

INSERT INTO producto (codigo, id_categoria, nombre, descripcion)
SELECT 'PT001', id_categoria, 'Empanada de Manzana',
       'Pastelería tradicional rellena de manzanas especiadas, perfecta para un dulce desayuno o merienda.'
FROM categoria WHERE nombre_categoria = 'Pastelería Tradicional';

INSERT INTO producto (codigo, id_categoria, nombre, descripcion)
SELECT 'PT002', id_categoria, 'Tarta de Santiago',
       'Tradicional tarta española hecha con almendras, azúcar y huevos, una delicia para los amantes de los postres clásicos.'
FROM categoria WHERE nombre_categoria = 'Pastelería Tradicional';

INSERT INTO producto (codigo, id_categoria, nombre, descripcion)
SELECT 'PG001', id_categoria, 'Brownie Sin Gluten',
       'Rico y denso, este brownie es perfecto para quienes necesitan evitar el gluten sin sacrificar el sabor.'
FROM categoria WHERE nombre_categoria = 'Productos Sin Gluten';

INSERT INTO producto (codigo, id_categoria, nombre, descripcion)
SELECT 'PG002', id_categoria, 'Pan Sin Gluten',
       'Suave y esponjoso, ideal para sándwiches o para acompañar cualquier comida.'
FROM categoria WHERE nombre_categoria = 'Productos Sin Gluten';

INSERT INTO producto (codigo, id_categoria, nombre, descripcion, es_torta, permite_mensaje)
SELECT 'PV001', id_categoria, 'Torta Vegana de Chocolate',
       'Torta de chocolate húmeda y deliciosa, hecha sin productos de origen animal, perfecta para veganos.',
       'S', 'S' FROM categoria WHERE nombre_categoria = 'Productos Vegana';

INSERT INTO producto (codigo, id_categoria, nombre, descripcion)
SELECT 'PV002', id_categoria, 'Galletas Veganas de Avena',
       'Crujientes y sabrosas, estas galletas son una excelente opción para un snack saludable y vegano.'
FROM categoria WHERE nombre_categoria = 'Productos Vegana';

INSERT INTO producto (codigo, id_categoria, nombre, descripcion, es_torta, permite_mensaje)
SELECT 'TE001', id_categoria, 'Torta Especial de Cumpleaños',
       'Diseñada especialmente para celebraciones, personalizable con decoraciones y mensajes únicos.',
       'S', 'S' FROM categoria WHERE nombre_categoria = 'Tortas Especiales';

INSERT INTO producto (codigo, id_categoria, nombre, descripcion, es_torta, permite_mensaje)
SELECT 'TE002', id_categoria, 'Torta Especial de Boda',
       'Elegante y deliciosa, esta torta está diseñada para ser el centro de atención en cualquier boda.',
       'S', 'S' FROM categoria WHERE nombre_categoria = 'Tortas Especiales';

-- 10.7 Variantes vendibles.
--     Tamaño de referencia = el precio publicado en el caso.
--     Tortas   -> 'Mediana'     Resto -> 'Individual'
INSERT INTO producto_tamanio (id_producto, id_tamanio, precio, stock, stock_critico)
SELECT p.id_producto,
       (SELECT id_tamanio FROM tamanio
         WHERE nombre_tamanio = CASE WHEN p.es_torta = 'S' THEN 'Mediana' ELSE 'Individual' END),
       x.precio,
       20,
       5
FROM producto p
JOIN (SELECT 'TC001' codigo, 45000 precio FROM DUAL UNION ALL
      SELECT 'TC002',  50000 FROM DUAL UNION ALL
      SELECT 'TT001',  40000 FROM DUAL UNION ALL
      SELECT 'TT002',  42000 FROM DUAL UNION ALL
      SELECT 'PI001',   5000 FROM DUAL UNION ALL
      SELECT 'PI002',   5500 FROM DUAL UNION ALL
      SELECT 'PSA001', 48000 FROM DUAL UNION ALL
      SELECT 'PSA002', 47000 FROM DUAL UNION ALL
      SELECT 'PT001',   3000 FROM DUAL UNION ALL
      SELECT 'PT002',   6000 FROM DUAL UNION ALL
      SELECT 'PG001',   4000 FROM DUAL UNION ALL
      SELECT 'PG002',   3500 FROM DUAL UNION ALL
      SELECT 'PV001',  50000 FROM DUAL UNION ALL
      SELECT 'PV002',   4500 FROM DUAL UNION ALL
      SELECT 'TE001',  55000 FROM DUAL UNION ALL
      SELECT 'TE002',  60000 FROM DUAL) x
  ON x.codigo = p.codigo;

-- Variante Pequeña (-20%) para cada torta, derivada del precio Mediana
INSERT INTO producto_tamanio (id_producto, id_tamanio, precio, stock, stock_critico)
SELECT pt.id_producto,
       (SELECT id_tamanio FROM tamanio WHERE nombre_tamanio = 'Pequeña'),
       ROUND(pt.precio * 0.8, -2),
       10,
       3
FROM producto_tamanio pt
WHERE pt.id_tamanio = (SELECT id_tamanio FROM tamanio WHERE nombre_tamanio = 'Mediana');

-- Variante Grande (+30%) para cada torta, derivada del precio Mediana
INSERT INTO producto_tamanio (id_producto, id_tamanio, precio, stock, stock_critico)
SELECT pt.id_producto,
       (SELECT id_tamanio FROM tamanio WHERE nombre_tamanio = 'Grande'),
       ROUND(pt.precio * 1.3, -2),
       10,
       3
FROM producto_tamanio pt
WHERE pt.id_tamanio = (SELECT id_tamanio FROM tamanio WHERE nombre_tamanio = 'Mediana');

-- 10.8 Código promocional del caso
INSERT INTO codigo_promocional (codigo, descripcion, porcentaje_descuento)
VALUES ('FELICES50', 'Código de bienvenida: 10% de descuento de por vida', 10);

-- 10.9 Estados del flujo de un pedido
INSERT INTO estado_pedido (nombre_estado, orden, es_final) VALUES ('PENDIENTE',        1, 'N');
INSERT INTO estado_pedido (nombre_estado, orden, es_final) VALUES ('EN_PREPARACION',   2, 'N');
INSERT INTO estado_pedido (nombre_estado, orden, es_final) VALUES ('LISTO_PARA_ENVIO', 3, 'N');
INSERT INTO estado_pedido (nombre_estado, orden, es_final) VALUES ('EN_CAMINO',        4, 'N');
INSERT INTO estado_pedido (nombre_estado, orden, es_final) VALUES ('ENTREGADO',        5, 'S');
INSERT INTO estado_pedido (nombre_estado, orden, es_final) VALUES ('CANCELADO',        9, 'S');

COMMIT;


-- =====================================================================================
-- 11. LÓGICA DE NEGOCIO
-- =====================================================================================

-- -------------------------------------------------------------------------------------
-- 11.1 FUNCIONES
-- -------------------------------------------------------------------------------------

-- Código del rol de un usuario. NULL si el usuario no existe.
CREATE OR REPLACE FUNCTION fn_rol_usuario (p_id_usuario IN NUMBER)
RETURN VARCHAR2
IS
    v_codigo rol.codigo_rol%TYPE;
BEGIN
    SELECT r.codigo_rol
      INTO v_codigo
      FROM usuario u
      JOIN rol     r ON r.id_rol = u.id_rol
     WHERE u.id_usuario = p_id_usuario;

    RETURN v_codigo;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN NULL;
END fn_rol_usuario;
/

-- ¿Este usuario puede ejecutar esta acción?
-- Es la ÚNICA pregunta de control de acceso del sistema: no hay ningún otro lugar
-- donde se compare contra el nombre de un rol. Un usuario dado de baja no tiene
-- ningún permiso, aunque su rol sí los tenga.
CREATE OR REPLACE FUNCTION fn_tiene_permiso (
    p_id_usuario     IN NUMBER,
    p_codigo_permiso IN VARCHAR2
) RETURN CHAR
IS
    v_cuantos NUMBER;
BEGIN
    SELECT COUNT(*)
      INTO v_cuantos
      FROM usuario     u
      JOIN rol_permiso rp ON rp.id_rol    = u.id_rol
      JOIN permiso     pe ON pe.id_permiso = rp.id_permiso
     WHERE u.id_usuario      = p_id_usuario
       AND u.activo          = 'S'
       AND pe.codigo_permiso = UPPER(TRIM(p_codigo_permiso));

    RETURN CASE WHEN v_cuantos > 0 THEN 'S' ELSE 'N' END;
END fn_tiene_permiso;
/

-- Deja el RUT en su forma cruda comparable: sin puntos, sin guion, sin espacios y
-- con el dígito verificador en mayúscula. Es la base de la validación y del formato,
-- y hace que dé lo mismo cómo lo escriba cada pantalla:
--   '12.345.678-5', '12345678-5', '12345678 5' y '123456785' llegan todos a '123456785'.
-- También tolera los puntos mal puestos, como '1.23.456-0' -> '1234560'.
CREATE OR REPLACE FUNCTION fn_rut_limpio (p_rut IN VARCHAR2)
RETURN VARCHAR2
IS
BEGIN
    IF p_rut IS NULL THEN
        RETURN NULL;
    END IF;

    RETURN UPPER(REGEXP_REPLACE(p_rut, '[^0-9kK]', ''));
END fn_rut_limpio;
/

-- Valida un RUT chileno con el algoritmo módulo 11, en cualquier formato de entrada.
-- Devuelve 'S' si es válido, o si viene NULL (el RUT es un dato opcional del cliente).
-- Acepta cuerpos de 6 a 8 dígitos, es decir entre 7 y 9 caracteres contando el DV.
CREATE OR REPLACE FUNCTION fn_rut_valido (p_rut IN VARCHAR2)
RETURN CHAR
IS
    v_rut     VARCHAR2(20);
    v_cuerpo  VARCHAR2(20);
    v_dv      CHAR(1);
    v_dv_calc CHAR(1);
    v_suma    NUMBER := 0;
    v_mult    NUMBER := 2;
    v_resto   NUMBER;
BEGIN
    IF p_rut IS NULL THEN
        RETURN 'S';
    END IF;

    v_rut := fn_rut_limpio(p_rut);

    IF v_rut IS NULL OR NOT REGEXP_LIKE(v_rut, '^[0-9]{6,8}[0-9K]$') THEN
        RETURN 'N';
    END IF;

    v_cuerpo := SUBSTR(v_rut, 1, LENGTH(v_rut) - 1);
    v_dv     := SUBSTR(v_rut, -1);

    FOR i IN REVERSE 1 .. LENGTH(v_cuerpo) LOOP
        v_suma := v_suma + TO_NUMBER(SUBSTR(v_cuerpo, i, 1)) * v_mult;
        v_mult := CASE WHEN v_mult = 7 THEN 2 ELSE v_mult + 1 END;
    END LOOP;

    v_resto   := 11 - MOD(v_suma, 11);
    v_dv_calc := CASE v_resto WHEN 11 THEN '0' WHEN 10 THEN 'K' ELSE TO_CHAR(v_resto) END;

    RETURN CASE WHEN v_dv = v_dv_calc THEN 'S' ELSE 'N' END;
END fn_rut_valido;
/

-- Devuelve el RUT en el formato canónico chileno, separando el cuerpo en miles y
-- agregando el guion antes del dígito verificador:
--   '123456785'  -> '12.345.678-5'
--   '1.23.456-0' -> '123.456-0'
-- Es la forma en que se almacena, para que la restricción UNIQUE detecte duplicados
-- aunque el mismo RUT haya sido tecleado de distintas maneras.
CREATE OR REPLACE FUNCTION fn_rut_formatear (p_rut IN VARCHAR2)
RETURN VARCHAR2
IS
    v_rut    VARCHAR2(20);
    v_cuerpo VARCHAR2(20);
    v_dv     CHAR(1);
    v_salida VARCHAR2(20) := '';
    v_largo  NUMBER;
BEGIN
    v_rut := fn_rut_limpio(p_rut);

    IF v_rut IS NULL THEN
        RETURN NULL;
    END IF;

    v_cuerpo := SUBSTR(v_rut, 1, LENGTH(v_rut) - 1);
    v_dv     := SUBSTR(v_rut, -1);
    v_largo  := LENGTH(v_cuerpo);

    FOR i IN 1 .. v_largo LOOP
        v_salida := v_salida || SUBSTR(v_cuerpo, i, 1);

        IF MOD(v_largo - i, 3) = 0 AND i < v_largo THEN
            v_salida := v_salida || '.';
        END IF;
    END LOOP;

    RETURN v_salida || '-' || v_dv;
END fn_rut_formatear;
/


-- Dominios de correo aceptados por el sistema. Los institucionales de Duoc UC se
-- aceptan en sus dos escrituras (duocuc.cl y duoc.cl) y con el prefijo de profesor;
-- gmail.com se acepta como correo personal válido para comprar.
CREATE OR REPLACE FUNCTION fn_correo_valido (p_correo IN VARCHAR2)
RETURN CHAR
IS
    v_correo VARCHAR2(150);
BEGIN
    IF p_correo IS NULL THEN
        RETURN 'N';
    END IF;

    v_correo := LOWER(TRIM(p_correo));

    -- Debe existir un nombre de usuario antes de un único arroba
    IF NOT REGEXP_LIKE(v_correo, '^[a-z0-9._%+-]+@[a-z0-9.-]+$') THEN
        RETURN 'N';
    END IF;

    IF v_correo LIKE '%@duocuc.cl'
       OR v_correo LIKE '%@duoc.cl'
       OR v_correo LIKE '%@profesor.duocuc.cl'
       OR v_correo LIKE '%@profesor.duoc.cl'
       OR v_correo LIKE '%@gmail.com' THEN
        RETURN 'S';
    END IF;

    RETURN 'N';
END fn_correo_valido;
/

-- ¿El correo es institucional de Duoc UC? Esto es lo que habilita la torta gratis de
-- cumpleaños, y por eso se separa de fn_correo_valido: gmail.com es un correo
-- perfectamente válido para comprar, pero NO da derecho al beneficio.
CREATE OR REPLACE FUNCTION fn_es_correo_duoc (p_correo IN VARCHAR2)
RETURN CHAR
IS
    v_correo VARCHAR2(150);
BEGIN
    v_correo := LOWER(TRIM(p_correo));

    IF v_correo LIKE '%@duocuc.cl'
       OR v_correo LIKE '%@duoc.cl'
       OR v_correo LIKE '%@profesor.duocuc.cl'
       OR v_correo LIKE '%@profesor.duoc.cl' THEN
        RETURN 'S';
    END IF;

    RETURN 'N';
END fn_es_correo_duoc;
/

-- Edad en años cumplidos. Se calcula siempre; nunca se almacena, para que el
-- beneficio de "mayores de 50" siga siendo correcto con el paso del tiempo.
CREATE OR REPLACE FUNCTION fn_calcular_edad (p_fecha_nacimiento IN DATE)
RETURN NUMBER
IS
BEGIN
    RETURN FLOOR(MONTHS_BETWEEN(TRUNC(SYSDATE), TRUNC(p_fecha_nacimiento)) / 12);
END fn_calcular_edad;
/

-- Porcentaje de descuento vigente del cliente.
-- Los beneficios NO se acumulan: se aplica el mayor entre el 50% por edad y el
-- porcentaje del código promocional con el que se registró (10% de FELICES50).
-- "Mayor de 50 años" se evalúa de forma estricta (edad > 50): con exactamente 50
-- años cumplidos el cliente todavía no accede al descuento por edad.
CREATE OR REPLACE FUNCTION fn_descuento_usuario (p_id_usuario IN NUMBER)
RETURN NUMBER
IS
    v_edad       NUMBER;
    v_pct_codigo NUMBER;
BEGIN
    SELECT fn_calcular_edad(c.fecha_nacimiento),
           NVL((SELECT cp.porcentaje_descuento
                  FROM codigo_promocional cp
                 WHERE cp.id_codigo = c.id_codigo_promo
                   AND cp.vigente   = 'S'
                   AND TRUNC(SYSDATE) >= TRUNC(cp.fecha_inicio)
                   AND (cp.fecha_fin IS NULL OR TRUNC(SYSDATE) <= TRUNC(cp.fecha_fin))), 0)
      INTO v_edad, v_pct_codigo
      FROM usuario c
     WHERE c.id_usuario = p_id_usuario;

    RETURN GREATEST(CASE WHEN v_edad > 50 THEN 50 ELSE 0 END, v_pct_codigo);
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 0;
END fn_descuento_usuario;
/

-- Regla que originó el descuento del cliente. Se guarda en el pedido para poder
-- justificar después por qué se aplicó ese porcentaje.
CREATE OR REPLACE FUNCTION fn_origen_descuento (p_id_usuario IN NUMBER)
RETURN VARCHAR2
IS
    v_edad NUMBER;
    v_pct  NUMBER;
BEGIN
    SELECT fn_calcular_edad(fecha_nacimiento) INTO v_edad
      FROM usuario WHERE id_usuario = p_id_usuario;

    v_pct := fn_descuento_usuario(p_id_usuario);

    IF v_pct = 0 THEN
        RETURN 'SIN_DESCUENTO';
    ELSIF v_edad > 50 THEN
        RETURN 'EDAD_MAYOR_50';
    ELSE
        RETURN 'CODIGO_PROMOCIONAL';
    END IF;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 'SIN_DESCUENTO';
END fn_origen_descuento;
/

-- ¿Corresponde hoy la torta gratis de cumpleaños?
-- Condiciones: tener rol CLIENTE, ser estudiante Duoc UC (correo institucional), que
-- la fecha de referencia sea su cumpleaños y que no haya usado el beneficio ese año.
-- El rol importa: el administrador tiene todos los permisos, pero la oferta es un
-- beneficio comercial para quien compra, no un acceso del sistema.
-- p_fecha existe para poder operar el beneficio en una fecha dada; por defecto hoy.
CREATE OR REPLACE FUNCTION fn_beneficio_cumpleanos_disponible (
    p_id_usuario IN NUMBER,
    p_fecha      IN DATE DEFAULT SYSDATE
) RETURN CHAR
IS
    v_es_duoc    usuario.es_estudiante_duoc%TYPE;
    v_nacimiento usuario.fecha_nacimiento%TYPE;
    v_rol        rol.codigo_rol%TYPE;
    v_usados     NUMBER;
BEGIN
    SELECT u.es_estudiante_duoc, u.fecha_nacimiento, r.codigo_rol
      INTO v_es_duoc, v_nacimiento, v_rol
      FROM usuario u
      JOIN rol     r ON r.id_rol = u.id_rol
     WHERE u.id_usuario = p_id_usuario
       AND u.activo = 'S';

    IF v_rol <> 'CLIENTE' OR v_es_duoc <> 'S' THEN
        RETURN 'N';
    END IF;

    IF TO_CHAR(v_nacimiento, 'MMDD') <> TO_CHAR(p_fecha, 'MMDD') THEN
        RETURN 'N';
    END IF;

    SELECT COUNT(*) INTO v_usados
      FROM beneficio_cumpleanos
     WHERE id_usuario = p_id_usuario
       AND anio = EXTRACT(YEAR FROM p_fecha);

    RETURN CASE WHEN v_usados = 0 THEN 'S' ELSE 'N' END;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RETURN 'N';
END fn_beneficio_cumpleanos_disponible;
/


-- -------------------------------------------------------------------------------------
-- 11.2 VISTAS
-- -------------------------------------------------------------------------------------

-- Catálogo navegable: una fila por variante vendible. Sobre esta vista se resuelven
-- los filtros por categoría, tipo de torta (cuadrada/circular) y tamaño.
CREATE OR REPLACE VIEW vw_catalogo AS
SELECT p.id_producto,
       pt.id_producto_tamanio,
       p.codigo,
       c.nombre_categoria,
       p.nombre,
       p.descripcion,
       p.es_torta,
       p.tipo_torta,
       p.permite_mensaje,
       t.nombre_tamanio,
       t.porciones,
       pt.precio,
       pt.stock,
       pt.stock_critico,
       CASE WHEN pt.stock > 0 THEN 'S' ELSE 'N' END AS disponible,
       CASE WHEN pt.stock_critico IS NOT NULL AND pt.stock <= pt.stock_critico
            THEN 'S' ELSE 'N' END AS alerta_stock
FROM producto p
JOIN categoria        c  ON c.id_categoria  = p.id_categoria
JOIN producto_tamanio pt ON pt.id_producto  = p.id_producto
JOIN tamanio          t  ON t.id_tamanio    = pt.id_tamanio
WHERE p.activo = 'S' AND pt.activo = 'S' AND c.activo = 'S';

-- Variantes que alcanzaron su stock crítico. Alimenta la alerta de reposición del
-- mantenedor de productos del administrador.
CREATE OR REPLACE VIEW vw_stock_critico AS
SELECT pt.id_producto_tamanio,
       p.codigo,
       p.nombre,
       c.nombre_categoria,
       t.nombre_tamanio,
       pt.stock,
       pt.stock_critico,
       pt.stock_critico - pt.stock AS unidades_bajo_el_umbral
FROM producto_tamanio pt
JOIN producto  p ON p.id_producto  = pt.id_producto
JOIN categoria c ON c.id_categoria = p.id_categoria
JOIN tamanio   t ON t.id_tamanio   = pt.id_tamanio
WHERE pt.activo = 'S'
  AND p.activo  = 'S'
  AND pt.stock_critico IS NOT NULL
  AND pt.stock <= pt.stock_critico
ORDER BY pt.stock - pt.stock_critico, p.codigo;

-- Matriz de acceso legible. Es la respuesta directa a "¿por qué el vendedor no ve
-- esta pantalla?": si la fila no está aquí, el acceso no existe.
CREATE OR REPLACE VIEW vw_rol_permiso AS
SELECT r.codigo_rol,
       r.nombre_rol,
       pe.modulo,
       pe.codigo_permiso,
       pe.descripcion
FROM rol         r
JOIN rol_permiso rp ON rp.id_rol     = r.id_rol
JOIN permiso     pe ON pe.id_permiso = rp.id_permiso;

-- Permisos efectivos de cada usuario activo. La capa web puede consultarla al iniciar
-- sesión para armar el menú mostrando solo lo que esa persona puede abrir.
CREATE OR REPLACE VIEW vw_usuario_permiso AS
SELECT u.id_usuario,
       u.correo,
       u.nombres || ' ' || u.apellidos AS nombre_completo,
       r.codigo_rol,
       pe.modulo,
       pe.codigo_permiso
FROM usuario     u
JOIN rol         r  ON r.id_rol      = u.id_rol
JOIN rol_permiso rp ON rp.id_rol     = r.id_rol
JOIN permiso     pe ON pe.id_permiso = rp.id_permiso
WHERE u.activo = 'S';

-- Edad, descuento vigente y elegibilidad del beneficio de cumpleaños por usuario.
CREATE OR REPLACE VIEW vw_usuario_descuento AS
SELECT u.id_usuario,
       u.nombres || ' ' || u.apellidos                   AS nombre_completo,
       u.correo,
       r.codigo_rol,
       u.es_estudiante_duoc,
       fn_calcular_edad(u.fecha_nacimiento)              AS edad,
       fn_descuento_usuario(u.id_usuario)                AS descuento_pct,
       fn_origen_descuento(u.id_usuario)                 AS origen_descuento,
       fn_beneficio_cumpleanos_disponible(u.id_usuario, SYSDATE) AS torta_cumpleanos_hoy
FROM usuario u
JOIN rol     r ON r.id_rol = u.id_rol
WHERE u.activo = 'S';

-- Resumen del carrito con precios detallados y totales estimados
-- (el descuento definitivo se congela recién al confirmar el pedido).
CREATE OR REPLACE VIEW vw_carrito_resumen AS
SELECT ca.id_carrito,
       ca.id_usuario,
       cl.nombres || ' ' || cl.apellidos                       AS nombre_completo,
       ca.estado,
       ca.fecha_creacion,
       COUNT(dc.id_detalle_carrito)                            AS lineas,
       NVL(SUM(dc.cantidad), 0)                                AS unidades,
       NVL(SUM(dc.subtotal), 0)                                AS subtotal,
       fn_descuento_usuario(ca.id_usuario)                     AS descuento_pct,
       ROUND(NVL(SUM(dc.subtotal), 0) * fn_descuento_usuario(ca.id_usuario) / 100) AS monto_descuento,
       NVL(SUM(dc.subtotal), 0)
         - ROUND(NVL(SUM(dc.subtotal), 0) * fn_descuento_usuario(ca.id_usuario) / 100) AS total_estimado
FROM carrito ca
JOIN usuario cl        ON cl.id_usuario = ca.id_usuario
LEFT JOIN detalle_carrito dc ON dc.id_carrito = ca.id_carrito
GROUP BY ca.id_carrito, ca.id_usuario, cl.nombres, cl.apellidos, ca.estado, ca.fecha_creacion;

-- Estado consolidado de un pedido: estado actual, boleta y último evento del envío.
CREATE OR REPLACE VIEW vw_pedido_seguimiento AS
SELECT pe.id_pedido,
       pe.fecha_pedido,
       cl.id_usuario,
       cl.nombres || ' ' || cl.apellidos AS nombre_completo,
       ep.nombre_estado                  AS estado_pedido,
       ep.orden                          AS orden_estado,
       pe.subtotal,
       pe.porcentaje_descuento,
       pe.monto_descuento,
       pe.total,
       bo.folio,
       en.numero_seguimiento,
       en.estado_envio,
       en.fecha_entrega_preferida,
       en.fecha_entrega_real,
       (SELECT MAX(se.fecha_evento) FROM seguimiento_envio se WHERE se.id_envio = en.id_envio) AS ultimo_evento
FROM pedido pe
JOIN usuario       cl ON cl.id_usuario = pe.id_usuario
JOIN estado_pedido ep ON ep.id_estado  = pe.id_estado
LEFT JOIN boleta   bo ON bo.id_pedido  = pe.id_pedido
LEFT JOIN envio    en ON en.id_pedido  = pe.id_pedido;

-- Recomendaciones personalizadas: productos de las categorías que el cliente marcó
-- como preferidas o de las que ya compró antes.
CREATE OR REPLACE VIEW vw_recomendaciones_usuario AS
SELECT g.id_usuario,
       p.id_producto,
       p.codigo,
       p.nombre,
       c.nombre_categoria,
       MIN(g.origen) AS origen
FROM (SELECT id_usuario, id_categoria, 'PREFERENCIA' AS origen
        FROM usuario_preferencia
      UNION ALL
      SELECT pe.id_usuario, pr.id_categoria, 'HISTORIAL'
        FROM pedido           pe
        JOIN detalle_pedido   dp ON dp.id_pedido           = pe.id_pedido
        JOIN producto_tamanio pt ON pt.id_producto_tamanio = dp.id_producto_tamanio
        JOIN producto         pr ON pr.id_producto         = pt.id_producto) g
JOIN producto  p ON p.id_categoria  = g.id_categoria AND p.activo = 'S'
JOIN categoria c ON c.id_categoria  = p.id_categoria
GROUP BY g.id_usuario, p.id_producto, p.codigo, p.nombre, c.nombre_categoria;


-- -------------------------------------------------------------------------------------
-- 11.3 TRIGGERS
-- -------------------------------------------------------------------------------------

-- Puerta de entrada del cliente: valida el dominio del correo, deduce la condición
-- de estudiante Duoc UC y normaliza el RUT al formato con el que se almacena.
CREATE OR REPLACE TRIGGER trg_usuario_bi
BEFORE INSERT OR UPDATE ON usuario
FOR EACH ROW
BEGIN
    -- Quien se registra solo en la tienda no elige rol: por defecto es CLIENTE.
    -- Asignar ADMINISTRADOR o VENDEDOR es siempre un acto explícito del mantenedor.
    IF :NEW.id_rol IS NULL THEN
        SELECT id_rol INTO :NEW.id_rol FROM rol WHERE codigo_rol = 'CLIENTE';
    END IF;

    :NEW.correo := LOWER(TRIM(:NEW.correo));

    IF fn_correo_valido(:NEW.correo) = 'N' THEN
        RAISE_APPLICATION_ERROR(-20006,
            'Correo no permitido. Solo se aceptan los dominios duocuc.cl, duoc.cl, ' ||
            'profesor.duocuc.cl, profesor.duoc.cl y gmail.com.');
    END IF;

    -- Solo el correo institucional Duoc UC habilita la torta gratis de cumpleaños
    :NEW.es_estudiante_duoc := fn_es_correo_duoc(:NEW.correo);

    IF :NEW.rut IS NOT NULL THEN
        IF fn_rut_valido(:NEW.rut) = 'N' THEN
            RAISE_APPLICATION_ERROR(-20001,
                'El RUT ingresado no es válido. Se acepta en cualquier formato ' ||
                '(12.345.678-5, 12345678-5 o 123456785), pero el dígito verificador debe cuadrar.');
        END IF;

        -- Se recibe en cualquier formato y se almacena siempre igual: 12.345.678-9
        :NEW.rut := fn_rut_formatear(:NEW.rut);
    END IF;

    IF :NEW.fecha_nacimiento >= TRUNC(SYSDATE) THEN
        RAISE_APPLICATION_ERROR(-20002, 'La fecha de nacimiento debe ser anterior a la fecha actual.');
    END IF;

    IF UPDATING THEN
        :NEW.fecha_actualizacion := SYSDATE;
    END IF;
END;
/

-- Solo quien tiene acceso a la tienda puede tener un carrito. Un VENDEDOR no compra
-- desde el sistema: su rol no incluye TIENDA_COMPRAR, así que la base lo rechaza
-- aunque la pantalla se lo permitiera por error.
CREATE OR REPLACE TRIGGER trg_carrito_bi
BEFORE INSERT ON carrito
FOR EACH ROW
BEGIN
    IF fn_tiene_permiso(:NEW.id_usuario, 'TIENDA_COMPRAR') = 'N' THEN
        RAISE_APPLICATION_ERROR(-20053,
            'El usuario no tiene acceso a la tienda (permiso TIENDA_COMPRAR) y no puede abrir un carrito.');
    END IF;
END;
/

-- Congela el descuento del usuario en el pedido y vuelve a exigir el acceso a la
-- tienda, porque un pedido también puede crearse sin pasar por el carrito.
-- monto_descuento y total son columnas virtuales: se recalculan solos.
CREATE OR REPLACE TRIGGER trg_pedido_bi
BEFORE INSERT ON pedido
FOR EACH ROW
BEGIN
    IF fn_tiene_permiso(:NEW.id_usuario, 'TIENDA_COMPRAR') = 'N' THEN
        RAISE_APPLICATION_ERROR(-20053,
            'El usuario no tiene acceso a la tienda (permiso TIENDA_COMPRAR) y no puede generar pedidos.');
    END IF;

    :NEW.porcentaje_descuento := fn_descuento_usuario(:NEW.id_usuario);
    :NEW.origen_descuento     := fn_origen_descuento(:NEW.id_usuario);
END;
/

-- Primer registro de trazabilidad y notificación de pedido recibido.
CREATE OR REPLACE TRIGGER trg_pedido_ai
AFTER INSERT ON pedido
FOR EACH ROW
DECLARE
    v_estado estado_pedido.nombre_estado%TYPE;
    v_notif  usuario.acepta_notificaciones%TYPE;
    v_total  NUMBER;
BEGIN
    INSERT INTO historial_estado_pedido (id_pedido, id_estado, comentario)
    VALUES (:NEW.id_pedido, :NEW.id_estado, 'Pedido generado');

    SELECT nombre_estado INTO v_estado FROM estado_pedido WHERE id_estado = :NEW.id_estado;
    SELECT acepta_notificaciones INTO v_notif FROM usuario WHERE id_usuario = :NEW.id_usuario;

    IF v_notif = 'S' THEN
        v_total := :NEW.subtotal - ROUND(:NEW.subtotal * :NEW.porcentaje_descuento / 100);

        INSERT INTO notificacion (id_usuario, id_pedido, tipo, titulo, mensaje)
        VALUES (:NEW.id_usuario, :NEW.id_pedido, 'PEDIDO_CREADO',
                'Pedido N° ' || :NEW.id_pedido || ' recibido',
                'Recibimos tu pedido por $' || TO_CHAR(v_total) || '. Estado inicial: ' || v_estado || '.');
    END IF;
END;
/

-- Un pedido ENTREGADO o CANCELADO ya no cambia de estado.
CREATE OR REPLACE TRIGGER trg_pedido_estado_bu
BEFORE UPDATE OF id_estado ON pedido
FOR EACH ROW
WHEN (NEW.id_estado <> OLD.id_estado)
DECLARE
    v_es_final estado_pedido.es_final%TYPE;
BEGIN
    SELECT es_final INTO v_es_final FROM estado_pedido WHERE id_estado = :OLD.id_estado;

    IF v_es_final = 'S' THEN
        RAISE_APPLICATION_ERROR(-20003, 'El pedido está en un estado final y no admite nuevos cambios de estado.');
    END IF;
END;
/

-- Trazabilidad y notificación en cada cambio de estado: es lo que sostiene el
-- seguimiento "desde la preparación hasta la entrega" que pide el caso.
CREATE OR REPLACE TRIGGER trg_pedido_estado_au
AFTER UPDATE OF id_estado ON pedido
FOR EACH ROW
WHEN (NEW.id_estado <> OLD.id_estado)
DECLARE
    v_estado estado_pedido.nombre_estado%TYPE;
    v_notif  usuario.acepta_notificaciones%TYPE;
BEGIN
    SELECT nombre_estado INTO v_estado FROM estado_pedido WHERE id_estado = :NEW.id_estado;

    INSERT INTO historial_estado_pedido (id_pedido, id_estado, comentario)
    VALUES (:NEW.id_pedido, :NEW.id_estado, 'Cambio de estado a ' || v_estado);

    SELECT acepta_notificaciones INTO v_notif FROM usuario WHERE id_usuario = :NEW.id_usuario;

    IF v_notif = 'S' THEN
        INSERT INTO notificacion (id_usuario, id_pedido, tipo, titulo, mensaje)
        VALUES (:NEW.id_usuario, :NEW.id_pedido, 'CAMBIO_ESTADO',
                'Tu pedido N° ' || :NEW.id_pedido || ' cambió de estado',
                'El pedido ahora se encuentra en estado ' || v_estado || '.');
    END IF;
END;
/

-- Descuenta el stock de la variante vendida y bloquea la venta sin existencias.
-- Cubre también la corrección de cantidades (devuelve stock si la línea baja).
CREATE OR REPLACE TRIGGER trg_detpedido_stock
AFTER INSERT OR UPDATE OF cantidad ON detalle_pedido
FOR EACH ROW
DECLARE
    v_delta NUMBER;
BEGIN
    IF INSERTING THEN
        v_delta := :NEW.cantidad;
    ELSE
        v_delta := :NEW.cantidad - :OLD.cantidad;
    END IF;

    IF v_delta <> 0 THEN
        UPDATE producto_tamanio
           SET stock = stock - v_delta
         WHERE id_producto_tamanio = :NEW.id_producto_tamanio
           AND stock >= v_delta;

        IF SQL%ROWCOUNT = 0 THEN
            RAISE_APPLICATION_ERROR(-20004, 'Stock insuficiente para el producto y tamaño seleccionados.');
        END IF;
    END IF;
END;
/

-- Valida la fecha de entrega preferida y cierra la fecha real al marcar ENTREGADO.
CREATE OR REPLACE TRIGGER trg_envio_biu
BEFORE INSERT OR UPDATE ON envio
FOR EACH ROW
BEGIN
    IF INSERTING THEN
        IF :NEW.fecha_entrega_preferida IS NOT NULL
           AND TRUNC(:NEW.fecha_entrega_preferida) < TRUNC(SYSDATE) THEN
            RAISE_APPLICATION_ERROR(-20005, 'La fecha de entrega preferida no puede ser anterior a hoy.');
        END IF;
    END IF;

    IF :NEW.estado_envio = 'ENTREGADO' AND :NEW.fecha_entrega_real IS NULL THEN
        :NEW.fecha_entrega_real := SYSDATE;
    END IF;
END;
/

-- Registra el evento de seguimiento y avisa al cliente en cada movimiento del envío.
CREATE OR REPLACE TRIGGER trg_envio_seguimiento_aiu
AFTER INSERT OR UPDATE OF estado_envio ON envio
FOR EACH ROW
DECLARE
    v_id_usuario usuario.id_usuario%TYPE;
    v_notif      usuario.acepta_notificaciones%TYPE;
BEGIN
    INSERT INTO seguimiento_envio (id_envio, estado_envio, ubicacion, descripcion)
    VALUES (:NEW.id_envio, :NEW.estado_envio, :NEW.comuna || ', ' || :NEW.ciudad,
            CASE :NEW.estado_envio
                WHEN 'PENDIENTE' THEN 'Envío registrado, a la espera de despacho'
                WHEN 'EN_CAMINO' THEN 'El pedido salió a reparto'
                WHEN 'ENTREGADO' THEN 'Pedido entregado al cliente'
                ELSE 'Entrega fallida, se reprogramará el despacho'
            END);

    SELECT c.id_usuario, c.acepta_notificaciones
      INTO v_id_usuario, v_notif
      FROM pedido p
      JOIN usuario c ON c.id_usuario = p.id_usuario
     WHERE p.id_pedido = :NEW.id_pedido;

    IF v_notif = 'S' THEN
        INSERT INTO notificacion (id_usuario, id_pedido, tipo, titulo, mensaje)
        VALUES (v_id_usuario, :NEW.id_pedido, 'ENVIO',
                'Actualización de tu envío',
                'Seguimiento ' || NVL(:NEW.numero_seguimiento, 'sin número') ||
                ': estado ' || :NEW.estado_envio || '.');
    END IF;
END;
/


-- -------------------------------------------------------------------------------------
-- 11.4 PROCEDIMIENTOS
--      Ninguno hace COMMIT: la transacción la controla la aplicación que los invoca.
--      Todo procedimiento del área administrativa recibe como primer parámetro el
--      usuario que ejecuta la acción, y lo primero que hace es validar su permiso.
-- -------------------------------------------------------------------------------------

-- Corta la ejecución si el usuario no tiene el permiso pedido. Los mensajes distinguen
-- los tres motivos posibles, para que la pantalla pueda reaccionar distinto a cada uno:
-- usuario inexistente, cuenta dada de baja, o rol sin ese acceso.
CREATE OR REPLACE PROCEDURE sp_validar_permiso (
    p_id_usuario     IN NUMBER,
    p_codigo_permiso IN VARCHAR2
) IS
    v_activo usuario.activo%TYPE;
    v_rol    rol.codigo_rol%TYPE;
BEGIN
    IF fn_tiene_permiso(p_id_usuario, p_codigo_permiso) = 'S' THEN
        RETURN;
    END IF;

    BEGIN
        SELECT u.activo, r.codigo_rol
          INTO v_activo, v_rol
          FROM usuario u
          JOIN rol     r ON r.id_rol = u.id_rol
         WHERE u.id_usuario = p_id_usuario;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20050, 'El usuario que intenta ejecutar la acción no existe.');
    END;

    IF v_activo = 'N' THEN
        RAISE_APPLICATION_ERROR(-20052, 'La cuenta está dada de baja y no puede operar en el sistema.');
    END IF;

    RAISE_APPLICATION_ERROR(-20051,
        'Acceso denegado: el rol ' || v_rol || ' no tiene el permiso ' ||
        UPPER(TRIM(p_codigo_permiso)) || '.');
END sp_validar_permiso;
/

-- Agrega una variante al carrito activo del cliente. Si el cliente no tiene carrito
-- activo, lo crea. Si el mismo ítem ya está con el mismo mensaje, suma la cantidad.
CREATE OR REPLACE PROCEDURE sp_agregar_al_carrito (
    p_id_usuario          IN NUMBER,
    p_id_producto_tamanio IN NUMBER,
    p_cantidad            IN NUMBER   DEFAULT 1,
    p_mensaje             IN VARCHAR2 DEFAULT NULL
) IS
    v_id_carrito carrito.id_carrito%TYPE;
    v_precio     producto_tamanio.precio%TYPE;
    v_stock      producto_tamanio.stock%TYPE;
    v_permite    producto.permite_mensaje%TYPE;
BEGIN
    IF p_cantidad IS NULL OR p_cantidad <= 0 THEN
        RAISE_APPLICATION_ERROR(-20010, 'La cantidad debe ser mayor que cero.');
    END IF;

    BEGIN
        SELECT pt.precio, pt.stock, p.permite_mensaje
          INTO v_precio, v_stock, v_permite
          FROM producto_tamanio pt
          JOIN producto p ON p.id_producto = pt.id_producto
         WHERE pt.id_producto_tamanio = p_id_producto_tamanio
           AND pt.activo = 'S'
           AND p.activo  = 'S';
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20011, 'El producto o tamaño indicado no existe o no está disponible.');
    END;

    IF v_stock < p_cantidad THEN
        RAISE_APPLICATION_ERROR(-20012, 'Stock insuficiente: quedan ' || v_stock || ' unidades.');
    END IF;

    IF p_mensaje IS NOT NULL AND v_permite = 'N' THEN
        RAISE_APPLICATION_ERROR(-20013, 'Este producto no admite mensaje personalizado.');
    END IF;

    BEGIN
        SELECT id_carrito INTO v_id_carrito
          FROM carrito
         WHERE id_usuario = p_id_usuario
           AND estado = 'ACTIVO';
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            INSERT INTO carrito (id_usuario) VALUES (p_id_usuario)
            RETURNING id_carrito INTO v_id_carrito;
    END;

    UPDATE detalle_carrito
       SET cantidad = cantidad + p_cantidad
     WHERE id_carrito = v_id_carrito
       AND id_producto_tamanio = p_id_producto_tamanio
       AND NVL(mensaje_personalizado, '@') = NVL(p_mensaje, '@');

    IF SQL%ROWCOUNT = 0 THEN
        INSERT INTO detalle_carrito (id_carrito, id_producto_tamanio, cantidad, precio_unitario, mensaje_personalizado)
        VALUES (v_id_carrito, p_id_producto_tamanio, p_cantidad, v_precio, p_mensaje);
    END IF;
END sp_agregar_al_carrito;
/

-- Modifica la cantidad de un ítem del carrito. Cantidad 0 elimina la línea.
CREATE OR REPLACE PROCEDURE sp_actualizar_item_carrito (
    p_id_detalle_carrito IN NUMBER,
    p_cantidad           IN NUMBER
) IS
    v_stock producto_tamanio.stock%TYPE;
BEGIN
    IF p_cantidad IS NULL OR p_cantidad < 0 THEN
        RAISE_APPLICATION_ERROR(-20014, 'La cantidad no puede ser negativa.');
    END IF;

    IF p_cantidad = 0 THEN
        DELETE FROM detalle_carrito WHERE id_detalle_carrito = p_id_detalle_carrito;
    ELSE
        BEGIN
            SELECT pt.stock INTO v_stock
              FROM detalle_carrito dc
              JOIN producto_tamanio pt ON pt.id_producto_tamanio = dc.id_producto_tamanio
             WHERE dc.id_detalle_carrito = p_id_detalle_carrito;
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                RAISE_APPLICATION_ERROR(-20015, 'El ítem indicado no existe en ningún carrito.');
        END;

        IF v_stock < p_cantidad THEN
            RAISE_APPLICATION_ERROR(-20012, 'Stock insuficiente: quedan ' || v_stock || ' unidades.');
        END IF;

        UPDATE detalle_carrito
           SET cantidad = p_cantidad
         WHERE id_detalle_carrito = p_id_detalle_carrito;
    END IF;
END sp_actualizar_item_carrito;
/

CREATE OR REPLACE PROCEDURE sp_eliminar_item_carrito (
    p_id_detalle_carrito IN NUMBER
) IS
BEGIN
    DELETE FROM detalle_carrito WHERE id_detalle_carrito = p_id_detalle_carrito;

    IF SQL%ROWCOUNT = 0 THEN
        RAISE_APPLICATION_ERROR(-20015, 'El ítem indicado no existe en ningún carrito.');
    END IF;
END sp_eliminar_item_carrito;
/

CREATE OR REPLACE PROCEDURE sp_vaciar_carrito (
    p_id_carrito IN NUMBER
) IS
BEGIN
    DELETE FROM detalle_carrito WHERE id_carrito = p_id_carrito;
END sp_vaciar_carrito;
/

-- Convierte un carrito ACTIVO en pedido confirmado:
--   1. Valida que el carrito exista y tenga contenido.
--   2. Si corresponde, aplica la torta gratis de cumpleaños (una unidad a precio 0
--      sobre la torta más cara del carrito) y registra el uso anual del beneficio.
--   3. Crea el pedido (el trigger congela el % de descuento del cliente).
--   4. Copia las líneas, descuenta stock (trigger) y emite la boleta con folio.
--   5. Marca el carrito como CONVERTIDO.
CREATE OR REPLACE PROCEDURE sp_confirmar_pedido (
    p_id_carrito IN  NUMBER,
    p_id_pedido  OUT NUMBER
) IS
    v_id_usuario     carrito.id_usuario%TYPE;
    v_subtotal       NUMBER(12,0);
    v_id_estado      estado_pedido.id_estado%TYPE;
    v_det_beneficio  detalle_carrito.id_detalle_carrito%TYPE := NULL;
    v_precio_regalo  NUMBER(10,0) := 0;
BEGIN
    BEGIN
        SELECT id_usuario INTO v_id_usuario
          FROM carrito
         WHERE id_carrito = p_id_carrito
           AND estado = 'ACTIVO';
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20020, 'No existe un carrito ACTIVO con el id indicado.');
    END;

    SELECT NVL(SUM(subtotal), 0) INTO v_subtotal
      FROM detalle_carrito
     WHERE id_carrito = p_id_carrito;

    IF v_subtotal = 0 THEN
        RAISE_APPLICATION_ERROR(-20021, 'El carrito está vacío: no se puede confirmar el pedido.');
    END IF;

    -- Torta gratis de cumpleaños para estudiantes Duoc UC: se regala una unidad de
    -- la torta más cara del carrito. Si el carrito no lleva tortas, no aplica.
    IF fn_beneficio_cumpleanos_disponible(v_id_usuario) = 'S' THEN
        BEGIN
            SELECT dc.id_detalle_carrito, dc.precio_unitario
              INTO v_det_beneficio, v_precio_regalo
              FROM detalle_carrito   dc
              JOIN producto_tamanio  pt ON pt.id_producto_tamanio = dc.id_producto_tamanio
              JOIN producto          p  ON p.id_producto          = pt.id_producto
             WHERE dc.id_carrito = p_id_carrito
               AND p.es_torta = 'S'
             ORDER BY dc.precio_unitario DESC, dc.id_detalle_carrito
             FETCH FIRST 1 ROW ONLY;
        EXCEPTION
            WHEN NO_DATA_FOUND THEN
                v_det_beneficio := NULL;
                v_precio_regalo := 0;
        END;
    END IF;

    v_subtotal := v_subtotal - v_precio_regalo;

    SELECT id_estado INTO v_id_estado
      FROM estado_pedido
     WHERE nombre_estado = 'PENDIENTE';

    INSERT INTO pedido (id_usuario, id_estado, subtotal)
    VALUES (v_id_usuario, v_id_estado, v_subtotal)
    RETURNING id_pedido INTO p_id_pedido;

    FOR r IN (SELECT id_detalle_carrito, id_producto_tamanio, cantidad,
                     precio_unitario, mensaje_personalizado
                FROM detalle_carrito
               WHERE id_carrito = p_id_carrito
               ORDER BY id_detalle_carrito) LOOP

        IF v_det_beneficio IS NOT NULL AND r.id_detalle_carrito = v_det_beneficio THEN
            IF r.cantidad > 1 THEN
                INSERT INTO detalle_pedido (id_pedido, id_producto_tamanio, cantidad,
                                            precio_unitario, mensaje_personalizado)
                VALUES (p_id_pedido, r.id_producto_tamanio, r.cantidad - 1,
                        r.precio_unitario, r.mensaje_personalizado);
            END IF;

            INSERT INTO detalle_pedido (id_pedido, id_producto_tamanio, cantidad,
                                        precio_unitario, mensaje_personalizado,
                                        es_beneficio_cumpleanos)
            VALUES (p_id_pedido, r.id_producto_tamanio, 1, 0,
                    r.mensaje_personalizado, 'S');
        ELSE
            INSERT INTO detalle_pedido (id_pedido, id_producto_tamanio, cantidad,
                                        precio_unitario, mensaje_personalizado)
            VALUES (p_id_pedido, r.id_producto_tamanio, r.cantidad,
                    r.precio_unitario, r.mensaje_personalizado);
        END IF;
    END LOOP;

    IF v_det_beneficio IS NOT NULL THEN
        BEGIN
            INSERT INTO beneficio_cumpleanos (id_usuario, anio, id_pedido)
            VALUES (v_id_usuario, EXTRACT(YEAR FROM SYSDATE), p_id_pedido);
        EXCEPTION
            WHEN DUP_VAL_ON_INDEX THEN
                RAISE_APPLICATION_ERROR(-20022, 'El cliente ya utilizó su torta de cumpleaños este año.');
        END;

        INSERT INTO notificacion (id_usuario, id_pedido, tipo, titulo, mensaje)
        SELECT id_usuario, p_id_pedido, 'BENEFICIO',
               '¡Feliz cumpleaños! Tu torta va de regalo',
               'Aplicamos tu beneficio Duoc UC: una torta sin costo en el pedido N° ' || p_id_pedido || '.'
          FROM usuario
         WHERE id_usuario = v_id_usuario
           AND acepta_notificaciones = 'S';
    END IF;

    INSERT INTO boleta (id_pedido, folio, total)
    SELECT id_pedido, 'BOL-' || LPAD(id_pedido, 8, '0'), total
      FROM pedido
     WHERE id_pedido = p_id_pedido;

    UPDATE carrito SET estado = 'CONVERTIDO' WHERE id_carrito = p_id_carrito;
END sp_confirmar_pedido;
/

-- Registra el despacho de un pedido tomando una dirección del perfil del cliente y
-- congelando sus datos. La fecha de entrega preferida la elige el cliente.
CREATE OR REPLACE PROCEDURE sp_registrar_envio (
    p_id_pedido              IN  NUMBER,
    p_id_direccion           IN  NUMBER,
    p_fecha_entrega_preferida IN DATE   DEFAULT NULL,
    p_costo_envio            IN  NUMBER DEFAULT 0,
    p_id_envio               OUT NUMBER
) IS
    v_id_usuario pedido.id_usuario%TYPE;
    v_dir        usuario_direccion%ROWTYPE;
BEGIN
    BEGIN
        SELECT id_usuario INTO v_id_usuario FROM pedido WHERE id_pedido = p_id_pedido;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20030, 'El pedido indicado no existe.');
    END;

    BEGIN
        SELECT * INTO v_dir
          FROM usuario_direccion
         WHERE id_direccion = p_id_direccion
           AND id_usuario   = v_id_usuario;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20031, 'La dirección no existe o no pertenece al cliente del pedido.');
    END;

    INSERT INTO envio (id_pedido, id_direccion, direccion, comuna, ciudad, region,
                       costo_envio, fecha_entrega_preferida, numero_seguimiento)
    VALUES (p_id_pedido, v_dir.id_direccion,
            TRIM(v_dir.calle || ' ' || v_dir.numero ||
                 CASE WHEN v_dir.depto IS NOT NULL THEN ', depto. ' || v_dir.depto END),
            v_dir.comuna, v_dir.ciudad, v_dir.region,
            NVL(p_costo_envio, 0), p_fecha_entrega_preferida,
            'TRK-' || LPAD(p_id_pedido, 8, '0'))
    RETURNING id_envio INTO p_id_envio;
EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
        RAISE_APPLICATION_ERROR(-20032, 'El pedido ya tiene un envío registrado.');
END sp_registrar_envio;
/

-- Avanza el pedido en su flujo de estados. El historial y la notificación al
-- cliente los generan los triggers de la tabla pedido.
-- Según el caso, mover una orden es atribución del administrador: el vendedor puede
-- ver el listado y el detalle (PEDIDO_VER), pero no cambiar su estado.
CREATE OR REPLACE PROCEDURE sp_cambiar_estado_pedido (
    p_id_usuario    IN NUMBER,
    p_id_pedido     IN NUMBER,
    p_nombre_estado IN VARCHAR2
) IS
    v_id_estado estado_pedido.id_estado%TYPE;
BEGIN
    sp_validar_permiso(p_id_usuario, 'PEDIDO_CAMBIAR_ESTADO');

    BEGIN
        SELECT id_estado INTO v_id_estado
          FROM estado_pedido
         WHERE nombre_estado = UPPER(p_nombre_estado);
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20040, 'El estado indicado no existe en el catálogo de estados.');
    END;

    UPDATE pedido SET id_estado = v_id_estado WHERE id_pedido = p_id_pedido;

    IF SQL%ROWCOUNT = 0 THEN
        RAISE_APPLICATION_ERROR(-20030, 'El pedido indicado no existe.');
    END IF;
END sp_cambiar_estado_pedido;
/


-- -------------------------------------------------------------------------------------
-- 11.5 MANTENEDORES DEL ÁREA ADMINISTRATIVA
--      Un mismo procedimiento crea y edita: si el id llega en NULL es alta, si llega
--      con valor es modificación. Cada rama exige su propio permiso, de modo que un
--      rol puede tener permitido ver y crear pero no editar.
-- -------------------------------------------------------------------------------------

CREATE OR REPLACE PROCEDURE sp_guardar_producto (
    p_id_usuario      IN     NUMBER,
    p_codigo          IN     VARCHAR2,
    p_id_categoria    IN     NUMBER,
    p_nombre          IN     VARCHAR2,
    p_descripcion     IN     VARCHAR2 DEFAULT NULL,
    p_es_torta        IN     CHAR     DEFAULT 'N',
    p_tipo_torta      IN     VARCHAR2 DEFAULT NULL,
    p_permite_mensaje IN     CHAR     DEFAULT 'N',
    p_id_producto     IN OUT NUMBER
) IS
BEGIN
    IF p_codigo IS NULL OR LENGTH(TRIM(p_codigo)) < 3 THEN
        RAISE_APPLICATION_ERROR(-20060, 'El código del producto es obligatorio y debe tener al menos 3 caracteres.');
    END IF;

    IF p_id_producto IS NULL THEN
        sp_validar_permiso(p_id_usuario, 'PRODUCTO_CREAR');

        INSERT INTO producto (codigo, id_categoria, nombre, descripcion,
                              es_torta, tipo_torta, permite_mensaje)
        VALUES (UPPER(TRIM(p_codigo)), p_id_categoria, p_nombre, p_descripcion,
                NVL(p_es_torta, 'N'), p_tipo_torta, NVL(p_permite_mensaje, 'N'))
        RETURNING id_producto INTO p_id_producto;
    ELSE
        sp_validar_permiso(p_id_usuario, 'PRODUCTO_EDITAR');

        UPDATE producto
           SET codigo          = UPPER(TRIM(p_codigo)),
               id_categoria    = p_id_categoria,
               nombre          = p_nombre,
               descripcion     = p_descripcion,
               es_torta        = NVL(p_es_torta, 'N'),
               tipo_torta      = p_tipo_torta,
               permite_mensaje = NVL(p_permite_mensaje, 'N')
         WHERE id_producto = p_id_producto;

        IF SQL%ROWCOUNT = 0 THEN
            RAISE_APPLICATION_ERROR(-20061, 'El producto indicado no existe.');
        END IF;
    END IF;
EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
        RAISE_APPLICATION_ERROR(-20062, 'Ya existe otro producto con ese código.');
END sp_guardar_producto;
/

-- Alta o modificación de una variante (producto + tamaño) con su precio, su stock y
-- su umbral de stock crítico.
CREATE OR REPLACE PROCEDURE sp_guardar_variante (
    p_id_usuario          IN     NUMBER,
    p_id_producto         IN     NUMBER,
    p_id_tamanio          IN     NUMBER,
    p_precio              IN     NUMBER,
    p_stock               IN     NUMBER DEFAULT 0,
    p_stock_critico       IN     NUMBER DEFAULT NULL,
    p_id_producto_tamanio IN OUT NUMBER
) IS
BEGIN
    IF p_precio IS NULL OR p_precio < 0 THEN
        RAISE_APPLICATION_ERROR(-20063, 'El precio es obligatorio y no puede ser negativo.');
    END IF;

    IF p_stock IS NULL OR p_stock < 0 OR p_stock <> TRUNC(p_stock) THEN
        RAISE_APPLICATION_ERROR(-20064, 'El stock debe ser un número entero mayor o igual a cero.');
    END IF;

    IF p_stock_critico IS NOT NULL
       AND (p_stock_critico < 0 OR p_stock_critico <> TRUNC(p_stock_critico)) THEN
        RAISE_APPLICATION_ERROR(-20065, 'El stock crítico debe ser un número entero mayor o igual a cero.');
    END IF;

    IF p_id_producto_tamanio IS NULL THEN
        sp_validar_permiso(p_id_usuario, 'PRODUCTO_CREAR');

        INSERT INTO producto_tamanio (id_producto, id_tamanio, precio, stock, stock_critico)
        VALUES (p_id_producto, p_id_tamanio, p_precio, p_stock, p_stock_critico)
        RETURNING id_producto_tamanio INTO p_id_producto_tamanio;
    ELSE
        sp_validar_permiso(p_id_usuario, 'PRODUCTO_EDITAR');

        UPDATE producto_tamanio
           SET precio        = p_precio,
               stock         = p_stock,
               stock_critico = p_stock_critico
         WHERE id_producto_tamanio = p_id_producto_tamanio;

        IF SQL%ROWCOUNT = 0 THEN
            RAISE_APPLICATION_ERROR(-20066, 'La variante de producto indicada no existe.');
        END IF;
    END IF;
EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
        RAISE_APPLICATION_ERROR(-20067, 'Ese producto ya tiene una variante con ese mismo tamaño.');
END sp_guardar_variante;
/

-- Baja LÓGICA del producto: nunca se borra la fila, porque hay pedidos históricos que
-- la referencian. Deja de aparecer en el catálogo y sus variantes quedan inactivas.
CREATE OR REPLACE PROCEDURE sp_eliminar_producto (
    p_id_usuario  IN NUMBER,
    p_id_producto IN NUMBER
) IS
BEGIN
    sp_validar_permiso(p_id_usuario, 'PRODUCTO_ELIMINAR');

    UPDATE producto SET activo = 'N' WHERE id_producto = p_id_producto;

    IF SQL%ROWCOUNT = 0 THEN
        RAISE_APPLICATION_ERROR(-20061, 'El producto indicado no existe.');
    END IF;

    UPDATE producto_tamanio SET activo = 'N' WHERE id_producto = p_id_producto;
END sp_eliminar_producto;
/

-- Alta o modificación de un usuario desde el mantenedor. El rol se pasa por su código
-- ('ADMINISTRADOR', 'VENDEDOR', 'CLIENTE'); el resto de las validaciones (dominio del
-- correo, RUT, fecha de nacimiento) las aplica trg_usuario_bi.
-- En la edición, p_clave en NULL conserva la contraseña actual.
CREATE OR REPLACE PROCEDURE sp_guardar_usuario (
    p_id_ejecutor      IN     NUMBER,
    p_codigo_rol       IN     VARCHAR2,
    p_rut              IN     VARCHAR2,
    p_nombres          IN     VARCHAR2,
    p_apellidos        IN     VARCHAR2,
    p_fecha_nacimiento IN     DATE,
    p_correo           IN     VARCHAR2,
    p_clave            IN     VARCHAR2 DEFAULT NULL,
    p_telefono         IN     VARCHAR2 DEFAULT NULL,
    p_id_usuario       IN OUT NUMBER
) IS
    v_id_rol      rol.id_rol%TYPE;
    v_rol_actual  rol.codigo_rol%TYPE;
    v_admins      NUMBER;
BEGIN
    BEGIN
        SELECT id_rol INTO v_id_rol
          FROM rol WHERE codigo_rol = UPPER(TRIM(p_codigo_rol));
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20070,
                'Rol inválido. Debe ser ADMINISTRADOR, VENDEDOR o CLIENTE.');
    END;

    IF p_id_usuario IS NULL THEN
        sp_validar_permiso(p_id_ejecutor, 'USUARIO_CREAR');

        IF p_clave IS NULL THEN
            RAISE_APPLICATION_ERROR(-20071, 'Un usuario nuevo necesita una contraseña.');
        END IF;

        INSERT INTO usuario (rut, nombres, apellidos, fecha_nacimiento,
                             correo, clave, telefono, id_rol)
        VALUES (p_rut, p_nombres, p_apellidos, p_fecha_nacimiento,
                p_correo, p_clave, p_telefono, v_id_rol)
        RETURNING id_usuario INTO p_id_usuario;
    ELSE
        sp_validar_permiso(p_id_ejecutor, 'USUARIO_EDITAR');

        v_rol_actual := fn_rol_usuario(p_id_usuario);

        IF v_rol_actual IS NULL THEN
            RAISE_APPLICATION_ERROR(-20072, 'El usuario indicado no existe.');
        END IF;

        -- Nadie puede dejar el sistema sin administradores quitándole el rol al último
        IF v_rol_actual = 'ADMINISTRADOR' AND UPPER(TRIM(p_codigo_rol)) <> 'ADMINISTRADOR' THEN
            SELECT COUNT(*) INTO v_admins
              FROM usuario u
              JOIN rol     r ON r.id_rol = u.id_rol
             WHERE r.codigo_rol = 'ADMINISTRADOR'
               AND u.activo = 'S';

            IF v_admins <= 1 THEN
                RAISE_APPLICATION_ERROR(-20075,
                    'No se puede quitar el rol al único administrador activo del sistema.');
            END IF;
        END IF;

        UPDATE usuario
           SET rut              = p_rut,
               nombres          = p_nombres,
               apellidos        = p_apellidos,
               fecha_nacimiento = p_fecha_nacimiento,
               correo           = p_correo,
               clave            = NVL(p_clave, clave),
               telefono         = p_telefono,
               id_rol           = v_id_rol
         WHERE id_usuario = p_id_usuario;
    END IF;
EXCEPTION
    WHEN DUP_VAL_ON_INDEX THEN
        RAISE_APPLICATION_ERROR(-20073, 'Ya existe otro usuario con ese RUT o ese correo.');
END sp_guardar_usuario;
/

-- Baja lógica de un usuario, con dos resguardos: nadie se da de baja a sí mismo y el
-- sistema nunca queda sin administradores activos.
CREATE OR REPLACE PROCEDURE sp_eliminar_usuario (
    p_id_ejecutor IN NUMBER,
    p_id_usuario  IN NUMBER
) IS
    v_rol    rol.codigo_rol%TYPE;
    v_admins NUMBER;
BEGIN
    sp_validar_permiso(p_id_ejecutor, 'USUARIO_ELIMINAR');

    IF p_id_ejecutor = p_id_usuario THEN
        RAISE_APPLICATION_ERROR(-20074, 'Un usuario no puede darse de baja a sí mismo.');
    END IF;

    v_rol := fn_rol_usuario(p_id_usuario);

    IF v_rol IS NULL THEN
        RAISE_APPLICATION_ERROR(-20072, 'El usuario indicado no existe.');
    END IF;

    IF v_rol = 'ADMINISTRADOR' THEN
        SELECT COUNT(*) INTO v_admins
          FROM usuario u
          JOIN rol     r ON r.id_rol = u.id_rol
         WHERE r.codigo_rol = 'ADMINISTRADOR'
           AND u.activo = 'S';

        IF v_admins <= 1 THEN
            RAISE_APPLICATION_ERROR(-20075,
                'No se puede dar de baja al único administrador activo del sistema.');
        END IF;
    END IF;

    UPDATE usuario SET activo = 'N' WHERE id_usuario = p_id_usuario;
END sp_eliminar_usuario;
/


COMMIT;



-- =====================================================================================
-- 12. CUENTAS INICIALES DEL SISTEMA
--
--     Van al final del script a propósito: recién aquí existen los triggers que
--     normalizan el correo y el RUT, validan el dominio y asignan el rol.
--
--     IMPORTANTE: las claves de abajo NO son hashes reales, son marcadores. Antes de
--     usar el sistema hay que reemplazarlas por el hash que genere la aplicación.
--     Sin al menos un administrador no hay forma de crear los demás usuarios, así que
--     la primera cuenta es obligatoria; las otras dos quedan listas para la demo y se
--     pueden borrar sin afectar nada.
-- =====================================================================================

INSERT INTO usuario (id_rol, rut, nombres, apellidos, fecha_nacimiento, correo, clave, telefono)
SELECT id_rol, '12.345.678-5', 'Simón', 'Inostroza', DATE '1985-06-15',
       'admin@duoc.cl', 'REEMPLAZAR_POR_HASH_REAL', '+56911111111'
FROM rol WHERE codigo_rol = 'ADMINISTRADOR';

INSERT INTO usuario (id_rol, rut, nombres, apellidos, fecha_nacimiento, correo, clave, telefono)
SELECT id_rol, '19.011.022-2', 'Paula', 'Vergara', DATE '1992-09-01',
       'vendedor@duoc.cl', 'REEMPLAZAR_POR_HASH_REAL', '+56922222222'
FROM rol WHERE codigo_rol = 'VENDEDOR';

INSERT INTO usuario (id_rol, rut, nombres, apellidos, fecha_nacimiento, correo, clave, telefono)
SELECT id_rol, '1.234.567-4', 'Camila', 'Reyes', DATE '1998-03-20',
       'cliente@gmail.com', 'REEMPLAZAR_POR_HASH_REAL', '+56933333333'
FROM rol WHERE codigo_rol = 'CLIENTE';

COMMIT;


-- =====================================================================================
-- FIN DEL SCRIPT
-- =====================================================================================
