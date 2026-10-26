# Impresor de pedidos · Grano y Plancha

Aplicación local para preparar e imprimir el recibo mostrado en la referencia.

## Abrir el programa

Hacé doble clic en `iniciar.bat`. No requiere instalación ni conexión a internet.

## Preparar un pedido

1. Elegí **Comanda y factura** en el campo Impresión. También podés elegir un solo formato.
2. Escribí las observaciones y elegí el cajero que atendió en la parte superior.
3. En la tabla, cambiá el código, la descripción, la cantidad y el precio del producto. El total de cada fila y el total del documento se calculan automáticamente.
4. Usá **Agregar producto** para incluir más filas y **Quitar** para retirarlas.
5. Marcá **Limpiar después del ciclo** y **Pantalla negra después del ciclo** según prefieras.
6. Pulsá **F2** o **Imprimir comanda (1/2)** y elegí la impresora de comandas en el diálogo.
7. Si la comanda salió, pulsá **Confirmar comanda e imprimir factura (2/2)** y elegí la impresora de facturas. Si cancelaste el diálogo, pulsá **Reimprimir comanda**.
8. Cuando salga la factura, pulsá **Confirmar factura impresa** para terminar. Si cancelaste su diálogo, pulsá **Reimprimir factura**.

El formulario conserva los mismos datos para las dos impresiones. Entre ambas queda bloqueado y el botón de confirmación recibe el foco, así que podés pulsar `Enter` para abrir enseguida el segundo diálogo. **Cancelar ciclo** permite volver a editar sin limpiar el pedido. La limpieza y la pantalla negra se aplican solo al confirmar que salió la factura. En cada impresora configurá papel de **80 mm**, escala **100 %**, márgenes **ninguno** y desactivá encabezados y pies de página del navegador.

El navegador no informa si el diálogo terminó con impresión o cancelación. Por eso, confirmá cada impresión antes de avanzar.

La factura incluye el total, la forma de pago, el aviso de devoluciones y el texto del proveedor al pie. La comanda muestra **COMANDA** sobre el número de pedido y **PRODUCTOS** sobre el listado; omite el total, el efectivo, el cambio, el aviso de devoluciones y el texto del proveedor.

La fecha y la hora se toman automáticamente del computador. El total de todos los productos, el efectivo y el cambio se calculan automáticamente. Los últimos datos escritos quedan guardados en ese navegador.

En la tabla, arriba y abajo cambian de fila dentro de la misma columna. Izquierda y derecha pasan al campo vecino cuando el cursor llega al extremo del texto. F2 abre la primera impresión cuando la pantalla está visible; durante la confirmación del ciclo, usá los botones de confirmar o reimprimir.

Al escribir un nombre completo del catálogo, el código y el precio se completan automáticamente. El catálogo inicial incluye EJECUTIVO, CAFÉ ALCAZAR, ALMOJABANAS, TINTO, PINTADO, MILO CALIENTE, BUÑUELO y ADICIONAL VARIOS.

La aplicación inicia con la ventana completamente negra. Para mostrar el formulario, hacé clic en la esquina inferior izquierda. La opción **Pantalla negra después del ciclo** permite volver automáticamente a ese estado al terminar las impresiones. El botón **Pantalla negra** también permite ocultarlo manualmente.

## Ajustar para otra impresora

El ancho del recibo se define en `styles.css` con `width: 80mm`. Cuando se conozca la marca, el modelo y el ancho de papel se puede ajustar esa medida y comprobar el corte real.
