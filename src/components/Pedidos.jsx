import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Check, 
  ArrowRight, 
  Clock, 
  FileText, 
  X, 
  AlertTriangle,
  Send,
  CornerDownLeft,
  RotateCcw
} from 'lucide-react';

export default function Pedidos() {
  const { 
    articulos, 
    proveedores, 
    pedidos, 
    crearPedido, 
    actualizarPedido, 
    generarPedidoAutomatico 
  } = useApp();

  const [modalAbierto, setModalAbierto] = useState(false);
  const [modalDetalleAbierto, setModalDetalleAbierto] = useState(false);
  const [pedidoDetalle, setPedidoDetalle] = useState(null);

  // Formulario Pedido
  const [proveedor, setProveedor] = useState('');
  const [lineas, setLineas] = useState([]);
  const [observaciones, setObservaciones] = useState('');
  const [errorForm, setErrorForm] = useState('');

  // Auxiliar para añadir líneas
  const [articuloLineaId, setArticuloLineaId] = useState('');
  const [cantidadLinea, setCantidadLinea] = useState('');

  const abrirCrear = () => {
    setProveedor(proveedores[0]?.nombre || '');
    setLineas([]);
    setObservaciones('');
    setArticuloLineaId('');
    setCantidadLinea('');
    setErrorForm('');
    setModalAbierto(true);
  };

  const agregarLinea = () => {
    if (!articuloLineaId || !cantidadLinea || Number(cantidadLinea) <= 0) {
      alert('Seleccione un artículo e indique una cantidad válida.');
      return;
    }

    const art = articulos.find(a => a.id === articuloLineaId);
    if (!art) return;

    // Evitar duplicados en el formulario
    if (lineas.some(l => l.articuloId === art.id)) {
      alert('Este artículo ya ha sido añadido al pedido.');
      return;
    }

    setLineas(prev => [
      ...prev,
      {
        articuloId: art.id,
        codigo: art.codigo,
        nombre: art.nombre,
        cantidad: Number(cantidadLinea)
      }
    ]);

    // Resetear campos auxiliares
    setArticuloLineaId('');
    setCantidadLinea('');
  };

  const eliminarLinea = (idx) => {
    setLineas(prev => prev.filter((_, i) => i !== idx));
  };

  const guardarPedido = (e) => {
    e.preventDefault();
    setErrorForm('');

    if (lineas.length === 0) {
      setErrorForm('Debe añadir al menos una línea de artículo al pedido.');
      return;
    }

    try {
      crearPedido({
        proveedor,
        articulos: lineas,
        observaciones
      });
      setModalAbierto(false);
    } catch (err) {
      setErrorForm(err.message);
    }
  };

  const cambiarEstado = (id, nuevoEstado) => {
    if (confirm(`¿Deseas cambiar el estado del pedido a "${nuevoEstado}"?${nuevoEstado === 'Recibido' ? ' (Esto sumará el stock de los artículos automáticamente)' : ''}`)) {
      try {
        actualizarPedido(id, { estado: nuevoEstado });
        if (pedidoDetalle && pedidoDetalle.id === id) {
          setPedidoDetalle(prev => ({ ...prev, estado: nuevoEstado }));
        }
      } catch (err) {
        alert(err.message);
      }
    }
  };

  const getBadgeEstado = (estado) => {
    switch (estado) {
      case 'Borrador': return 'bg-gray-100 text-gray-700';
      case 'Enviado': return 'bg-blue-100 text-blue-700';
      case 'Recibido': return 'bg-green-100 text-green-700';
      case 'Parcial': return 'bg-amber-100 text-amber-700';
      case 'Cancelado': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Pedidos a Proveedores</h2>
          <p className="text-gray-500 text-sm mt-1">Realiza solicitudes de material y gestiona la recepción automática de stock.</p>
        </div>

        <div className="flex items-center space-x-2 self-start sm:self-auto">
          <button
            onClick={() => {
              if (confirm('¿Generar pedidos automáticamente para todos los artículos que estén por debajo del stock mínimo?')) {
                try {
                  generarPedidoAutomatico();
                } catch (e) {
                  alert(e.message);
                }
              }
            }}
            className="px-4 py-2.5 bg-gray-950 text-amber-500 hover:bg-gray-900 border border-gray-800 rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            Pedido Automático
          </button>
          
          <button
            onClick={abrirCrear}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
          >
            <Plus className="h-4 w-4" />
            <span>Nuevo Pedido</span>
          </button>
        </div>
      </div>

      {/* LISTADO DE PEDIDOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {pedidos.map((ped) => (
          <div key={ped.id} className="bg-white p-6 rounded-2xl shadow-xs border border-gray-100 flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <span className="text-xs font-semibold text-gray-400">{ped.fecha}</span>
                  <h4 className="font-extrabold text-gray-950 text-base">{ped.proveedor}</h4>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getBadgeEstado(ped.estado)}`}>
                  {ped.estado}
                </span>
              </div>

              <div className="py-3 text-sm text-gray-600 space-y-2">
                <div className="flex items-center justify-between">
                  <span>Líneas solicitadas:</span>
                  <span className="font-bold text-gray-800">{ped.articulos.length} artículos</span>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
              <button
                onClick={() => {
                  setPedidoDetalle(ped);
                  setModalDetalleAbierto(true);
                }}
                className="flex items-center space-x-1 px-3 py-1.5 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg text-xs font-semibold"
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Ver Pedido</span>
              </button>

              <div className="flex items-center space-x-1">
                {ped.estado === 'Borrador' && (
                  <button
                    onClick={() => cambiarEstado(ped.id, 'Enviado')}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold"
                  >
                    <Send className="h-3 w-3" />
                    <span>Enviar</span>
                  </button>
                )}
                {ped.estado === 'Enviado' && (
                  <button
                    onClick={() => cambiarEstado(ped.id, 'Recibido')}
                    className="flex items-center space-x-1 px-3 py-1.5 bg-green-50 hover:bg-green-100 text-green-600 rounded-lg text-xs font-semibold"
                  >
                    <Check className="h-3 w-3" />
                    <span>Recibir</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
        {pedidos.length === 0 && (
          <p className="col-span-full text-center text-gray-400 py-12">No hay pedidos registrados.</p>
        )}
      </div>

      {/* MODAL: CREACIÓN DE PEDIDO */}
      {modalAbierto && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-scale-up max-h-[90vh] flex flex-col">
            <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between">
              <h3 className="text-lg font-bold">Crear Pedido de Reposición</h3>
              <button onClick={() => setModalAbierto(false)} className="text-gray-400 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={guardarPedido} className="p-6 space-y-4 overflow-y-auto flex-1">
              {errorForm && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg font-semibold flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 flex-shrink-0" />
                  <span>{errorForm}</span>
                </div>
              )}

              {/* Proveedor */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Seleccionar Proveedor *</label>
                <select
                  value={proveedor}
                  onChange={(e) => setProveedor(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-amber-500 text-gray-800 font-semibold"
                >
                  {proveedores.map(p => (
                    <option key={p.id} value={p.nombre}>{p.nombre}</option>
                  ))}
                </select>
              </div>

              {/* AÑADIR LÍNEA */}
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-3">
                <h4 className="text-xs font-black text-gray-600 uppercase tracking-wider">Añadir Línea de Material</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <select
                      value={articuloLineaId}
                      onChange={(e) => setArticuloLineaId(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-hidden"
                    >
                      <option value="">Selecciona artículo...</option>
                      {articulos.filter(a => a.activo).map(a => (
                        <option key={a.id} value={a.id}>{a.codigo} - {a.nombre}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <input
                      type="number"
                      min="1"
                      placeholder="Cantidad"
                      value={cantidadLinea}
                      onChange={(e) => setCantidadLinea(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-hidden"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={agregarLinea}
                  className="w-full py-2 bg-gray-900 hover:bg-gray-800 text-white rounded-lg text-xs font-bold transition-colors"
                >
                  + Agregar Artículo al Pedido
                </button>
              </div>

              {/* LÍNEAS DEL PEDIDO */}
              <div>
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Líneas del Pedido</h4>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {lineas.map((linea, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 border border-gray-100 rounded-lg text-xs">
                      <div>
                        <span className="font-mono bg-white border px-1.5 py-0.5 rounded font-bold text-gray-700 mr-2">{linea.codigo}</span>
                        <span className="font-semibold text-gray-800">{linea.nombre}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className="font-bold text-gray-900">{linea.cantidad} uds</span>
                        <button 
                          type="button" 
                          onClick={() => eliminarLinea(idx)}
                          className="p-1 hover:bg-red-50 text-red-500 rounded"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {lineas.length === 0 && (
                    <p className="text-center text-sm text-gray-400 py-6">No hay artículos cargados en el pedido.</p>
                  )}
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Notas / Observaciones</label>
                <textarea
                  rows="2"
                  value={observaciones}
                  onChange={(e) => setObservaciones(e.target.value)}
                  placeholder="Detalles sobre facturación, plazos acordados..."
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-hidden focus:border-amber-500 resize-none"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end">
                <div className="flex items-center space-x-2">
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
                    Guardar Pedido
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: DETALLE DE PEDIDO */}
      {modalDetalleAbierto && pedidoDetalle && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 no-print">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden animate-scale-up max-h-[85vh] flex flex-col">
            <div className="px-6 py-4 bg-gray-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Detalles del Pedido</h3>
                <p className="text-[10px] text-gray-400 font-mono mt-0.5">ID: {pedidoDetalle.id}</p>
              </div>
              <button onClick={() => setModalDetalleAbierto(false)} className="text-gray-400 hover:text-white">
                <X className="h-6 w-6" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <span className="text-xs text-gray-400">Proveedor</span>
                  <h4 className="font-extrabold text-gray-900 text-base">{pedidoDetalle.proveedor}</h4>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getBadgeEstado(pedidoDetalle.estado)}`}>
                  {pedidoDetalle.estado}
                </span>
              </div>

              {/* LÍNEAS */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Artículos Solicitados</h4>
                <div className="divide-y divide-gray-100 border border-gray-100 rounded-xl overflow-hidden">
                  {pedidoDetalle.articulos.map((art, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50/50 text-xs">
                      <div>
                        <span className="font-mono bg-white border px-1.5 py-0.5 rounded font-bold text-gray-700 mr-2">{art.codigo}</span>
                        <span className="font-semibold text-gray-800">{art.nombre}</span>
                      </div>
                      <span className="font-bold text-gray-900">{art.cantidad} uds</span>
                    </div>
                  ))}
                </div>
              </div>

              {pedidoDetalle.observaciones && (
                <div className="p-3 bg-gray-50 rounded-lg text-xs text-gray-500 italic">
                  Observaciones: {pedidoDetalle.observaciones}
                </div>
              )}

            </div>

            {/* BOTONES ACCION EN DETALLE */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end space-x-2">
              {pedidoDetalle.estado === 'Borrador' && (
                <button
                  onClick={() => cambiarEstado(pedidoDetalle.id, 'Enviado')}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Marcar como Enviado
                </button>
              )}
              {pedidoDetalle.estado === 'Enviado' && (
                <button
                  onClick={() => cambiarEstado(pedidoDetalle.id, 'Recibido')}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Recibir Stock e Ingresar
                </button>
              )}
              {pedidoDetalle.estado !== 'Recibido' && pedidoDetalle.estado !== 'Cancelado' && (
                <button
                  onClick={() => cambiarEstado(pedidoDetalle.id, 'Cancelado')}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-bold shadow-xs"
                >
                  Cancelar Pedido
                </button>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
