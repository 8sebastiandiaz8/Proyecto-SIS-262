# Guía breve para el licenciado

Esta nota explica, de forma operativa, cómo la app usa los datos que usted ingresa (N variables de monitoreo) para generar el reporte y qué ver en cada salida.

## Qué hace la aplicación
- Recibe **todos los datos del monitoreo** (usted ingresa N variables: viento, humedad, combustible, distancias, velocidades, capacidades, etc.). Sin datos del usuario no se calcula nada.
- Con esos datos calcula la **tasa de expansión** y simula la **intensidad** en 18 pasos horarios con realimentación negativa.
- Estima **recursos** (bomberos, helicópteros, agua) considerando retardos de llegada.
- Muestra radar, **curva Intensidad vs Tiempo** con banda de incertidumbre y **mapa operativo ligero** (perímetro/focos) derivados de sus datos.
- Cada simulación genera un **reporte** con sello de tiempo, **tabla de entradas (todas las variables que ingresó)** y tarjetas de recursos. Los reportes previos se conservan en el historial.

## Cómo se usa
1) Abrir la página principal (`/`).
2) Completar **todos** los campos del formulario con las unidades indicadas (sus N datos de monitoreo).
3) Presionar “Iniciar simulación”.
4) Ver el panel inferior: 
	- Gráfica (intensidad + banda de incertidumbre) basada en sus datos actuales.
	- Mapa ligero (perímetro/focos) generado con las mismas entradas.
	- Tarjetas de recursos y tabla de entradas en el reporte recién creado. El historial mantiene los anteriores.

## Qué significan los resultados
- **Intensidad**: trayectoria estimada; si baja a 0, el modelo considera el fuego extinguido con los recursos calculados.
- **Recursos**: bomberos, helicópteros y agua requeridos para controlar la intensidad proyectada, ajustados por retardos.
- **Retardos**: horas de llegada de brigadas y helicópteros según sus distancias/velocidades.
- **Mapa operativo**: perímetro y focos esquemáticos basados en sus entradas numéricas (sin coordenadas reales).

## Supuestos clave
- Horizonte fijo de 18 horas (dt = 1h).
- La humedad introduce realimentación negativa; el combustible se desgasta progresivamente.
- Mapa esquemático (canvas), no georreferenciado; solo refleja sus entradas.
- Banda de incertidumbre calculada con su viento/humedad actuales; no incluye pronóstico.

## Limitaciones y próximos pasos
- Falta persistir el historial (backend o localStorage) para no perder reportes al recargar.
- Falta exportar reportes a PDF/HTML para compartir.
- Pendiente integrar pronósticos meteo y capas geoespaciales reales si se requiere precisión cartográfica.

## Componentes principales del proyecto
- `main.py`: servidor Flask y ruta `/simular`.
- `satelite_logica.py` y `dinamica_sistemas.py`: monitoreo, simulación y cálculo de recursos.
- `templates/index.html`: interfaz.
- `static/js/controlador.js`: animaciones, gráfica, historial y envío de datos.
- `static/css/estilos.css`: estilo visual.
- `informe_ejecutivo.md`: detalle técnico y diagrama de Forrester.
