from dataclasses import dataclass, field
from typing import List

@dataclass
class Ciudad:
    nombre: str

    def __str__(self):
        return self.nombre

@dataclass
class Ruta:
    origen: Ciudad
    destino: Ciudad
    precio: float
    duracion_horas: float

    def __str__(self):
        return f"{self.origen} -> {self.destino} | Precio: $ {self.precio:.2f} | Duración: {self.duracion_horas:.2f} h"

@dataclass
class Cooperativa:
    nombre: str
    url_sitio: str
    telefono_contacto: str
    activa: bool
    rutas: List[Ruta] = field(default_factory=list)

    def agregar_ruta(self, ruta: Ruta):
        self.rutas.append(ruta)

    def __str__(self):
        estado = "Activa" if self.activa else "Inactiva"
        header = f"Cooperativa: {self.nombre} ({estado})\nSitio: {self.url_sitio} | Tel: {self.telefono_contacto}\nRutas:"
        if not self.rutas:
            return header + "\n  (sin rutas)"
        rutas_str = "\n".join(f"  {i+1}. {r}" for i, r in enumerate(self.rutas))
        return header + "\n" + rutas_str

def crear_ejemplo():
    ciudad_a = Ciudad("Loja")
    ciudad_b = Ciudad("Cuenca")
    ciudad_c = Ciudad("Ambato")

    ruta1 = Ruta(origen=ciudad_a, destino=ciudad_b, precio=12.0, duracion_horas=6.0)
    ruta2 = Ruta(origen=ciudad_b, destino=ciudad_c, precio=9.0, duracion_horas=4.0)
    ruta3 = Ruta(origen=ciudad_a, destino=ciudad_c, precio=20.0, duracion_horas=10.0)

    coop = Cooperativa(
        nombre="Coop Trans Loja",
        url_sitio="https://cooperativaloja.com.ec/",
        telefono_contacto="0993385138",
        activa=True
    )

    coop.agregar_ruta(ruta1)
    coop.agregar_ruta(ruta2)
    coop.agregar_ruta(ruta3)

    return coop

def main():
    coop = crear_ejemplo()
    print(coop)

if __name__ == "__main__":
    main()