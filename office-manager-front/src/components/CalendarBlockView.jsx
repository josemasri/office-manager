import React, { useState, useEffect } from 'react';
import { meetingRoomsAPI, reservationsAPI } from '../services/api';

const CalendarBlockView = () => {
  const [rooms, setRooms] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [bookingForm, setBookingForm] = useState({
    purpose: '',
  });
  const [bookingLoading, setBookingLoading] = useState(false);

  // Horarios de trabajo (9 AM a 6 PM)
  const workingHours = Array.from({ length: 9 }, (_, i) => i + 9);

  useEffect(() => {
    fetchRooms();
  }, []);

  useEffect(() => {
    if (selectedDate) {
      fetchReservationsForDate();
    }
  }, [selectedDate]);

  const fetchRooms = async () => {
    try {
      const response = await meetingRoomsAPI.getAll();
      setRooms(response.data);
    } catch (error) {
      console.error('Error fetching rooms:', error);
    }
  };

  const fetchReservationsForDate = async () => {
    try {
      setLoading(true);
      // Obtener todas las reservaciones para mostrar disponibilidad
      const response = await reservationsAPI.getAll();
      const dateReservations = response.data.filter(reservation => {
        const reservationDate = new Date(reservation.startTime).toISOString().split('T')[0];
        return reservationDate === selectedDate && reservation.status === 'confirmed';
      });
      setReservations(dateReservations);
    } catch (error) {
      console.error('Error fetching reservations:', error);
    } finally {
      setLoading(false);
    }
  };

  const isBlockReserved = (roomId, hour) => {
    return reservations.some(reservation => {
      const startHour = new Date(reservation.startTime).getHours();
      const endHour = new Date(reservation.endTime).getHours();
      return reservation.roomId === roomId && hour >= startHour && hour < endHour;
    });
  };

  const isBlockInPast = (hour) => {
    const now = new Date();
    const blockDate = new Date(selectedDate);
    blockDate.setHours(hour, 0, 0, 0);
    return blockDate < now;
  };

  const handleBlockClick = (room, hour) => {
    if (isBlockReserved(room.id, hour) || isBlockInPast(hour)) {
      return;
    }

    setSelectedBlock({ room, hour });
    setShowBookingModal(true);
    setBookingForm({ purpose: '' });
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBlock) return;

    setBookingLoading(true);

    try {
      const startTime = new Date(selectedDate);
      startTime.setHours(selectedBlock.hour, 0, 0, 0);

      const reservationData = {
        roomId: selectedBlock.room.id,
        startTime: startTime.toISOString(),
        duration: 1, // Fijo a 1 hora
        purpose: bookingForm.purpose,
      };

      await reservationsAPI.create(reservationData);
      setShowBookingModal(false);
      setSelectedBlock(null);
      setBookingForm({ purpose: '' });
      await fetchReservationsForDate();
      alert('Reservación creada exitosamente!');
    } catch (error) {
      console.error('Error creating reservation:', error);
      const message = error.response?.data?.message || 'Error creando la reservación';
      alert(message);
    } finally {
      setBookingLoading(false);
    }
  };

  const closeModal = () => {
    setShowBookingModal(false);
    setSelectedBlock(null);
    setBookingForm({ purpose: '' });
  };

  const formatHour = (hour) => {
    return `${hour.toString().padStart(2, '0')}:00`;
  };

  const getBlockColor = (roomId, hour) => {
    if (isBlockInPast(hour)) {
      return 'bg-gray-100 text-gray-400 cursor-not-allowed';
    }
    if (isBlockReserved(roomId, hour)) {
      return 'bg-red-100 text-red-800 cursor-not-allowed';
    }
    return 'bg-green-100 text-green-800 cursor-pointer hover:bg-green-200';
  };

  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="sm:flex sm:items-center justify-between">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Reservación de Salas</h1>
          <p className="mt-2 text-sm text-gray-700">
            Selecciona un bloque de tiempo para reservar una sala (máximo 1 hora por reservación).
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <label htmlFor="date" className="block text-sm font-medium text-gray-700">
            Fecha
          </label>
          <input
            type="date"
            id="date"
            className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            value={selectedDate}
            min={getTomorrowDate()}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {/* Leyenda */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Leyenda</h3>
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

      {/* Calendario de bloques */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Sala
                </th>
                {workingHours.map(hour => (
                  <th key={hour} className="px-3 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider min-w-20">
                    {formatHour(hour)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rooms.map((room) => (
                <tr key={room.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m11 0v-3.87a3.37 3.37 0 00-.94-2.61c-.26-.29-.68-.52-1.26-.52H9.74c-.58 0-1.04.2-1.3.45A4.92 4.92 0 007.5 17" />
                        </svg>
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{room.name}</div>
                        <div className="text-sm text-gray-500">Cap. {room.capacity}</div>
                      </div>
                    </div>
                  </td>
                  {workingHours.map(hour => (
                    <td key={hour} className="px-3 py-4 text-center">
                      <div
                        className={`w-full h-12 rounded-md border-2 border-dashed flex items-center justify-center text-xs font-medium transition-colors ${getBlockColor(room.id, hour)}`}
                        onClick={() => handleBlockClick(room, hour)}
                      >
                        {isBlockReserved(room.id, hour) ? '●' : 
                         isBlockInPast(hour) ? '×' : '+'}
                      </div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de reservación */}
      {showBookingModal && selectedBlock && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Reservar {selectedBlock.room.name}
              </h3>
              <div className="mb-4 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Fecha:</strong> {new Date(selectedDate).toLocaleDateString('es-MX')}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Hora:</strong> {formatHour(selectedBlock.hour)} - {formatHour(selectedBlock.hour + 1)}
                </p>
                <p className="text-sm text-blue-800">
                  <strong>Duración:</strong> 1 hora
                </p>
              </div>
              <form onSubmit={handleBookingSubmit} className="space-y-4">
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
                    {bookingLoading ? 'Reservando...' : 'Reservar'}
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

export default CalendarBlockView;