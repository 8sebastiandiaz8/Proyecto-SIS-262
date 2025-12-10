from typing import Dict, List

import dinamica_sistemas


class Satelite:
    """Satelite procesa las condiciones y estima recursos de respuesta."""

    def __init__(self) -> None:
        self.condiciones: Dict[str, float] = {}

    def monitorear(self, datos: Dict[str, float]) -> Dict[str, float]:
        campos = [
            "tamano_bosque",
            "velocidad_viento",
            "temperatura",
            "humedad",
            "combustible",
            "distancia_foco",
            "pendiente",
            "velocidad_brigada",
            "velocidad_helicoptero",
            "capacidad_control_brigada",
            "capacidad_descarga_helicoptero",
        ]
        faltantes = [campo for campo in campos if datos.get(campo) in (None, "")]
        if faltantes:
            raise ValueError(f"Faltan datos de entrada: {', '.join(faltantes)}")

        try:
            self.condiciones = {campo: float(datos[campo]) for campo in campos}
        except (TypeError, ValueError) as error:
            raise ValueError("Los datos deben ser numéricos.") from error

        return self.condiciones

    def simular_expansion(self) -> List[Dict[str, float]]:
        if not self.condiciones:
            raise ValueError("No hay condiciones monitoreadas.")

        tasa = dinamica_sistemas.estimar_tasa_expansion(self.condiciones)
        return dinamica_sistemas.simular_propagacion(self.condiciones, tasa)

    def calcular_recursos(self, proyeccion: List[Dict[str, float]]) -> Dict[str, float]:
        if not self.condiciones:
            raise ValueError("No hay condiciones monitoreadas.")

        return dinamica_sistemas.calcular_recursos(proyeccion, self.condiciones)
