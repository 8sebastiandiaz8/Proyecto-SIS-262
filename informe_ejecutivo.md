# Informe ejecutivo y diagrama de dinámica de sistemas

## Objetivo
Crear una vista ejecutiva del modelo satelital que estima la expansión de incendios forestales con realimentación negativa y calcula recursos de respuesta (bomberos, helicópteros y agua) a partir de las entradas entregadas por el usuario.

## Alcance del monitoreo y reporte
- Captura en tiempo real de condiciones de entorno y capacidad de respuesta ingresadas por el usuario.
- Generación de proyección de intensidad horaria (18 pasos) y recursos recomendados.
- Historial de reportes con sello de tiempo, tabla de entradas y tarjetas de recursos.
- Visualización operativa: radar animado, curva con banda de incertidumbre y tooltip, mapa ligero de perímetro/focos.

## Flujo de alto nivel
- Entradas del usuario (condiciones iniciales del monitoreo).
- Cálculo de tasa de expansión y trayectoria de intensidad con realimentación negativa.
- Cálculo de demanda de control y recursos requeridos.
- Visualización: radar animado, curva Intensidad vs Tiempo, tarjetas de recursos.
- Cada simulación/monitoreo genera un reporte nuevo y conserva los anteriores para trazabilidad.
  - Los reportes quedan en un historial (sello de tiempo, resumen de entradas, recursos).
  - La gráfica muestra ejes etiquetados, área sombreada, punto final y tooltip al pasar el mouse.
  - La curva incluye banda de incertidumbre (±) según viento y humedad.
  - Mapa operativo ligero: perímetro estimado y focos calientes derivados de las entradas (sin tiles externos).

## Supuestos y límites
- Horizonte fijo de 18 pasos horarios (dt = 1 h).
- La intensidad se reduce por humedad y por pérdida progresiva de combustible (decae linealmente hasta un mínimo).
- El efecto del terreno se aproxima con la pendiente promedio (no incluye discontinuidades de combustible ni cambios meteorológicos).
- Los recursos se calculan con capacidad media (MWh) y penalización por retardo de llegada (horas).
- El mapa operativo es esquemático (canvas) y no usa coordenadas geográficas reales; se deriva solo de las entradas numéricas.
- La banda de incertidumbre se aproxima con viento y humedad actuales; no incorpora pronóstico ni variabilidad espacial.

## Entradas clave
- Tamaño del bosque (ha)
- Velocidad del viento (km/h)
- Temperatura (°C)
- Humedad relativa (%)
- Carga de combustible (índice 0-100)
- Distancia al foco (km)
- Pendiente del terreno (grados)
- Velocidad brigada terrestre (km/h)
- Velocidad helicóptero (km/h)
- Capacidad control brigada (MWh)
- Capacidad descarga helicóptero (MWh)

## Ecuaciones del modelo
- Tasa de expansión:
  $\text{base} = 0.045\,v_\text{viento} + 0.02\,T$
  
  $\text{efecto}_h = \max(0.2,\,1 - \tfrac{H}{120})$
  
  $\text{efecto}_c = 0.015\,\text{combustible}$
  
  $\text{efecto}_p = 1 + \tfrac{\theta}{90}$
  
  $\text{tasa}_\text{exp} = \max\big(0.05,\, (\text{base}+\text{efecto}_c)\, \text{efecto}_h\, \text{efecto}_p\big)$

- Intensidad inicial:
  $I_0 = \max(0.4,\, 0.015\,\text{tamano} + 0.06\,\text{combustible})$

- Para cada paso $t$ (dt = 1 h):
  $d_c = \max\big(0.35,\, 1 - \tfrac{t}{18\times 1.1}\big)$
  
  $r_n = -0.18\, I_t\, \max(0.15,\, 1 - \tfrac{H}{110})$
  
  $g = \text{tasa}_\text{exp}\, d_c$
  
  $I_{t+1} = \max\big(I_t + (g + r_n)\, dt,\, 0\big)$

- Energía liberada:
  $E = \sum_t I_t\, dt$

- Penalización por retardo y demanda de control:
  $R_b = \tfrac{\text{distancia}}{v_b}$, $R_h = \tfrac{\text{distancia}}{v_h}$
  
  $P = 1 + \tfrac{R_b + R_h}{12}$
  
  $D = E\, \text{tasa}_\text{exp}\, P$

- Recursos:
  $\text{bomberos} = \lceil D / C_b \rceil$
  
  $\text{helicópteros} = \lceil 0.6\, D / C_h \rceil$
  
  $\text{agua (L)} = \lceil 25\, D \rceil$

## Guía del diagrama de Forrester (para Vensim)
1) **Stock principal**: `Intensidad del fuego (I)`
   - Unidad: intensidad relativa (proporcional a MJ/h).

2) **Flujos hacia/desde el stock**:
   - `Crecimiento por expansión` (inflow): $g = \text{tasa}_\text{exp} \times d_c$.
   - `Control / realimentación negativa` (outflow): $r_n = 0.18\, I \times \max(0.15,\,1 - H/110)$.

3) **Auxiliares y conectores**:
   - `Tasa de expansión` recibe: velocidad viento, temperatura, humedad, combustible, pendiente.
   - `Desgaste de combustible d_c` recibe: paso de tiempo actual.
   - `Realimentación por humedad` recibe: humedad e intensidad.
   - `Energía E` integra la trayectoria de `Intensidad` (en Vensim puedes usar `INTEG(Intensidad, I0)` para acumular o un `SMOOTH` discreto).
   - `Penalización por retardo P` recibe: distancia, velocidad brigada, velocidad helicóptero.
   - `Demanda de control D` conecta con E y tasa_exp.
   - `Bomberos`, `Helicópteros`, `Agua` conectan con D y capacidades $C_b$, $C_h$.

4) **Pasos para dibujar en Vensim**
   - Crea el stock `Intensidad del fuego`.
   - Agrega dos flujos: `Crecimiento por expansión` (entrante) y `Control/realimentación` (saliente).
   - Añade auxiliares: `Tasa de expansión`, `Desgaste combustible d_c`, `Realimentación por humedad`, `Penalización por retardo P`, `Demanda D`.
   - Conecta las entradas (viento, temperatura, humedad, combustible, pendiente) hacia `Tasa de expansión` y `Realimentación por humedad`.
   - Conecta `Tasa de expansión` y `d_c` hacia `Crecimiento`; conecta `Intensidad` y `Realimentación por humedad` hacia el flujo de salida.
   - Crea auxiliares de salida `Bomberos`, `Helicópteros`, `Agua` conectados a `Demanda D`, $C_b$, $C_h$.

5) **Indicadores de salida sugeridos**
  - Curva `Intensidad vs Tiempo` con banda de incertidumbre.
  - Tabla de `Bomberos`, `Helicópteros`, `Agua (L)`.
  - `Retardo brigadas` y `Retardo helicópteros` como métricas operacionales.
  - Mapa operativo ligero con perímetro y focos (canvas) para apoyo situacional.
  - Tabla de entradas del monitoreo por reporte (trazabilidad).

## Recomendaciones de uso
- Validar entradas: no usar valores nulos ni negativos; mantener unidades indicadas.
- Calibrar los coeficientes (0.045, 0.02, 0.015, 0.18) con series históricas locales para mejorar ajuste.
- Explorar escenarios alterando humedad y viento para evaluar sensibilidad de la realimentación negativa.
- Considerar extender el horizonte o habilitar dt variable si se integran pronósticos meteorológicos.
- Si se requiere precisión espacial, conectar el canvas del mapa a tiles y geocodificación real; hoy es esquemático.
- Ajustar la banda de incertidumbre con curvas percentil si se cuenta con distribución histórica de viento/humedad.

## Próximas mejoras sugeridas
- Persistir el historial de reportes (backend o localStorage) para no perderlos al recargar.
- Exportar reporte a PDF/HTML con tabla de entradas y recursos.
- Añadir selector de escenarios y comparación lado a lado de curvas.
- Integrar ingestión de pronósticos meteorológicos para ajustar la banda de incertidumbre en tiempo real.
- Usar capas geoespaciales reales (WMS/XYZ) y perímetros detectados para reemplazar el mapa esquemático.
- Incluir resumen estadístico por reporte (máx, min, tiempo de control) y alertas si los recursos no alcanzan.
