// ============================================
// GESTIÓN DE RUTAS - JavaScript
// ============================================

let todasLasCiudades = [];
let todasLasRutas = [];
let rutaEnEdicion = null;

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    cargarCiudades();
    cargarRutas();
    
    // Event listeners
    document.getElementById('formRuta').addEventListener('submit', manejarSubmitFormulario);
    document.getElementById('btnCancelar').addEventListener('click', limpiarFormulario);
    document.getElementById('buscarRuta').addEventListener('input', filtrarRutas);
});

// ============================================
// CARGAR CIUDADES
// ============================================

function cargarCiudades() {
    fetch('/api/ciudades')
        .then(response => response.json())
        .then(data => {
            todasLasCiudades = data;
            llenarSelectsCiudades();
        })
        .catch(error => {
            console.error('Error al cargar ciudades:', error);
            mostrarAlerta('Error al cargar las ciudades', 'error');
        });
}

function llenarSelectsCiudades() {
    const selectOrigen = document.getElementById('origen');
    const selectDestino = document.getElementById('destino');
    
    // Limpiar opciones excepto la primera
    selectOrigen.innerHTML = '<option value="">-- Seleccionar ciudad --</option>';
    selectDestino.innerHTML = '<option value="">-- Seleccionar ciudad --</option>';
    
    // Agregar opciones
    todasLasCiudades.forEach(ciudad => {
        const opcionOrigen = document.createElement('option');
        opcionOrigen.value = ciudad.id;
        opcionOrigen.textContent = ciudad.nombre;
        selectOrigen.appendChild(opcionOrigen);
        
        const opcionDestino = document.createElement('option');
        opcionDestino.value = ciudad.id;
        opcionDestino.textContent = ciudad.nombre;
        selectDestino.appendChild(opcionDestino);
    });
}

// ============================================
// CARGAR RUTAS
// ============================================

function cargarRutas() {
    fetch('/api/rutas')
        .then(response => response.json())
        .then(data => {
            todasLasRutas = data;
            mostrarRutas(data);
            actualizarContador();
        })
        .catch(error => {
            console.error('Error al cargar rutas:', error);
            mostrarAlerta('Error al cargar las rutas', 'error');
        });
}

function mostrarRutas(rutas) {
    const tbody = document.getElementById('tbody');
    const sinDatos = document.getElementById('sinDatos');
    
    tbody.innerHTML = '';
    
    if (rutas.length === 0) {
        sinDatos.classList.add('show');
    } else {
        sinDatos.classList.remove('show');
        
        rutas.forEach(ruta => {
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${ruta.origen_nombre}</td>
                <td>${ruta.destino_nombre}</td>
                <td>$${ruta.precio.toFixed(2)}</td>
                <td>${ruta.duracion_horas}h</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-info" onclick="editarRuta(${ruta.id})">✏️ Editar</button>
                        <button class="btn btn-danger" onclick="eliminarRuta(${ruta.id})">🗑️ Eliminar</button>
                    </div>
                </td>
            `;
            tbody.appendChild(fila);
        });
    }
}

function actualizarContador() {
    document.getElementById('totalRutas').textContent = `Total: ${todasLasRutas.length}`;
}

// ============================================
// FORMULARIO
// ============================================

function manejarSubmitFormulario(e) {
    e.preventDefault();
    
    const origen_id = parseInt(document.getElementById('origen').value);
    const destino_id = parseInt(document.getElementById('destino').value);
    const precio = parseFloat(document.getElementById('precio').value);
    const duracion_horas = parseFloat(document.getElementById('duracion').value);
    
    // Validaciones del lado del cliente
    if (!origen_id || !destino_id || !precio || !duracion_horas) {
        mostrarAlerta('Por favor completa todos los campos', 'error');
        return;
    }
    
    if (origen_id === destino_id) {
        mostrarAlerta('La ciudad de origen y destino no pueden ser iguales', 'error');
        return;
    }
    
    if (precio <= 0 || duracion_horas <= 0) {
        mostrarAlerta('El precio y duración deben ser mayores a 0', 'error');
        return;
    }
    
    const datos = {
        origen_id,
        destino_id,
        precio,
        duracion_horas
    };
    
    if (rutaEnEdicion) {
        actualizarRuta(rutaEnEdicion, datos);
    } else {
        crearRuta(datos);
    }
}

function crearRuta(datos) {
    fetch('/api/rutas', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
        }
        return response.json();
    })
    .then(ruta => {
        mostrarAlerta('✓ Ruta creada exitosamente', 'success');
        limpiarFormulario();
        cargarRutas();
    })
    .catch(error => {
        console.error('Error al crear ruta:', error);
        mostrarAlerta(error.error || 'Error al crear la ruta', 'error');
    });
}

function editarRuta(rutaId) {
    const ruta = todasLasRutas.find(r => r.id === rutaId);
    
    if (ruta) {
        document.getElementById('rutaId').value = ruta.id;
        document.getElementById('origen').value = ruta.origen_id;
        document.getElementById('destino').value = ruta.destino_id;
        document.getElementById('precio').value = ruta.precio;
        document.getElementById('duracion').value = ruta.duracion_horas;
        
        rutaEnEdicion = rutaId;
        document.querySelector('h2').textContent = 'Editar Ruta';
        document.getElementById('btnGuardar').textContent = 'Guardar Cambios';
        
        // Scroll al formulario
        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    }
}

function actualizarRuta(rutaId, datos) {
    fetch(`/api/rutas/${rutaId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(datos)
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
        }
        return response.json();
    })
    .then(ruta => {
        mostrarAlerta('✓ Ruta actualizada exitosamente', 'success');
        limpiarFormulario();
        cargarRutas();
    })
    .catch(error => {
        console.error('Error al actualizar ruta:', error);
        mostrarAlerta(error.error || 'Error al actualizar la ruta', 'error');
    });
}

function eliminarRuta(rutaId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta ruta?')) {
        return;
    }
    
    fetch(`/api/rutas/${rutaId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
        }
        return response.json();
    })
    .then(data => {
        mostrarAlerta('✓ Ruta eliminada exitosamente', 'success');
        cargarRutas();
    })
    .catch(error => {
        console.error('Error al eliminar ruta:', error);
        mostrarAlerta(error.error || 'Error al eliminar la ruta', 'error');
    });
}

function limpiarFormulario() {
    document.getElementById('formRuta').reset();
    document.getElementById('rutaId').value = '';
    rutaEnEdicion = null;
    document.querySelector('h2').textContent = 'Crear Nueva Ruta';
    document.getElementById('btnGuardar').textContent = 'Guardar Ruta';
    limpiarAlerta();
}

// ============================================
// BÚSQUEDA Y FILTRADO
// ============================================

function filtrarRutas() {
    const termino = document.getElementById('buscarRuta').value.toLowerCase();
    
    const rutasFiltradas = todasLasRutas.filter(ruta => {
        const origen = ruta.origen_nombre.toLowerCase();
        const destino = ruta.destino_nombre.toLowerCase();
        
        return origen.includes(termino) || destino.includes(termino);
    });
    
    mostrarRutas(rutasFiltradas);
}

// ============================================
// ALERTAS
// ============================================

function mostrarAlerta(mensaje, tipo = 'info') {
    const alerta = document.getElementById('mensajeAlerta');
    alerta.textContent = mensaje;
    alerta.className = `alert show alert-${tipo}`;
    
    // Auto-ocultar después de 5 segundos
    setTimeout(() => {
        limpiarAlerta();
    }, 5000);
}

function limpiarAlerta() {
    const alerta = document.getElementById('mensajeAlerta');
    alerta.className = 'alert';
    alerta.textContent = '';
}
