# Impresor de pedidos · Grano y Plancha

Aplicación local para preparar e imprimir el recibo mostrado en la referencia.

## Abrir el programa

Hacé doble clic en `iniciar.bat`. No requiere instalación ni conexión a internet.

## Preparar un pedido

1. Elegí **Comanda y factura** en el campo Impresión. También podés elegir un solo formato.
2. Escribí la nota.
3. Elegí el cajero que atendió.
4. Cambiá el código, la descripción, la cantidad y el valor unitario del producto.
5. Usá **Agregar producto** para incluir más filas y **Eliminar** para retirar una.
6. Marcá **Limpiar después del ciclo** y **Pantalla negra después del ciclo** según prefieras.
7. Pulsá **Imprimir comanda (1/2)** y elegí la impresora de comandas en el diálogo.
8. Al cerrar ese diálogo, pulsá **Imprimir factura (2/2)** y elegí la impresora de facturas.

El formulario conserva los mismos datos para las dos impresiones. Entre ambas queda bloqueado y el botón de factura recibe el foco, así que podés pulsar `Enter` para abrir enseguida el segundo diálogo. Si cerraste el primero sin imprimir, usá **Repetir comanda**; **Cancelar ciclo** permite volver a editar sin limpiar el pedido. La limpieza y la pantalla negra se aplican al cerrar el segundo diálogo. En cada impresora configurá papel de **80 mm**, escala **100 %**, márgenes **ninguno** y desactivá encabezados y pies de página del navegador.

El navegador no informa si el diálogo terminó con impresión o cancelación. Si cancelás el de la factura, las opciones de finalización también se ejecutarán.

La factura incluye el total, la forma de pago y el aviso de devoluciones. La comanda muestra **COMANDA** sobre el número de pedido y **PRODUCTOS** sobre el listado; omite el total, el efectivo, el cambio y el aviso de devoluciones.

La fecha y la hora se toman automáticamente del computador. El total de todos los productos, el efectivo y el cambio se calculan automáticamente. Los últimos datos escritos quedan guardados en ese navegador.

Podés recorrer los controles con las cuatro flechas. Dentro de los campos de texto, izquierda y derecha conservan su función de mover el cursor; al llegar al principio o al final pasan al control vecino.

Al escribir un nombre completo del catálogo, el código y el precio se completan automáticamente. El catálogo inicial incluye EJECUTIVO, CAFÉ ALCAZAR, ALMOJABANAS, TINTO y PINTADO.

La aplicación inicia con la ventana completamente negra. Para mostrar el formulario, hacé clic en la esquina inferior izquierda. La opción **Pantalla negra después del ciclo** permite volver automáticamente a ese estado al terminar las impresiones. El botón **Pantalla negra** también permite ocultarlo manualmente.

## Ajustar para otra impresora

El ancho del recibo se define en `styles.css` con `width: 80mm`. Cuando se conozca la marca, el modelo y el ancho de papel se puede ajustar esa medida y comprobar el corte real.
