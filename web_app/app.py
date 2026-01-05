"""
Aplicación Flask para CRUD de Rutas y Cooperativas
"""
from flask import Flask, render_template, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from datetime import datetime
import os

app = Flask(__name__)

# Configuración de base de datos
db_path = os.path.join(os.path.dirname(__file__), 'transporte.db')
app.config['SQLALCHEMY_DATABASE_URI'] = f'sqlite:///{db_path}'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db = SQLAlchemy(app)

# ============ MODELOS ============

class Ciudad(db.Model):
    __tablename__ = 'ciudades'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(100), unique=True, nullable=False)
    
    rutas_origen = db.relationship('Ruta', foreign_keys='Ruta.origen_id', backref='ciudad_origen_rel')
    rutas_destino = db.relationship('Ruta', foreign_keys='Ruta.destino_id', backref='ciudad_destino_rel')
    
    def __repr__(self):
        return f'<Ciudad {self.nombre}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre
        }


class Ruta(db.Model):
    __tablename__ = 'rutas'
    
    id = db.Column(db.Integer, primary_key=True)
    origen_id = db.Column(db.Integer, db.ForeignKey('ciudades.id'), nullable=False)
    destino_id = db.Column(db.Integer, db.ForeignKey('ciudades.id'), nullable=False)
    precio = db.Column(db.Float, nullable=False)
    duracion_horas = db.Column(db.Float, nullable=False)
    
    origen = db.relationship('Ciudad', foreign_keys=[origen_id])
    destino = db.relationship('Ciudad', foreign_keys=[destino_id])
    
    # Relación muchos a muchos con Cooperativa
    cooperativas = db.relationship('Cooperativa', secondary='cooperativa_ruta', backref='rutas_rel')
    
    def __repr__(self):
        return f'<Ruta {self.origen.nombre} -> {self.destino.nombre}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'origen_id': self.origen_id,
            'origen_nombre': self.origen.nombre,
            'destino_id': self.destino_id,
            'destino_nombre': self.destino.nombre,
            'precio': self.precio,
            'duracion_horas': self.duracion_horas
        }


# Tabla asociativa para relación muchos a muchos
cooperativa_ruta = db.Table(
    'cooperativa_ruta',
    db.Column('cooperativa_id', db.Integer, db.ForeignKey('cooperativas.id'), primary_key=True),
    db.Column('ruta_id', db.Integer, db.ForeignKey('rutas.id'), primary_key=True)
)


class Cooperativa(db.Model):
    __tablename__ = 'cooperativas'
    
    id = db.Column(db.Integer, primary_key=True)
    nombre = db.Column(db.String(150), unique=True, nullable=False)
    url_sitio = db.Column(db.String(255), nullable=False)
    telefono_contacto = db.Column(db.String(20), nullable=False)
    activa = db.Column(db.Boolean, default=True, nullable=False)
    
    def __repr__(self):
        return f'<Cooperativa {self.nombre}>'
    
    def to_dict(self):
        return {
            'id': self.id,
            'nombre': self.nombre,
            'url_sitio': self.url_sitio,
            'telefono_contacto': self.telefono_contacto,
            'activa': self.activa,
            'rutas': [r.to_dict() for r in self.rutas_rel]
        }


# ============ RUTAS PRINCIPALES ============

@app.route('/')
def index():
    return render_template('index.html')


@app.route('/rutas')
def rutas_page():
    return render_template('rutas.html')


@app.route('/cooperativas')
def cooperativas_page():
    return render_template('cooperativas.html')


# ============ APIs CRUD RUTAS ============

@app.route('/api/rutas', methods=['GET'])
def get_rutas():
    """Obtiene todas las rutas"""
    rutas = Ruta.query.all()
    return jsonify([r.to_dict() for r in rutas])


@app.route('/api/rutas', methods=['POST'])
def create_ruta():
    """Crea una nueva ruta con validación de duplicados"""
    data = request.json
    
    # Validación de campos requeridos
    if not all(k in data for k in ['origen_id', 'destino_id', 'precio', 'duracion_horas']):
        return jsonify({'error': 'Campos requeridos incompletos'}), 400
    
    # Validar que origen y destino sean diferentes
    if data['origen_id'] == data['destino_id']:
        return jsonify({'error': 'La ciudad de origen y destino no pueden ser iguales'}), 400
    
    # Validar que las ciudades existan
    origen = Ciudad.query.get(data['origen_id'])
    destino = Ciudad.query.get(data['destino_id'])
    
    if not origen or not destino:
        return jsonify({'error': 'Ciudades no encontradas'}), 404
    
    # Validar que no exista ruta duplicada
    ruta_existente = Ruta.query.filter_by(
        origen_id=data['origen_id'],
        destino_id=data['destino_id']
    ).first()
    
    if ruta_existente:
        return jsonify({
            'error': f'Ya existe una ruta de {origen.nombre} a {destino.nombre}'
        }), 409
    
    # Validar precios y duración
    try:
        precio = float(data['precio'])
        duracion = float(data['duracion_horas'])
        
        if precio <= 0 or duracion <= 0:
            return jsonify({'error': 'El precio y duración deben ser mayores a 0'}), 400
    except (ValueError, TypeError):
        return jsonify({'error': 'Precio y duración deben ser números válidos'}), 400
    
    # Crear la ruta
    nueva_ruta = Ruta(
        origen_id=data['origen_id'],
        destino_id=data['destino_id'],
        precio=precio,
        duracion_horas=duracion
    )
    
    db.session.add(nueva_ruta)
    db.session.commit()
    
    return jsonify(nueva_ruta.to_dict()), 201


@app.route('/api/rutas/<int:ruta_id>', methods=['PUT'])
def update_ruta(ruta_id):
    """Actualiza una ruta existente"""
    ruta = Ruta.query.get_or_404(ruta_id)
    data = request.json
    
    # Validar nuevas ciudades si se cambian
    if 'origen_id' in data or 'destino_id' in data:
        origen_id = data.get('origen_id', ruta.origen_id)
        destino_id = data.get('destino_id', ruta.destino_id)
        
        if origen_id == destino_id:
            return jsonify({'error': 'La ciudad de origen y destino no pueden ser iguales'}), 400
        
        origen = Ciudad.query.get(origen_id)
        destino = Ciudad.query.get(destino_id)
        
        if not origen or not destino:
            return jsonify({'error': 'Ciudades no encontradas'}), 404
        
        # Validar que no exista otra ruta con esas ciudades
        ruta_duplicada = Ruta.query.filter(
            Ruta.id != ruta_id,
            Ruta.origen_id == origen_id,
            Ruta.destino_id == destino_id
        ).first()
        
        if ruta_duplicada:
            return jsonify({'error': f'Ya existe una ruta de {origen.nombre} a {destino.nombre}'}), 409
        
        ruta.origen_id = origen_id
        ruta.destino_id = destino_id
    
    # Actualizar otros campos
    if 'precio' in data:
        try:
            precio = float(data['precio'])
            if precio <= 0:
                return jsonify({'error': 'El precio debe ser mayor a 0'}), 400
            ruta.precio = precio
        except (ValueError, TypeError):
            return jsonify({'error': 'Precio debe ser un número válido'}), 400
    
    if 'duracion_horas' in data:
        try:
            duracion = float(data['duracion_horas'])
            if duracion <= 0:
                return jsonify({'error': 'La duración debe ser mayor a 0'}), 400
            ruta.duracion_horas = duracion
        except (ValueError, TypeError):
            return jsonify({'error': 'Duración debe ser un número válido'}), 400
    
    db.session.commit()
    return jsonify(ruta.to_dict()), 200


@app.route('/api/rutas/<int:ruta_id>', methods=['DELETE'])
def delete_ruta(ruta_id):
    """Elimina una ruta"""
    ruta = Ruta.query.get_or_404(ruta_id)
    
    # Verificar si tiene cooperativas asociadas
    if ruta.cooperativas:
        return jsonify({
            'error': f'No se puede eliminar la ruta. Está asociada a {len(ruta.cooperativas)} cooperativa(s)'
        }), 409
    
    db.session.delete(ruta)
    db.session.commit()
    
    return jsonify({'mensaje': 'Ruta eliminada correctamente'}), 200


# ============ APIs CRUD COOPERATIVAS ============

@app.route('/api/cooperativas', methods=['GET'])
def get_cooperativas():
    """Obtiene todas las cooperativas"""
    cooperativas = Cooperativa.query.all()
    return jsonify([c.to_dict() for c in cooperativas])


@app.route('/api/cooperativas', methods=['POST'])
def create_cooperativa():
    """Crea una nueva cooperativa con validación"""
    data = request.json
    
    # Validación de campos requeridos
    campos_requeridos = ['nombre', 'url_sitio', 'telefono_contacto', 'rutas']
    if not all(k in data for k in campos_requeridos):
        return jsonify({'error': 'Campos requeridos incompletos'}), 400
    
    # Validar que la cooperativa no exista ya
    cooperativa_existente = Cooperativa.query.filter_by(nombre=data['nombre']).first()
    if cooperativa_existente:
        return jsonify({'error': f"La cooperativa '{data['nombre']}' ya está registrada"}), 409
    
    # Validar rutas
    rutas_ids = data.get('rutas', [])
    if not rutas_ids or len(rutas_ids) == 0:
        return jsonify({'error': 'Debe seleccionar al menos una ruta'}), 400
    
    rutas = []
    for ruta_id in rutas_ids:
        ruta = Ruta.query.get(ruta_id)
        if not ruta:
            return jsonify({'error': f'Ruta {ruta_id} no encontrada'}), 404
        rutas.append(ruta)
    
    # Crear cooperativa
    nueva_cooperativa = Cooperativa(
        nombre=data['nombre'],
        url_sitio=data['url_sitio'],
        telefono_contacto=data['telefono_contacto'],
        activa=data.get('activa', True),
        rutas_rel=rutas
    )
    
    db.session.add(nueva_cooperativa)
    db.session.commit()
    
    return jsonify(nueva_cooperativa.to_dict()), 201


@app.route('/api/cooperativas/<int:coop_id>', methods=['PUT'])
def update_cooperativa(coop_id):
    """Actualiza una cooperativa"""
    cooperativa = Cooperativa.query.get_or_404(coop_id)
    data = request.json
    
    # Validar nombre único si se cambia
    if 'nombre' in data and data['nombre'] != cooperativa.nombre:
        cooperativa_existente = Cooperativa.query.filter_by(nombre=data['nombre']).first()
        if cooperativa_existente:
            return jsonify({'error': f"El nombre '{data['nombre']}' ya está en uso"}), 409
        cooperativa.nombre = data['nombre']
    
    # Actualizar otros campos
    if 'url_sitio' in data:
        cooperativa.url_sitio = data['url_sitio']
    
    if 'telefono_contacto' in data:
        cooperativa.telefono_contacto = data['telefono_contacto']
    
    if 'activa' in data:
        cooperativa.activa = data['activa']
    
    # Actualizar rutas
    if 'rutas' in data:
        rutas_nuevas_ids = data['rutas']
        rutas_actuales_ids = [r.id for r in cooperativa.rutas_rel]
        
        # Validar que las nuevas rutas no estén ya en la cooperativa
        rutas_ya_asignadas = [rid for rid in rutas_nuevas_ids if rid in rutas_actuales_ids]
        if rutas_ya_asignadas:
            return jsonify({
                #'error': f'Las rutas {rutas_ya_asignadas} ya están asignadas a esta cooperativa'
                'error': f'Existen rutas asignadas duplicadas, por favor revise'
            }), 409
        
        # Validar que existan todas las rutas
        rutas_nuevas = []
        for ruta_id in rutas_nuevas_ids:
            ruta = Ruta.query.get(ruta_id)
            if not ruta:
                return jsonify({'error': f'Ruta {ruta_id} no encontrada'}), 404
            rutas_nuevas.append(ruta)
        
        cooperativa.rutas_rel = rutas_nuevas
    
    db.session.commit()
    return jsonify(cooperativa.to_dict()), 200


@app.route('/api/cooperativas/<int:coop_id>', methods=['DELETE'])
def delete_cooperativa(coop_id):
    """Elimina una cooperativa"""
    cooperativa = Cooperativa.query.get_or_404(coop_id)
    db.session.delete(cooperativa)
    db.session.commit()
    
    return jsonify({'mensaje': 'Cooperativa eliminada correctamente'}), 200


# ============ API CIUDADES ============

@app.route('/api/ciudades', methods=['GET'])
def get_ciudades():
    """Obtiene todas las ciudades"""
    ciudades = Ciudad.query.all()
    return jsonify([c.to_dict() for c in ciudades])


# ============ MANEJO DE ERRORES ============

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Recurso no encontrado'}), 404


@app.errorhandler(500)
def internal_error(error):
    db.session.rollback()
    return jsonify({'error': 'Error interno del servidor'}), 500


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True, port=5000)
