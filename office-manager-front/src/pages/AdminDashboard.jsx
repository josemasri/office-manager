import React, { useState, useEffect } from 'react';
import { meetingRoomsAPI, reservationsAPI, systemConfigAPI } from '../services/api';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('rooms');
  const [rooms, setRooms] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomForm, setRoomForm] = useState({
    name: '',
    description: '',
    capacity: '',
    equipment: '',
    hourlyRate: '',
  });
  
  // System config states
  const [systemConfig, setSystemConfig] = useState({
    timezone: 'America/Mexico_City',
  });
  const [configLoading, setConfigLoading] = useState(false);

  useEffect(() => {
    if (activeTab === 'rooms') {
      fetchRooms();
    } else if (activeTab === 'reservations') {
      fetchReservations();
    } else if (activeTab === 'settings') {
      fetchSystemConfig();
    }
  }, [activeTab]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      const response = await meetingRoomsAPI.getAll();
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      setLoading(true);
      const response = await reservationsAPI.getAll();
      setReservations(response.data);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemConfig = async () => {
    try {
      setConfigLoading(true);
      const response = await systemConfigAPI.getTimezone();
      setSystemConfig(prev => ({
        ...prev,
        timezone: response.data.timezone,
      }));
    } catch (error) {
      console.error('Error fetching system config:', error);
    } finally {
      setConfigLoading(false);
    }
  };

  const handleTimezoneUpdate = async (newTimezone) => {
    try {
      setConfigLoading(true);
      await systemConfigAPI.updateTimezone(newTimezone);
      setSystemConfig(prev => ({
        ...prev,
        timezone: newTimezone,
      }));
      alert('Zona horaria actualizada exitosamente');
    } catch (error) {
      console.error('Error updating timezone:', error);
      alert('Error al actualizar la zona horaria');
    } finally {
      setConfigLoading(false);
    }
  };

  const handleCreateRoom = () => {
    setEditingRoom(null);
    setRoomForm({
      name: '',
      description: '',
      capacity: '',
      equipment: '',
      hourlyRate: '',
    });
    setShowRoomModal(true);
  };

  const handleEditRoom = (room) => {
    setEditingRoom(room);
    setRoomForm({
      name: room.name,
      description: room.description || '',
      capacity: room.capacity.toString(),
      equipment: room.equipment ? room.equipment.join(', ') : '',
      hourlyRate: room.hourlyRate.toString(),
    });
    setShowRoomModal(true);
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta sala?')) {
      return;
    }

    try {
      await meetingRoomsAPI.delete(roomId);
      await fetchRooms();
    } catch (error) {
      console.error('Error deleting room:', error);
      alert('Error al eliminar la sala');
    }
  };

  const handleRoomSubmit = async (e) => {
    e.preventDefault();

    const roomData = {
      name: roomForm.name,
      description: roomForm.description,
      capacity: parseInt(roomForm.capacity),
      equipment: roomForm.equipment ? roomForm.equipment.split(',').map(item => item.trim()) : [],
      hourlyRate: parseFloat(roomForm.hourlyRate),
    };

    try {
      if (editingRoom) {
        await meetingRoomsAPI.update(editingRoom.id, roomData);
      } else {
        await meetingRoomsAPI.create(roomData);
      }
      setShowRoomModal(false);
      await fetchRooms();
    } catch (error) {
      console.error('Error saving room:', error);
      alert('Error al guardar la sala');
    }
  };

  const closeRoomModal = () => {
    setShowRoomModal(false);
    setEditingRoom(null);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Panel de Administración</h1>
          <p className="mt-2 text-sm text-gray-700">
            Administra salas de reuniones y ve todas las reservaciones.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rooms'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Salas de Reuniones
          </button>
          <button
            onClick={() => setActiveTab('reservations')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reservations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Todas las Reservaciones
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Configuración del Sistema
          </button>
        </nav>
      </div>

      {/* Rooms Tab */}
      {activeTab === 'rooms' && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={handleCreateRoom}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Agregar Sala
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {rooms.map((room) => (
                  <li key={room.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m11 0v-3.87a3.37 3.37 0 00-.94-2.61c-.26-.29-.68-.52-1.26-.52H9.74c-.58 0-1.04.2-1.3.45A4.92 4.92 0 007.5 17" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <p className="text-lg font-medium text-gray-900">{room.name}</p>
                            <p className="text-sm text-gray-600">
                              Capacidad: {room.capacity} • Tarifa: ${room.hourlyRate}/hora
                            </p>
                            {room.description && (
                              <p className="text-sm text-gray-500 mt-1">{room.description}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEditRoom(room)}
                            className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDeleteRoom(room.id)}
                            className="text-red-600 hover:text-red-900 text-sm font-medium"
                          >
                            Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Reservations Tab */}
      {activeTab === 'reservations' && (
        <div className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="bg-white shadow overflow-hidden sm:rounded-md">
              <ul className="divide-y divide-gray-200">
                {reservations.map((reservation) => (
                  <li key={reservation.id}>
                    <div className="px-4 py-4 sm:px-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="flex items-center">
                              <p className="text-lg font-medium text-gray-900">
                                {reservation.room?.name || `Room ${reservation.roomId}`}
                              </p>
                              <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(reservation.status)}`}>
                                {reservation.status === 'confirmed' ? 'confirmada' :
                                 reservation.status === 'cancelled' ? 'cancelada' :
                                 reservation.status === 'pending' ? 'pendiente' : reservation.status}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">
                              Usuario: {reservation.user?.firstName} {reservation.user?.lastName} ({reservation.user?.email})
                            </p>
                            <p className="text-sm text-gray-500">
                              {formatDate(reservation.startTime)} - {formatDate(reservation.endTime)} • {reservation.totalHours}h
                            </p>
                            {reservation.purpose && (
                              <p className="text-sm text-gray-500 mt-1">{reservation.purpose}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* System Settings Tab */}
      {activeTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Configuración del Sistema</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">
                Configura las configuraciones globales del sistema para el administrador de oficina.
              </p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:px-6">
              <div className="space-y-6">
                {/* Timezone Configuration */}
                <div>
                  <h4 className="text-base font-medium text-gray-900 mb-4">Configuración de Zona Horaria</h4>
                  <div className="max-w-md">
                    <label htmlFor="timezone" className="block text-sm font-medium text-gray-700 mb-2">
                      Zona Horaria del Sistema
                    </label>
                    <select
                      id="timezone"
                      value={systemConfig.timezone}
                      onChange={(e) => handleTimezoneUpdate(e.target.value)}
                      disabled={configLoading}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:opacity-50"
                    >
                      <option value="America/Mexico_City">America/Mexico_City (GMT-6)</option>
                      <option value="America/New_York">America/New_York (EST/EDT)</option>
                      <option value="America/Los_Angeles">America/Los_Angeles (PST/PDT)</option>
                      <option value="America/Chicago">America/Chicago (CST/CDT)</option>
                      <option value="America/Denver">America/Denver (MST/MDT)</option>
                      <option value="Europe/London">Europe/London (GMT/BST)</option>
                      <option value="Europe/Paris">Europe/Paris (CET/CEST)</option>
                      <option value="Asia/Tokyo">Asia/Tokyo (JST)</option>
                      <option value="Asia/Shanghai">Asia/Shanghai (CST)</option>
                      <option value="UTC">UTC</option>
                    </select>
                    <p className="mt-2 text-sm text-gray-500">
                      Esta zona horaria se utilizará para todas las validaciones de fecha y hora en el sistema.
                      Los cambios afectan las validaciones de reservación y las visualizaciones de tiempo en todo el sistema.
                    </p>
                    {configLoading && (
                      <div className="mt-2 flex items-center text-sm text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Actualizando zona horaria...
                      </div>
                    )}
                  </div>
                </div>

                {/* Current Time Display */}
                <div>
                  <h4 className="text-base font-medium text-gray-900 mb-4">Hora Actual del Sistema</h4>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700">Hora Local (Navegador)</p>
                        <p className="text-lg text-gray-900">{new Date().toLocaleString()}</p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">Hora del Sistema ({systemConfig.timezone})</p>
                        <p className="text-lg text-gray-900">
                          {new Date().toLocaleString('es-MX', { timeZone: systemConfig.timezone })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Room Modal */}
      {showRoomModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingRoom ? 'Editar Sala' : 'Crear Nueva Sala'}
              </h3>
              <form onSubmit={handleRoomSubmit} className="space-y-4">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Nombre de la Sala
                  </label>
                  <input
                    type="text"
                    id="name"
                    required
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={roomForm.name}
                    onChange={(e) => setRoomForm({ ...roomForm, name: e.target.value })}
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                    Descripción
                  </label>
                  <textarea
                    id="description"
                    rows={3}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={roomForm.description}
                    onChange={(e) => setRoomForm({ ...roomForm, description: e.target.value })}
                  />
                </div>
                
                <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-gray-700">
                    Capacidad
                  </label>
                  <input
                    type="number"
                    id="capacity"
                    required
                    min="1"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={roomForm.capacity}
                    onChange={(e) => setRoomForm({ ...roomForm, capacity: e.target.value })}
                  />
                </div>
                
                <div>
                  <label htmlFor="equipment" className="block text-sm font-medium text-gray-700">
                    Equipo (separado por comas)
                  </label>
                  <input
                    type="text"
                    id="equipment"
                    placeholder="Proyector, Pizarra, Videoconferencia"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={roomForm.equipment}
                    onChange={(e) => setRoomForm({ ...roomForm, equipment: e.target.value })}
                  />
                </div>
                
                <div>
                  <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">
                    Tarifa por Hora ($)
                  </label>
                  <input
                    type="number"
                    id="hourlyRate"
                    required
                    min="0"
                    step="0.01"
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    value={roomForm.hourlyRate}
                    onChange={(e) => setRoomForm({ ...roomForm, hourlyRate: e.target.value })}
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={closeRoomModal}
                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {editingRoom ? 'Actualizar' : 'Crear'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;