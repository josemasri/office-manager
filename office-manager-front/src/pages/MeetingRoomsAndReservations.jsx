import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { meetingRoomsAPI, reservationsAPI } from '../services/api';

const MeetingRoomsAndReservations = () => {
  const location = useLocation();
  
  // Estados generales - determinar pestaña activa basada en la ruta
  const [activeTab, setActiveTab] = useState(
    location.pathname === '/reservations' ? 'reservations' : 'rooms'
  );
  
  // Estados para Salas de Reuniones
  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(true);
  const [roomsError, setRoomsError] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    startTime: '',
    duration: 1,
    purpose: '',
  });
  const [bookingLoading, setBookingLoading] = useState(false);
  
  // Estados para el calendario por bloques
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [calendarReservations, setCalendarReservations] = useState([]);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  
  // Estados para Reservaciones
  const [reservations, setReservations] = useState([]);
  const [reservationsLoading, setReservationsLoading] = useState(true);
  const [reservationsError, setReservationsError] = useState('');
  
  // Horarios de trabajo (9 AM a 6 PM)
  const workingHours = Array.from({ length: 9 }, (_, i) => i + 9);

  useEffect(() => {
    fetchRooms();
    fetchReservations();
  }, []);

  // Efecto para cambiar la pestaña basada en la ruta
  useEffect(() => {
    if (location.pathname === '/reservations') {
      setActiveTab('reservations');
    } else {
      setActiveTab('rooms');
    }
  }, [location.pathname]);

  useEffect(() => {
    if (selectedDate) {
      fetchReservationsForDate();
    }
  }, [selectedDate]);

  // Funciones para Salas de Reuniones
  const fetchRooms = async () => {
    try {
      setRoomsLoading(true);
      const response = await meetingRoomsAPI.getAll();
      setRooms(response.data);
    } catch (error) {
      setRoomsError('Error al obtener las salas de reuniones');
      console.error('Error fetching rooms:', error);
    } finally {
      setRoomsLoading(false);
    }
  };

  const fetchReservationsForDate = async () => {
    try {
      setCalendarLoading(true);
      const response = await reservationsAPI.getAll();
      const dateReservations = response.data.filter(reservation => {
        const reservationDate = new Date(reservation.startTime).toISOString().split('T')[0];
        return reservationDate === selectedDate && reservation.status === 'confirmed';
      });
      setCalendarReservations(dateReservations);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setCalendarLoading(false);
    }
  };

  const isBlockReserved = (roomId, hour) => {
    return calendarReservations.some(reservation => {
      const startHour = new Date(reservation.startTime).getHours();
      const endHour = new Date(reservation.endTime).getHours();
      return reservation.roomId === roomId && hour >= startHour && hour < endHour;
    });
  };

  const isBlockInPast = (hour) => {
    const now = new Date();
    const blockDate = new Date(selectedDate + 'T00:00:00');
    blockDate.setHours(hour, 0, 0, 0);
    
    const today = new Date().toISOString().split('T')[0];
    if (selectedDate === today) {
      return blockDate < now;
    }
    
    return false;
  };

  const formatHour = (hour) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const getCurrentDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const getMaxBookingDate = () => {
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    return maxDate.toISOString().split('T')[0];
  };

  const navigateDate = (direction) => {
    const currentDate = new Date(selectedDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);

    if (direction === 'prev') {
      const prevDate = new Date(currentDate);
      prevDate.setDate(prevDate.getDate() - 1);
      if (prevDate >= today) {
        setSelectedDate(prevDate.toISOString().split('T')[0]);
      }
    } else if (direction === 'next') {
      const nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + 1);
      if (nextDate <= maxDate) {
        setSelectedDate(nextDate.toISOString().split('T')[0]);
      }
    }
  };

  const canNavigatePrev = () => {
    const currentDate = new Date(selectedDate + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const prevDate = new Date(currentDate);
    prevDate.setDate(prevDate.getDate() - 1);
    return prevDate >= today;
  };

  const canNavigateNext = () => {
    const currentDate = new Date(selectedDate + 'T00:00:00');
    const maxDate = new Date();
    maxDate.setDate(maxDate.getDate() + 7);
    const nextDate = new Date(currentDate);
    nextDate.setDate(nextDate.getDate() + 1);
    return nextDate <= maxDate;
  };

  const handleBookRoom = (room) => {
    setSelectedRoom(room);
    setShowBookingModal(true);
    const today = getCurrentDate();
    setSelectedDate(today);
    
    setBookingForm({
      startTime: '',
      duration: 1,
      purpose: '',
    });
  };

  const handleBlockClick = (room, hour) => {
    if (isBlockReserved(room.id, hour) || isBlockInPast(hour)) {
      return;
    }

    setSelectedBlock({ room, hour });
    setBookingForm({
      startTime: '',
      duration: 1,
      purpose: ''
    });
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBlock) return;

    setBookingLoading(true);

    try {
      const startTime = new Date(selectedDate + 'T00:00:00');
      startTime.setHours(selectedBlock.hour, 0, 0, 0);

      const reservationData = {
        roomId: selectedBlock.room.id,
        startTime: startTime.toISOString(),
        duration: 1,
        purpose: bookingForm.purpose,
      };

      await reservationsAPI.create(reservationData);
      setShowBookingModal(false);
      setSelectedRoom(null);
      setSelectedBlock(null);
      setBookingForm({ startTime: '', duration: 1, purpose: '' });
      await fetchReservationsForDate();
      await fetchReservations(); // Refrescar también las reservaciones
      alert('¡Reservación creada exitosamente!');
    } catch (error) {
      console.error('Error creating reservation:', error);
      const message = error.response?.data?.message || 'Error al crear la reservación';
      alert(message);
    } finally {
      setBookingLoading(false);
    }
  };

  const closeModal = () => {
    setShowBookingModal(false);
    setSelectedRoom(null);
    setSelectedBlock(null);
    setBookingForm({ startTime: '', duration: 1, purpose: '' });
  };

  // Funciones para Reservaciones
  const fetchReservations = async () => {
    try {
      setReservationsLoading(true);
      const response = await reservationsAPI.getMyReservations();
      setReservations(response.data);
    } catch (error) {
      setReservationsError('Error al obtener las reservaciones');
      console.error('Error fetching reservations:', error);
    } finally {
      setReservationsLoading(false);
    }
  };

  const handleCancelReservation = async (id) => {
    if (!window.confirm('¿Estás seguro de que quieres cancelar esta reservación?')) {
      return;
    }

    try {
      await reservationsAPI.cancel(id);
      await fetchReservations();
    } catch (error) {
      console.error('Error cancelling reservation:', error);
      alert('Error al cancelar la reservación');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-MX', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('es-MX', {
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

  const canCancelReservation = (reservation) => {
    const now = new Date();
    const startTime = new Date(reservation.startTime);
    return reservation.status === 'confirmed' && startTime > now;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">
            {activeTab === 'reservations' ? 'Mis Reservaciones' : 'Salas de Reuniones'}
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            {activeTab === 'reservations'
              ? 'Ve y administra todas tus reservaciones de salas de reuniones.'
              : 'Explora y reserva salas de reuniones disponibles para tus eventos.'
            }
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          <button
            onClick={() => setActiveTab('rooms')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rooms'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <svg className="inline-block w-5 h-5 mr-2 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m11 0v-3.87a3.37 3.37 0 00-.94-2.61c-.26-.29-.68-.52-1.26-.52H9.74c-.58 0-1.04.2-1.3.45A4.92 4.92 0 007.5 17" />
            </svg>
            Salas de Reuniones
          </button>
          <button
            onClick={() => setActiveTab('reservations')}
            className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'reservations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <svg className="inline-block w-5 h-5 mr-2 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            Mis Reservaciones ({reservations.length})
          </button>
        </nav>
      </div>

      {/* Contenido de Salas de Reuniones */}
      {activeTab === 'rooms' && (
        <div>
          {roomsError && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="text-sm text-red-700">{roomsError}</div>
            </div>
          )}

          {roomsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {rooms.map((room) => (
                <div key={room.id} className="bg-white overflow-hidden shadow rounded-lg">
                  <div className="px-4 py-5 sm:p-6">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m11 0v-3.87a3.37 3.37 0 00-.94-2.61c-.26-.29-.68-.52-1.26-.52H9.74c-.58 0-1.04.2-1.3.45A4.92 4.92 0 007.5 17" />
                          </svg>
                        </div>
                      </div>
                      <div className="ml-5 w-0 flex-1">
                        <dl>
                          <dt className="text-sm font-medium text-gray-500 truncate">
                            {room.name}
                          </dt>
                          <dd className="text-lg font-medium text-gray-900">
                            Capacidad: {room.capacity}
                          </dd>
                        </dl>
                      </div>
                    </div>
                    
                    {room.description && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600">{room.description}</p>
                      </div>
                    )}

                    {room.equipment && room.equipment.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-900">Equipo:</h4>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {room.equipment.map((item, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="mt-4">
                      <p className="text-sm text-gray-500">
                        Tarifa: ${room.hourlyRate}/hora
                      </p>
                    </div>

                    <div className="mt-6">
                      <button
                        onClick={() => handleBookRoom(room)}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        Reservar Sala
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Contenido de Reservaciones */}
      {activeTab === 'reservations' && (
        <div>
          {reservationsError && (
            <div className="rounded-md bg-red-50 p-4 mb-6">
              <div className="text-sm text-red-700">{reservationsError}</div>
            </div>
          )}

          {reservationsLoading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
            </div>
          ) : reservations.length === 0 ? (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">Sin reservaciones</h3>
              <p className="mt-1 text-sm text-gray-500">
                Aún no tienes reservaciones. Usa la pestaña de "Salas de Reuniones" para comenzar.
              </p>
              <button
                onClick={() => setActiveTab('rooms')}
                className="mt-4 inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Explorar Salas
              </button>
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
                            <div className="w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m11 0v-3.87a3.37 3.37 0 00-.94-2.61c-.26-.29-.68-.52-1.26-.52H9.74c-.58 0-1.04.2-1.3.45A4.92 4.92 0 007.5 17" />
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
                            <div className="mt-1 flex items-center text-sm text-gray-500">
                              <svg className="mr-1.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {formatDate(reservation.startTime)} • {formatTime(reservation.startTime)} - {formatTime(reservation.endTime)}
                              <span className="ml-2 text-gray-400">•</span>
                              <span className="ml-2">{reservation.totalHours} horas</span>
                            </div>
                            {reservation.purpose && (
                              <p className="mt-1 text-sm text-gray-600">{reservation.purpose}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {canCancelReservation(reservation) && (
                            <button
                              onClick={() => handleCancelReservation(reservation.id)}
                              className="inline-flex items-center px-3 py-2 border border-red-300 shadow-sm text-sm leading-4 font-medium rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                            >
                              Cancelar
                            </button>
                          )}
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

      {/* Modal de Reservación */}
      {showBookingModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border max-w-6xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Reservar {selectedRoom?.name}
              </h3>
              
              {/* Selector de fecha con navegación y leyenda */}
              <div className="mb-6 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex-1">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fecha
                    </label>
                    <div className="flex items-center space-x-3">
                      <button
                        type="button"
                        onClick={() => navigateDate('prev')}
                        disabled={!canNavigatePrev()}
                        className={`p-2 rounded-md border ${
                          canNavigatePrev()
                            ? 'border-gray-300 hover:bg-gray-50 text-gray-700'
                            : 'border-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                        title="Día anterior"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <input
                          type="date"
                          id="date"
                          className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                          value={selectedDate}
                          min={getCurrentDate()}
                          max={getMaxBookingDate()}
                          onChange={(e) => setSelectedDate(e.target.value)}
                        />
                        <div className="mt-1 text-sm text-gray-600">
                          {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-MX', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          })}
                        </div>
                      </div>
                      
                      <button
                        type="button"
                        onClick={() => navigateDate('next')}
                        disabled={!canNavigateNext()}
                        className={`p-2 rounded-md border ${
                          canNavigateNext()
                            ? 'border-gray-300 hover:bg-gray-50 text-gray-700'
                            : 'border-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                        title="Día siguiente"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>
                  </div>
                  
                  <button
                    type="button"
                    onClick={closeModal}
                    className="ml-4 text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <div className="bg-gray-50 p-3 rounded-md">
                  <h4 className="text-sm font-medium text-gray-900 mb-2">Información</h4>
                  
                  <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded text-sm">
                    <div className="flex items-center text-blue-800">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <strong>Restricción:</strong> Solo puedes reservar desde hoy hasta 7 días en adelante
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-green-100 border border-green-200 rounded mr-2"></div>
                      <span className="text-gray-700">Disponible</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-red-100 border border-red-200 rounded mr-2"></div>
                      <span className="text-gray-700">Ocupado</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded mr-2"></div>
                      <span className="text-gray-700">No disponible</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Calendario de bloques */}
              <div className="bg-white shadow overflow-hidden rounded-lg mb-6">
                {calendarLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : (
                  <div className="p-4">
                    <div className="flex items-center mb-4 p-3 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-10 h-10 bg-blue-500 rounded-lg flex items-center justify-center">
                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m11 0v-3.87a3.37 3.37 0 00-.94-2.61c-.26-.29-.68-.52-1.26-.52H9.74c-.58 0-1.04.2-1.3.45A4.92 4.92 0 007.5 17" />
                        </svg>
                      </div>
                      <div className="ml-4">
                        <div className="text-lg font-medium text-gray-900">{selectedRoom?.name}</div>
                        <div className="text-sm text-gray-500">Capacidad: {selectedRoom?.capacity} personas</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2 max-h-[300px] overflow-y-scroll">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Selecciona un horario:</h4>
                      {workingHours.map(hour => {
                        const isReserved = isBlockReserved(selectedRoom?.id, hour);
                        const isPast = isBlockInPast(hour);
                        const isAvailable = !isReserved && !isPast;
                        
                        return (
                          <div
                            key={hour}
                            className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all cursor-pointer ${
                              isPast
                                ? 'bg-gray-50 border-gray-200 cursor-not-allowed opacity-50'
                                : isReserved
                                  ? 'bg-red-50 border-red-200 cursor-not-allowed'
                                  : selectedBlock?.hour === hour
                                    ? 'bg-blue-100 border-blue-500'
                                    : 'bg-green-50 border-green-200 hover:bg-green-100'
                            }`}
                            onClick={() => isAvailable && handleBlockClick(selectedRoom, hour)}
                          >
                            <div className="flex items-center">
                              <div className={`w-4 h-4 rounded-full mr-3 ${
                                isPast
                                  ? 'bg-gray-300'
                                  : isReserved
                                    ? 'bg-red-400'
                                    : 'bg-green-400'
                              }`}></div>
                              <div>
                                <div className="font-medium text-gray-900">
                                  {formatHour(hour)} - {formatHour(hour + 1)}
                                </div>
                                <div className={`text-sm ${
                                  isPast
                                    ? 'text-gray-400'
                                    : isReserved
                                      ? 'text-red-600'
                                      : 'text-green-600'
                                }`}>
                                  {isPast
                                    ? 'No disponible'
                                    : isReserved
                                      ? 'Ocupado'
                                      : 'Disponible'}
                                </div>
                              </div>
                            </div>
                            
                            {selectedBlock?.hour === hour && (
                              <div className="text-blue-600">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* Formulario de reservación */}
              {selectedBlock && (
                <form onSubmit={handleBookingSubmit} className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-md">
                    <h4 className="text-lg font-medium text-blue-900 mb-2">Confirmar Reservación</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm text-blue-800">
                      <p><strong>Sala:</strong> {selectedBlock.room.name}</p>
                      <p><strong>Fecha:</strong> {new Date(selectedDate + 'T00:00:00').toLocaleDateString('es-MX')}</p>
                      <p><strong>Hora:</strong> {formatHour(selectedBlock.hour)} - {formatHour(selectedBlock.hour + 1)}</p>
                      <p><strong>Duración:</strong> 1 hora</p>
                    </div>
                  </div>
                  
                  <div>
                    <label htmlFor="purpose" className="block text-sm font-medium text-gray-700">
                      Propósito (Opcional)
                    </label>
                    <textarea
                      id="purpose"
                      rows={3}
                      className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      placeholder="Descripción del propósito de la reunión..."
                      value={bookingForm.purpose}
                      onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                    />
                  </div>
                  
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={closeModal}
                      className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Cancelar
                    </button>
                    <button
                      type="submit"
                      disabled={bookingLoading}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      {bookingLoading ? 'Reservando...' : 'Confirmar Reservación'}
                    </button>
                  </div>
                </form>
              )}

              {/* Instrucción si no se ha seleccionado un bloque */}
              {!selectedBlock && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Selecciona un bloque de tiempo disponible para hacer tu reservación</p>
                  <button
                    type="button"
                    onClick={closeModal}
                    className="mt-4 px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                  >
                    Cerrar
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingRoomsAndReservations;