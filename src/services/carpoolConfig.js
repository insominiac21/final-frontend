/**
 * Carpool API Configuration
 * 
 * This file centralizes all API configuration.
 * Change USE_MOCK_DATA to false when you have a real backend.
 */

// Toggle between mock data (localStorage) and real backend
export const USE_MOCK_DATA = true;

// Backend API base URL (update this with your actual backend URL)
export const BACKEND_API_URL = 'http://localhost:5000/api/carpool';

// API endpoints
export const ENDPOINTS = {
  // Ride Bookings
  BOOKINGS: '/bookings',
  BOOKINGS_BY_ID: (id) => `/bookings/${id}`,
  BOOKINGS_BY_STUDENT: (studentId) => `/bookings/student/${studentId}`,
  BOOKINGS_AVAILABLE: '/bookings/available',
  BOOKINGS_FILTER: '/bookings/filter',
  BOOKINGS_ACCEPT: (id) => `/bookings/${id}/accept`,
  BOOKINGS_CANCEL: (id) => `/bookings/${id}/cancel`,
  BOOKINGS_COMPLETE: (id) => `/bookings/${id}/complete`,
  
  // Ride Bids
  BIDS: '/bids',
  BIDS_BY_BOOKING: (bookingId) => `/bids/booking/${bookingId}`,
  BIDS_BY_DRIVER: (driverId) => `/bids/driver/${driverId}`,
  BIDS_ACCEPT: (bidId) => `/bids/${bidId}/accept`,
  BIDS_REJECT: (bidId) => `/bids/${bidId}/reject`,
  
  // Drivers
  DRIVERS: '/drivers',
  DRIVER_BY_ID: (id) => `/drivers/${id}`,
  DRIVERS_ONLINE: '/drivers/online',
  DRIVER_AVAILABILITY: (id) => `/drivers/${id}/availability`,
  DRIVER_STATS: (id) => `/drivers/${id}/stats`,
  DRIVER_BOOKINGS: (id) => `/drivers/${id}/bookings`,
  
  // Participants
  PARTICIPANTS: '/participants',
  PARTICIPANTS_BY_BOOKING: (bookingId) => `/participants/booking/${bookingId}`,
  PARTICIPANTS_BY_STUDENT: (studentId) => `/participants/student/${studentId}`,
  PARTICIPANTS_JOIN: '/participants/join',
  PARTICIPANTS_LEAVE: '/participants/leave',
};

export default {
  USE_MOCK_DATA,
  BACKEND_API_URL,
  ENDPOINTS,
};
