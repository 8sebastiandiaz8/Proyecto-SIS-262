import math
from typing import Dict, List


def estimar_tasa_expansion(condiciones: Dict[str, float]) -> float:
    """Calcula la tasa de expansión estimada considerando clima y terreno."""
    viento = condiciones["velocidad_viento"]
    temperatura = condiciones["temperatura"]
    humedad = max(condiciones["humedad"], 1.0)
    combustible = condiciones["combustible"]
    pendiente = condiciones["pendiente"]

    base_climatica = (viento * 0.045) + (temperatura * 0.02)
    efecto_humedad = max(0.2, 1 - (humedad / 120))
    efecto_combustible = 0.015 * combustible
    efecto_pendiente = 1 + (pendiente / 90)

    tasa = max(0.05, (base_climatica + efecto_combustible) * efecto_humedad * efecto_pendiente)
    return tasa


def simular_propagacion(condiciones: Dict[str, float], tasa_expansion: float, pasos: int = 18, dt: float = 1.0) -> List[Dict[str, float]]:
    """Integra una trayectoria simple de intensidad con realimentación negativa."""
    tamano = condiciones["tamano_bosque"]
    combustible = condiciones["combustible"]
    humedad = condiciones["humedad"]

    intensidad = max(0.4, (tamano * 0.015) + (combustible * 0.06))
    proyeccion: List[Dict[str, float]] = []

    for paso in range(pasos):
        efecto_humedad = max(0.15, 1 - humedad / 110)
        desgaste_combustible = max(0.35, 1 - (paso / (pasos * 1.1)))
        realimentacion_negativa = -0.18 * intensidad * efecto_humedad
        crecimiento = tasa_expansion * desgaste_combustible

        variacion = (crecimiento + realimentacion_negativa) * dt
        intensidad = max(intensidad + variacion, 0)

        proyeccion.append({"tiempo": round(paso * dt, 2), "intensidad": round(intensidad, 3)})

    return proyeccion


def calcular_recursos(proyeccion: List[Dict[str, float]], condiciones: Dict[str, float]) -> Dict[str, float]:
    if not proyeccion:
        raise ValueError("No hay proyección disponible para calcular recursos.")

    tasa = estimar_tasa_expansion(condiciones)
    distancia = max(condiciones["distancia_foco"], 0.1)
    velocidad_brigada = max(condiciones["velocidad_brigada"], 0.1)
    velocidad_helicoptero = max(condiciones["velocidad_helicoptero"], 0.1)
    capacidad_brigada = max(condiciones["capacidad_control_brigada"], 0.1)
    capacidad_helitanker = max(condiciones["capacidad_descarga_helicoptero"], 0.1)

    dt = proyeccion[1]["tiempo"] - proyeccion[0]["tiempo"] if len(proyeccion) > 1 else 1
    energia_fuego = sum(punto["intensidad"] for punto in proyeccion) * dt

    retardo_brigadas = distancia / velocidad_brigada
    retardo_helis = distancia / velocidad_helicoptero
    penalizacion_retardo = 1 + (retardo_brigadas + retardo_helis) / 12

    demanda_control = energia_fuego * tasa * penalizacion_retardo
    bomberos = math.ceil(demanda_control / capacidad_brigada)
    helicopteros = math.ceil((demanda_control * 0.6) / capacidad_helitanker)
    agua_litros = math.ceil(demanda_control * 25)

    return {
        "bomberos_requeridos": bomberos,
        "helicopteros_requeridos": helicopteros,
        "agua_litros_requeridos": agua_litros,
        "tasa_expansion": round(tasa, 3),
        "retardo_brigadas_horas": round(retardo_brigadas, 2),
        "retardo_helicopteros_horas": round(retardo_helis, 2),
        "energia_fuego": round(energia_fuego, 2),
    }
