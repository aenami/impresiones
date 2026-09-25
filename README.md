# Impresor de pedidos · Grano y Plancha

Aplicación local para preparar e imprimir el recibo mostrado en la referencia.

## Abrir el programa

Hacé doble clic en `iniciar.bat`. No requiere instalación ni conexión a internet.

## Preparar una impresión

1. Escribí la nota.
2. Elegí el cajero que atendió.
3. Cambiá el código, la descripción, la cantidad y el valor unitario del producto.
4. Usá **Agregar producto** para incluir más filas y **Eliminar** para retirar una.
5. Pulsá **Imprimir**.
6. En la ventana de impresión seleccioná la impresora térmica, papel de **80 mm**, escala **100 %**, márgenes **ninguno** y desactivá encabezados y pies de página del navegador.

La fecha y la hora se toman automáticamente del computador. El total de todos los productos, el efectivo y el cambio se calculan automáticamente. Los últimos datos escritos quedan guardados en ese navegador.

## Ajustar para otra impresora

El ancho del recibo se define en `styles.css` con `width: 80mm`. Cuando se conozca la marca, el modelo y el ancho de papel se puede ajustar esa medida y comprobar el corte real.
