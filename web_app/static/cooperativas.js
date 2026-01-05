// ============================================
// GESTIÓN DE COOPERATIVAS - JavaScript
// ============================================

let todasLasRutasDisponibles = [];
let todasLasCooperativas = [];
let rutasSeleccionadas = [];
let coopEnEdicion = null;

// ============================================
// INICIALIZACIÓN
// ============================================

document.addEventListener('DOMContentLoaded', function() {
    cargarRutas();
    cargarCooperativas();
    
    // Event listeners
    document.getElementById('formCooperativa').addEventListener('submit', manejarSubmitFormulario);
    document.getElementById('btnCancelarCoop').addEventListener('click', limpiarFormulario);
    document.getElementById('buscarCoop').addEventListener('input', filtrarCooperativas);
    
    // Modal
    const modal = document.getElementById('modalDetalles');
    const closeBtn = document.querySelector('.close');
    closeBtn.onclick = function() {
        modal.classList.remove('show');
    }
    window.onclick = function(event) {
        if (event.target === modal) {
            modal.classList.remove('show');
        }
    }
});

// ============================================
// CARGAR RUTAS
// ============================================

function cargarRutas() {
    fetch('/api/rutas')
        .then(response => response.json())
        .then(data => {
            todasLasRutasDisponibles = data;
            llenarRutasDisponibles();
        })
        .catch(error => {
            console.error('Error al cargar rutas:', error);
            mostrarAlerta('Error al cargar las rutas', 'error');
        });
}

function llenarRutasDisponibles() {
    const contenedor = document.getElementById('rutasDisponibles');
    contenedor.innerHTML = '<h4>Rutas Disponibles:</h4>';
    
    if (todasLasRutasDisponibles.length === 0) {
        contenedor.innerHTML += '<p style="color: #7f8c8d; font-size: 0.9em;">No hay rutas disponibles. Crea rutas primero.</p>';
        return;
    }
    
    todasLasRutasDisponibles.forEach(ruta => {
        const div = document.createElement('div');
        div.className = 'ruta-item';
        div.id = `ruta-${ruta.id}`;
        div.innerHTML = `
            <input type="checkbox" value="${ruta.id}" class="ruta-checkbox" 
                   onchange="toggleRuta(${ruta.id}, this.checked)">
            <label>
                <strong>${ruta.origen_nombre}</strong> → <strong>${ruta.destino_nombre}</strong>
                <br><small>$${ruta.precio.toFixed(2)} | ${ruta.duracion_horas}h</small>
            </label>
        `;
        contenedor.appendChild(div);
    });
}

// ============================================
// CARGAR COOPERATIVAS
// ============================================

function cargarCooperativas() {
    fetch('/api/cooperativas')
        .then(response => response.json())
        .then(data => {
            todasLasCooperativas = data;
            mostrarCooperativas(data);
            actualizarContador();
        })
        .catch(error => {
            console.error('Error al cargar cooperativas:', error);
            mostrarAlerta('Error al cargar las cooperativas', 'error');
        });
}

function mostrarCooperativas(cooperativas) {
    const tbody = document.getElementById('tbodyCoops');
    const sinDatos = document.getElementById('sinDatos');
    
    tbody.innerHTML = '';
    
    if (cooperativas.length === 0) {
        sinDatos.classList.add('show');
    } else {
        sinDatos.classList.remove('show');
        
        cooperativas.forEach(coop => {
            const estado = coop.activa ? 'Activa' : 'Inactiva';
            const claseEstado = coop.activa ? 'estado-activo' : 'estado-inactivo';
            const numRutas = coop.rutas.length;
            
            const fila = document.createElement('tr');
            fila.innerHTML = `
                <td>${coop.nombre}</td>
                <td><a href="${coop.url_sitio}" target="_blank">${coop.url_sitio}</a></td>
                <td>${coop.telefono_contacto}</td>
                <td><span class="${claseEstado}">${estado}</span></td>
                <td>
                    <button class="btn btn-info" onclick="verRutas(${coop.id})">${numRutas} ruta(s)</button>
                </td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-info" onclick="editarCooperativa(${coop.id})">✏️ Editar</button>
                        <button class="btn btn-danger" onclick="eliminarCooperativa(${coop.id})">🗑️ Eliminar</button>
                    </div>
                </td>
            `;
            tbody.appendChild(fila);
        });
    }
}

function actualizarContador() {
    document.getElementById('totalCoops').textContent = `Total: ${todasLasCooperativas.length}`;
}

// ============================================
// SELECCIÓN DE RUTAS
// ============================================

function toggleRuta(rutaId, isChecked) {
    const item = document.getElementById(`ruta-${rutaId}`);
    const lista = document.getElementById('listaRutasSeleccionadas');
    
    if (isChecked) {
        // Agregar a seleccionadas
        if (!rutasSeleccionadas.includes(rutaId)) {
            rutasSeleccionadas.push(rutaId);
        }
        item.classList.add('seleccionado');
        
        // Agregar a la lista visual
        const ruta = todasLasRutasDisponibles.find(r => r.id === rutaId);
        const li = document.createElement('li');
        li.id = `seleccionada-${rutaId}`;
        li.textContent = `${ruta.origen_nombre} → ${ruta.destino_nombre}`;
        lista.appendChild(li);
    } else {
        // Remover de seleccionadas
        rutasSeleccionadas = rutasSeleccionadas.filter(id => id !== rutaId);
        item.classList.remove('seleccionado');
        
        // Remover de la lista visual
        const li = document.getElementById(`seleccionada-${rutaId}`);
        if (li) li.remove();
    }
}

// ============================================
// FORMULARIO
// ============================================

function manejarSubmitFormulario(e) {
    e.preventDefault();
    
    const nombre = document.getElementById('nombre').value.trim();
    const url = document.getElementById('url').value.trim();
    const telefono = document.getElementById('telefono').value.trim();
    const activa = document.getElementById('activa').checked;
    
    // Validaciones
    if (!nombre || !url || !telefono) {
        mostrarAlerta('Por favor completa todos los campos', 'error');
        return;
    }
    
    if (rutasSeleccionadas.length === 0) {
        mostrarAlerta('Debes seleccionar al menos una ruta', 'error');
        return;
    }
    
    // Validar URL
    try {
        new URL(url);
    } catch (e) {
        mostrarAlerta('La URL no es válida', 'error');
        return;
    }
    
    const datos = {
        nombre,
        url_sitio: url,
        telefono_contacto: telefono,
        activa,
        rutas: rutasSeleccionadas
    };
    
    if (coopEnEdicion) {
        actualizarCooperativa(coopEnEdicion, datos);
    } else {
        crearCooperativa(datos);
    }
}

function crearCooperativa(datos) {
    fetch('/api/cooperativas', {
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
    .then(coop => {
        mostrarAlerta('✓ Cooperativa creada exitosamente', 'success');
        limpiarFormulario();
        cargarCooperativas();
    })
    .catch(error => {
        console.error('Error al crear cooperativa:', error);
        mostrarAlerta(error.error || 'Error al crear la cooperativa', 'error');
    });
}

function editarCooperativa(coopId) {
    const coop = todasLasCooperativas.find(c => c.id === coopId);
    
    if (coop) {
        document.getElementById('coopId').value = coop.id;
        document.getElementById('nombre').value = coop.nombre;
        document.getElementById('url').value = coop.url_sitio;
        document.getElementById('telefono').value = coop.telefono_contacto;
        document.getElementById('activa').checked = coop.activa;
        
        // Limpiar selección anterior
        rutasSeleccionadas = [];
        document.getElementById('listaRutasSeleccionadas').innerHTML = '';
        document.querySelectorAll('.ruta-item').forEach(item => item.classList.remove('seleccionado'));
        document.querySelectorAll('.ruta-checkbox').forEach(checkbox => checkbox.checked = false);
        
        // Seleccionar las rutas actuales
        coop.rutas.forEach(ruta => {
            toggleRuta(ruta.id, true);
        });
        
        coopEnEdicion = coopId;
        document.querySelector('h2').textContent = 'Editar Cooperativa';
        document.getElementById('btnGuardarCoop').textContent = 'Guardar Cambios';
        
        // Scroll al formulario
        document.querySelector('.form-section').scrollIntoView({ behavior: 'smooth' });
    }
}

function actualizarCooperativa(coopId, datos) {
    fetch(`/api/cooperativas/${coopId}`, {
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
    .then(coop => {
        mostrarAlerta('✓ Cooperativa actualizada exitosamente', 'success');
        limpiarFormulario();
        cargarCooperativas();
    })
    .catch(error => {
        console.error('Error al actualizar cooperativa:', error);
        mostrarAlerta(error.error || 'Error al actualizar la cooperativa', 'error');
    });
}

function eliminarCooperativa(coopId) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta cooperativa?')) {
        return;
    }
    
    fetch(`/api/cooperativas/${coopId}`, {
        method: 'DELETE'
    })
    .then(response => {
        if (!response.ok) {
            return response.json().then(err => Promise.reject(err));
        }
        return response.json();
    })
    .then(data => {
        mostrarAlerta('✓ Cooperativa eliminada exitosamente', 'success');
        cargarCooperativas();
    })
    .catch(error => {
        console.error('Error al eliminar cooperativa:', error);
        mostrarAlerta(error.error || 'Error al eliminar la cooperativa', 'error');
    });
}

function limpiarFormulario() {
    document.getElementById('formCooperativa').reset();
    document.getElementById('coopId').value = '';
    rutasSeleccionadas = [];
    document.getElementById('listaRutasSeleccionadas').innerHTML = '';
    document.querySelectorAll('.ruta-item').forEach(item => item.classList.remove('seleccionado'));
    document.querySelectorAll('.ruta-checkbox').forEach(checkbox => checkbox.checked = false);
    
    coopEnEdicion = null;
    document.querySelector('h2').textContent = 'Crear Nueva Cooperativa';
    document.getElementById('btnGuardarCoop').textContent = 'Guardar Cooperativa';
    limpiarAlerta();
}

// ============================================
// VER RUTAS Y BÚSQUEDA
// ============================================

function verRutas(coopId) {
    const coop = todasLasCooperativas.find(c => c.id === coopId);
    
    if (coop) {
        const lista = document.getElementById('listaRutasModal');
        lista.innerHTML = '';
        
        if (coop.rutas.length === 0) {
            lista.innerHTML = '<li>Sin rutas asignadas</li>';
        } else {
            coop.rutas.forEach(ruta => {
                const li = document.createElement('li');
                li.textContent = `${ruta.origen_nombre} → ${ruta.destino_nombre} | $${ruta.precio.toFixed(2)} | ${ruta.duracion_horas}h`;
                lista.appendChild(li);
            });
        }
        
        document.getElementById('modalDetalles').classList.add('show');
    }
}

function filtrarCooperativas() {
    const termino = document.getElementById('buscarCoop').value.toLowerCase();
    
    const coopsFiltradas = todasLasCooperativas.filter(coop => {
        return coop.nombre.toLowerCase().includes(termino) ||
               coop.telefono_contacto.toLowerCase().includes(termino);
    });
    
    mostrarCooperativas(coopsFiltradas);
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
