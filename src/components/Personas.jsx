import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  UserPlus, 
  Briefcase, 
  Mail, 
  Phone, 
  MapPin, 
  Edit, 
  X, 
  History, 
  Eye, 
  FileText,
  AlertTriangle
} from 'lucide-react';

export default function Personas() {
  const { 
    tecnicos, 
    proveedores, 
    sectores,
    crearTecnico, 
    editarTecnico, 
    crearProveedor, 
    editarProveedor,
    movimientos 
  } = useApp();

  const [activeTabSub, setActiveTabSub] = useState('tecnicos'); // 'tecnicos', 'proveedores'
  
  // Modales
  const [modalAbierto, setModalAbierto] = useState(false);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [seleccionado, setSeleccionado] = useState(null);
  const [errorForm, setErrorForm] = useState('');

  // Ver historial por técnico
  const [modalHistorialAbierto, setModalHistorialAbierto] = useState(false);
  const [tecnicoHistorial, setTecnicoHistorial] = useState(null);

  // Formulario Técnico
  const [tecForm, setTecForm] = useState({
    nombre: '',
    seccion: 'General',
    telefono: '',
    email: '',
    activo: true
  });

  // Formulario Proveedor
  const [provForm, setProvForm] = useState({
    nombre: '',
    cif: '',
    telefono: '',
    email: '',
    direccion: '',
    personaContacto: '',
    observaciones: ''
  });

  const abrirCrear = () => {
    setErrorForm('');
    setModoEdicion(false);
    if (activeTabSub === 'tecnicos') {
      setTecForm({
        nombre: '',
        seccion: 'Electricidad',
        telefono: '',
        email: '',
        activo: true
      });
    } else {
      setProvForm({
        nombre: '',
        cif: '',
        telefono: '',
        email: '',
        direccion: '',
        personaContacto: '',
        observaciones: ''
      });
    }
    setModalAbierto(true);
  };

  const abrirEditar = (item) => {
    setErrorForm('');
    setModoEdicion(true);
    setSeleccionado(item);
    if (activeTabSub === 'tecnicos') {
      setTecForm({ ...item });
    } else {
      setProvForm({ ...item });
    }
    setModalAbierto(true);
  };

  const abrirHistorial = (tec) => {
    setTecnicoHistorial(tec);
    setModalHistorialAbierto(true);
  };

  const guardar = (e) => {
    e.preventDefault();
    setErrorForm('');

    try {
      if (activeTabSub === 'tecnicos') {
        if (!tecForm.nombre.trim()) {
          setErrorForm('El nombre del técnico es obligatorio.');
          return;
        }
        if (modoEdicion) {
          editarTecnico(seleccionado.id, tecForm);
        } else {
          crearTecnico(tecForm);
        }
      } else {
        if (!provForm.nombre.trim()) {
          setErrorForm('El nombre del proveedor es obligatorio.');
          return;
        }
        if (modoEdicion) {
          editarProveedor(seleccionado.id, provForm);
        } else {
          crearProveedor(provForm);
        }
      }
      setModalAbierto(false);
    } catch (err) {
      setErrorForm(err.message);
    }
  };

  // Obtener materiales retirados por técnico
  const getRetiradasTecnico = (nombreTecnico) => {
    return movimientos.filter(m => m.tipo === 'salida' && m.origenDestino === nombreTecnico);
  };

  // Obtener albaranes suministrados por proveedor
  const getSuministrosProveedor = (nombreProveedor) => {
    return movimientos.filter(m => m.tipo === 'entrada' && m.origenDestino === nombreProveedor);
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Personal & Proveedores</h2>
          <p className="text-gray-500 text-sm mt-1">Gestión de técnicos autorizados e historial de compras a proveedores.</p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          {/* Subpestañas */}
          <div className="flex bg-gray-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTabSub('tecnicos')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeTabSub === 'tecnicos' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Técnicos
            </button>
            <button
              onClick={() => setActiveTabSub('proveedores')}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeTabSub === 'proveedores' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Proveedores
            </button>
          </div>

          <button
            onClick={abrirCrear}
            className="flex items-center space-x-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            <span>Añadir Nuevo</span>
          </button>
        </div>
      </div>

      {/* SECCIÓN: TÉCNICOS */}
      {activeTabSub === 'tecnicos' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {tecnicos.map((tec) => {
            const retiradas = getRetiradasTecnico(tec.nombre);
            return (
              <div 
                key={tec.id} 
                className={`bg-white p-6 rounded-2xl shadow-xs border transition-all ${
                  tec.activo ? 'border-gray-100' : 'border-gray-200 bg-gray-50/50 opacity-75'
                }`}
              >
                <div className="flex items-start justify-between border-b border-gray-100 pb-3">
                  <div>
                    <h4 className="font-bold text-gray-900 text-lg">{tec.nombre}</h4>
                    <span className="inline-block mt-1 text-[10px] uppercase font-bold tracking-wider text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                      {tec.seccion || 'General'}
                    </span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    tec.activo ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'
                  }`}>
                    {tec.activo ? 'Activo' : 'Baja'}
                  </span>
                </div>

                <div className="py-4 space-y-2 text-sm text-gray-600">
                  {tec.telefono && (
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <span>{tec.telefono}</span>
                    </div>
                  )}
                  {tec.email && (
                    <div className="flex items-center space-x-2">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <span className="truncate">{tec.email}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs pt-2">
                    <span className="text-gray-400 font-semibold">Consumos registrados:</span>
                    <span className="font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded">
                      {retiradas.length} retiradas
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-end space-x-2">
                  <button 
                    onClick={() => abrirHistorial(tec)} 
                    className="flex items-center space-x-1 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold"
                  >
                    <History className="h-3 w-3" />
                    <span>Ver Consumos</span>
                  </button>
                  <button 
                    onClick={() => abrirEditar(tec)} 
                    className="p-1.5 hover:bg-gray-100 text-gray-500 rounded-lg"
                    title="Editar"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* SECCIÓN: PROVEEDORES */}
      {activeTabSub === 'proveedores' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
          {proveedores.map((prov) => {
            const suministros = getSuministrosProveedor(prov.nombre);
            return (
              <div key={prov.id} className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between border-b border-gray-100 pb-3 mb-4">
                    <div>
                      <h4 className="font-bold text-gray-900 text-lg">{prov.nombre}</h4>
                      <p className="text-xs font-mono text-gray-400 mt-0.5">CIF/NIF: {prov.cif || 'Sin CIF'}</p>
                    </div>
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-bold">
                      {suministros.length} entregas
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm text-gray-600">
                    {prov.telefono && (
                      <div className="flex items-center space-x-2">
                        <Phone className="h-4 w-4 text-gray-400" />
                        <span>{prov.telefono}</span>
                      </div>
                    )}
                    {prov.email && (
                      <div className="flex items-center space-x-2">
                        <Mail className="h-4 w-4 text-gray-400" />
                        <span className="truncate">{prov.email}</span>
                      </div>
                    )}
                    {prov.personaContacto && (
                      <div className="flex items-center space-x-2 col-span-2">
                        <Briefcase className="h-4 w-4 text-gray-400" />
                        <span>Contacto: {prov.personaContacto}</span>
                      </div>
                    )}
                    {prov.direccion && (
                      <div className="flex items-start space-x-2 col-span-2 mt-1">
                        <MapPin className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                        <span className="text-xs leading-relaxed">{prov.direccion}</span>
                      </div>
                    )}
                  </div>

                  {prov.observaciones && (
                    <div className="p-3 bg-gray-50 border border-gray-50 rounded-lg text-xs text-gray-500 italic mt-4">
                      {prov.observaciones}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-end mt-4">
                  <button 
                    onClick={() => abrirEditar(prov)} 
                    className="flex items-center space-x-1 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold"
                  >
                    <Edit className="h-3 w-3" />
                    <span>Editar Ficha</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: FORMULARIO CREAR / EDITAR */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-scale-up">
            <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between">
              <h3 className="text-lg font-bold">
                {activeTabSub === 'tecnicos' 
                  ? (modoEdicion ? 'Editar Técnico' : 'Añadir Técnico')
                  : (modoEdicion ? 'Editar Proveedor' : 'Añadir Proveedor')
                }
              </h3>
              <button onClick={() => setModalAbierto(false)} className="text-gray-400 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={guardar} className="p-6 space-y-4">
              {errorForm && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg font-semibold flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>{errorForm}</span>
                </div>
              )}

              {/* FORMULARIO TÉCNICOS */}
              {activeTabSub === 'tecnicos' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre Completo *</label>
                    <input
                      type="text"
                      required
                      value={tecForm.nombre}
                      onChange={(e) => setTecForm({ ...tecForm, nombre: e.target.value })}
                      placeholder="Ej. Juan Pérez"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Sector / Especialidad</label>
                    <input
                      type="text"
                      list="sectores-tecnicos-form"
                      value={tecForm.seccion}
                      onChange={(e) => setTecForm({ ...tecForm, seccion: e.target.value })}
                      placeholder="Ej. Electricidad, Fontanería..."
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-amber-500"
                    />
                    <datalist id="sectores-tecnicos-form">
                      {(sectores || []).map((sector) => <option key={sector} value={sector} />)}
                    </datalist>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Teléfono</label>
                      <input
                        type="text"
                        value={tecForm.telefono}
                        onChange={(e) => setTecForm({ ...tecForm, telefono: e.target.value })}
                        placeholder="Ej. 600123456"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</label>
                      <input
                        type="email"
                        value={tecForm.email}
                        onChange={(e) => setTecForm({ ...tecForm, email: e.target.value })}
                        placeholder="Ej. juan.perez@isivoltpro.com"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-3 pt-2">
                    <input
                      id="tecActivo"
                      type="checkbox"
                      checked={tecForm.activo}
                      onChange={(e) => setTecForm({ ...tecForm, activo: e.target.checked })}
                      className="h-5 w-5 rounded-sm border-gray-300 text-amber-600 focus:ring-amber-500"
                    />
                    <label className="text-sm font-semibold text-gray-600" htmlFor="tecActivo">
                      Técnico en Activo (Autorizado a retirar material)
                    </label>
                  </div>
                </div>
              )}

              {/* FORMULARIO PROVEEDOR */}
              {activeTabSub === 'proveedores' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nombre Comercial *</label>
                      <input
                        type="text"
                        required
                        value={provForm.nombre}
                        onChange={(e) => setProvForm({ ...provForm, nombre: e.target.value })}
                        placeholder="Ej. Saltoki"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">CIF / NIF</label>
                      <input
                        type="text"
                        value={provForm.cif}
                        onChange={(e) => setProvForm({ ...provForm, cif: e.target.value.toUpperCase() })}
                        placeholder="Ej. B31048891"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-amber-500 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Persona de Contacto</label>
                      <input
                        type="text"
                        value={provForm.personaContacto}
                        onChange={(e) => setProvForm({ ...provForm, personaContacto: e.target.value })}
                        placeholder="Ej. Alberto Ruiz"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Teléfono</label>
                      <input
                        type="text"
                        value={provForm.telefono}
                        onChange={(e) => setProvForm({ ...provForm, telefono: e.target.value })}
                        placeholder="Ej. 948203040"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Email</label>
                      <input
                        type="email"
                        value={provForm.email}
                        onChange={(e) => setProvForm({ ...provForm, email: e.target.value })}
                        placeholder="Ej. pedidos@proveedor.com"
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-amber-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Dirección Física</label>
                    <input
                      type="text"
                      value={provForm.direccion}
                      onChange={(e) => setProvForm({ ...provForm, direccion: e.target.value })}
                      placeholder="Calle, Polígono, Ciudad..."
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Observaciones</label>
                    <textarea
                      rows="2"
                      value={provForm.observaciones}
                      onChange={(e) => setProvForm({ ...provForm, observaciones: e.target.value })}
                      placeholder="Horarios de entrega, plazos de pago..."
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-amber-500 resize-none"
                    />
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setModalAbierto(false)}
                  className="px-4 py-2 text-sm font-bold text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 rounded-lg"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: HISTORIAL DE RETIRADAS DEL TÉCNICO */}
      {modalHistorialAbierto && tecnicoHistorial && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-up max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between">
              <h3 className="text-lg font-bold">Consumos de: {tecnicoHistorial.nombre}</h3>
              <button onClick={() => setModalHistorialAbierto(false)} className="text-gray-400 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              {getRetiradasTecnico(tecnicoHistorial.nombre).map(mov => (
                <div key={mov.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-xl bg-gray-50 text-xs">
                  <div>
                    <h5 className="font-bold text-gray-900 text-sm">{mov.articuloNombre}</h5>
                    <p className="text-gray-400 font-mono mt-0.5">Código: {mov.codigo} • OT/Obra: {mov.documento || '-'}</p>
                    <p className="text-gray-400 mt-0.5">Fecha: {new Date(mov.fecha).toLocaleString('es-ES')}</p>
                    {mov.observaciones && (
                      <p className="text-gray-500 italic mt-1 bg-white p-1.5 rounded border border-gray-100">Motivo: {mov.observaciones}</p>
                    )}
                  </div>
                  <div className="text-right flex flex-col items-end space-y-2">
                    <span className="font-extrabold text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
                      -{mov.cantidad} uds
                    </span>
                    {mov.firma && (
                      <img src={mov.firma} alt="Firma" className="h-8 max-w-20 object-contain bg-white border border-gray-200 rounded p-0.5" />
                    )}
                  </div>
                </div>
              ))}
              {getRetiradasTecnico(tecnicoHistorial.nombre).length === 0 && (
                <p className="text-center text-gray-400 py-12">No hay consumos registrados para este técnico.</p>
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
