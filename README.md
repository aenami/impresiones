# Impresor de pedidos · Grano y Plancha

Aplicación local para preparar e imprimir el recibo mostrado en la referencia.

## Abrir el programa

Hacé doble clic en `iniciar.bat`. No requiere instalación ni conexión a internet.

## Preparar una impresión

1. Elegí **Factura** o **Comanda** en el campo Formato.
2. Escribí la nota.
3. Elegí el cajero que atendió.
4. Cambiá el código, la descripción, la cantidad y el valor unitario del producto.
5. Usá **Agregar producto** para incluir más filas y **Eliminar** para retirar una.
6. Pulsá **Imprimir**.
7. En la ventana de impresión seleccioná la impresora térmica, papel de **80 mm**, escala **100 %**, márgenes **ninguno** y desactivá encabezados y pies de página del navegador.

La factura incluye el total y la forma de pago. La comanda cambia la franja de productos por **COMANDA** y omite el total, el efectivo y el cambio.

La fecha y la hora se toman automáticamente del computador. El total de todos los productos, el efectivo y el cambio se calculan automáticamente. Los últimos datos escritos quedan guardados en ese navegador.

La aplicación inicia con la ventana completamente negra. Para mostrar el formulario, hacé clic en la esquina inferior izquierda. El botón **Pantalla negra** permite ocultarlo nuevamente.

## Ajustar para otra impresora

El ancho del recibo se define en `styles.css` con `width: 80mm`. Cuando se conozca la marca, el modelo y el ancho de papel se puede ajustar esa medida y comprobar el corte real.
