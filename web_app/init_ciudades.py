"""
Script para crear ciudades iniciales en la base de datos
Ejecutar antes de usar la aplicación web
"""
import sys
import os

# Agregar el directorio actual al path
sys.path.insert(0, os.path.dirname(__file__))

from app import app, db, Ciudad

def crear_ciudades():
    """Crea ciudades iniciales en la base de datos"""
    ciudades_nombres = [
        'Loja',
        'Cuenca',
        'Ambato',
        'Quito',
        'Guayaquil',
        'Riobamba',
        'Latacunga',
        'Ibarra',
        'Puyo',
        'Macas'
    ]
    
    with app.app_context():
        # Verificar si ya existen ciudades
        ciudades_existentes = Ciudad.query.first()
        
        if ciudades_existentes:
            print("Las ciudades ya están creadas en la base de datos.")
            print("\nCiudades actuales:")
            ciudades = Ciudad.query.all()
            for i, ciudad in enumerate(ciudades, 1):
                print(f"  {i}. {ciudad.nombre}")
            return
        
        # Crear las ciudades
        print("Creando ciudades iniciales...")
        for nombre in ciudades_nombres:
            ciudad = Ciudad(nombre=nombre)
            db.session.add(ciudad)
        
        db.session.commit()
        
        print(f"✓ Se crearon {len(ciudades_nombres)} ciudades exitosamente!")
        print("\nCiudades creadas:")
        for i, nombre in enumerate(ciudades_nombres, 1):
            print(f"  {i}. {nombre}")

if __name__ == '__main__':
    crear_ciudades()
