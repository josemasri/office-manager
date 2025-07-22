import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { reservationsAPI, meetingRoomsAPI, usersAPI } from '../services/api';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    myReservations: 0,
    weeklyUsage: 0,
    totalRooms: 0,
    upcomingReservations: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch user's reservations
        const reservationsResponse = await reservationsAPI.getMyReservations();
        const myReservations = reservationsResponse.data;
        
        // Fetch weekly usage
        const weeklyUsageResponse = await usersAPI.getWeeklyUsage(user.id);
        const weeklyUsage = weeklyUsageResponse.data;
        
        // Fetch total rooms (for display)
        const roomsResponse = await meetingRoomsAPI.getAll();
        const totalRooms = roomsResponse.data.length;
        
        // Get upcoming reservations (next 5)
        const now = new Date();
        const upcoming = myReservations
          .filter(reservation => 
            new Date(reservation.startTime) > now && 
            reservation.status === 'confirmed'
          )
          .sort((a, b) => new Date(a.startTime) - new Date(b.startTime))
          .slice(0, 5);

        setStats({
          myReservations: myReservations.length,
          weeklyUsage: weeklyUsage?.totalHours || 0,
          totalRooms,
          upcomingReservations: upcoming,
        });
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
      {/* Welcome Header */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h1 className="text-2xl font-bold text-gray-900">
            ¡Bienvenido de vuelta, {user?.firstName}!
          </h1>
          <p className="mt-1 text-sm text-gray-600">
            Esto es lo que está pasando con tus reservaciones hoy.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {/* My Reservations */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total de Reservaciones
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.myReservations}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/rooms" className="font-medium text-blue-700 hover:text-blue-900">
                Ver todas las reservaciones
              </Link>
            </div>
          </div>
        </div>

        {/* Weekly Usage */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Uso de Esta Semana
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.weeklyUsage} horas
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <span className="text-gray-600">
                Límite: {user?.userType?.weeklyHoursLimit === -1 ? 'Ilimitado' : `${user?.userType?.weeklyHoursLimit || 0} horas`}
              </span>
            </div>
          </div>
        </div>

        {/* Available Rooms */}
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-500 rounded-md flex items-center justify-center">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-4m-5 0H9m11 0v-3.87a3.37 3.37 0 00-.94-2.61c-.26-.29-.68-.52-1.26-.52H9.74c-.58 0-1.04.2-1.3.45A4.92 4.92 0 007.5 17" />
                  </svg>
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Salas de Reuniones
                  </dt>
                  <dd className="text-lg font-medium text-gray-900">
                    {stats.totalRooms}
                  </dd>
                </dl>
              </div>
            </div>
          </div>
          <div className="bg-gray-50 px-5 py-3">
            <div className="text-sm">
              <Link to="/rooms" className="font-medium text-blue-700 hover:text-blue-900">
                Explorar salas
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Upcoming Reservations */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Próximas Reservaciones
          </h3>
          {stats.upcomingReservations.length > 0 ? (
            <div className="space-y-3">
              {stats.upcomingReservations.map((reservation) => (
                <div key={reservation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {reservation.room?.name || `Room ${reservation.roomId}`}
                    </p>
                    <p className="text-sm text-gray-600">
                      {formatDate(reservation.startTime)} - {new Date(reservation.endTime).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {reservation.purpose && (
                      <p className="text-xs text-gray-500">{reservation.purpose}</p>
                    )}
                  </div>
                  <div className="text-sm text-green-600 font-medium">
                    {reservation.totalHours}h
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-2 text-sm text-gray-600">No hay próximas reservaciones</p>
              <Link
                to="/rooms"
                className="mt-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Reservar una sala
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Admin Quick Actions */}
      {isAdmin && (
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Acciones Rápidas de Administrador
            </h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Link
                to="/admin"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Panel de Administración
              </Link>
              <button className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Agregar Sala Rápidamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;