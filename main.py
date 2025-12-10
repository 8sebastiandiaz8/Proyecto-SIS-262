from flask import Flask, jsonify, render_template, request
from satelite_logica import Satelite

app = Flask(__name__)


@app.route("/")
def inicio():
    return render_template("index.html")


@app.route("/simular", methods=["POST"])
def simular():
    datos = request.get_json(force=True, silent=True) or {}
    satelite = Satelite()
    try:
        satelite.monitorear(datos)
        proyeccion = satelite.simular_expansion()
        recursos = satelite.calcular_recursos(proyeccion)
    except ValueError as error:
        return jsonify({"error": str(error)}), 400

    respuesta = {
        "mensaje": "Análisis completado. Recursos calculados.",
        "recursos": recursos,
        "proyeccion": proyeccion,
    }
    return jsonify(respuesta)


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
