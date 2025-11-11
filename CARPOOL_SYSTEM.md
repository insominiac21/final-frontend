# Carpool System Documentation

## Overview

This is a fully functional carpool/ride-sharing system built for the frontend with JSON-based data persistence. The system simulates a backend using localStorage, allowing students to request rides and drivers to bid on those requests.

## System Architecture

### Data Storage

All data is stored in the browser's localStorage to simulate a backend database. The data persists across sessions.

**Storage Keys:**
- `carpool_ride_bookings` - All ride booking requests
- `carpool_ride_bids` - Driver bids on bookings
- `carpool_driver_profiles` - Driver information
- `carpool_driver_availability` - Driver online/offline status
- `carpool_booking_participants` - Students who joined rides

### Database Schema (Simulated)

#### Ride Bookings (`ride_bookings`)
```javascript
{
  booking_id: string,          // Primary Key
  pickup_location: string,
  dropoff_location: string,
  required_time: timestamp,
  status: enum,                // 'pending', 'accepted', 'completed', 'cancelled'
  booking_type: enum,          // 'one_time', 'regular'
  fixed_fare: decimal,
  student_id: string,
  seats_required: number,
  created_at: timestamp,
  accepted_driver_id: string,
  accepted_bid_id: string
}
```

#### Ride Bids (`ride_bids`)
```javascript
{
  bid_id: string,             // Primary Key
  booking_id: string,         // Foreign Key to ride_bookings
  proposed_fare: decimal,
  bid_status: enum,           // 'pending', 'accepted', 'rejected'
  driver_id: string,          // Foreign Key to driver_profiles
  created_at: timestamp
}
```

#### Driver Profiles (`driver_profiles`)
```javascript
{
  driver_id: string,          // Primary Key
  name: string,
  vehicle_model: string,
  vehicle_number: string,
  license_details: string,
  rating: decimal,
  total_rides: number,
  phone: string
}
```

#### Driver Availability (`driver_availability`)
```javascript
{
  avail_id: string,           // Primary Key
  driver_id: string,          // Foreign Key to driver_profiles
  is_online: boolean,
  current_latitude: decimal,
  current_longitude: decimal,
  updated_at: timestamp
}
```

#### Booking Participants (`booking_participants`)
```javascript
{
  participant_id: string,     // Primary Key
  booking_id: string,         // Foreign Key to ride_bookings
  student_id: string,
  joined_at: timestamp,
  status: enum               // 'joined', 'cancelled'
}
```

## Features

### Student Features

#### 1. **Browse Available Rides**
- View all pending and accepted ride requests from other students
- Filter rides by:
  - Pickup location
  - Drop-off location
  - Date
- See ride details including fare, seats, and timing

#### 2. **Request a Ride**
- Create a new ride request with:
  - Pickup location
  - Drop-off location
  - Date and time
  - Number of seats required
  - Maximum fare willing to pay
  - Option for regular/recurring rides
- Drivers will place bids on the request

#### 3. **View and Accept Bids**
- See all bids placed by drivers on your ride requests
- View driver information:
  - Name
  - Rating
  - Number of completed rides
  - Vehicle details
  - Proposed fare
- Accept the best bid
- System automatically rejects other bids when one is accepted

#### 4. **Join Other Rides**
- Join ride requests from other students
- Share the ride with fellow students
- Leave a ride if plans change

#### 5. **Manage My Rides**
- View all ride requests you've posted
- Track bid status
- Cancel rides
- View participants
- See ride history

### Driver Features

#### 1. **View Ride Requests**
- Browse all pending ride requests from students
- See detailed information:
  - Pickup and drop-off locations
  - Date and time
  - Number of seats required
  - Student's maximum fare
  - Type (one-time or regular)

#### 2. **Place Bids**
- Bid on any ride request with a proposed fare
- Update existing bids
- Compete with other drivers for the best price

#### 3. **Accept Fixed Fare**
- Accept a ride request at the student's specified fare
- Bypass the bidding process

#### 4. **Manage Bookings**
- View all confirmed bookings
- Complete rides after finishing
- Track ride history
- View statistics:
  - Total completed rides
  - Pending requests
  - Confirmed rides today
  - Driver rating

## API Services

### `carpoolService.js`

Main service file that manages all carpool data operations.

**Methods:**
- `getAllBookings()` - Get all ride bookings
- `getBookingsByStudent(studentId)` - Get bookings by specific student
- `getAvailableBookingsForDrivers()` - Get pending bookings for drivers
- `createBooking(bookingData)` - Create new ride request
- `updateBookingStatus(bookingId, status, driverId, bidId)` - Update booking
- `cancelBooking(bookingId)` - Cancel a booking
- `completeBooking(bookingId)` - Mark ride as completed
- `filterBookings(filters)` - Filter bookings by criteria

**Bid Service Methods:**
- `placeBid(bidData)` - Place a bid on a ride
- `acceptBid(bidId)` - Accept a bid (student action)
- `rejectBid(bidId)` - Reject a bid
- `getBidsForBooking(bookingId)` - Get all bids for a booking

**Driver Service Methods:**
- `getAllDrivers()` - Get all driver profiles
- `getDriverById(driverId)` - Get specific driver
- `getOnlineDrivers()` - Get currently online drivers
- `updateDriverAvailability(driverId, isOnline)` - Update driver status
- `getDriverStats(driverId)` - Get driver statistics
- `getDriverBookings(driverId, status)` - Get bookings for a driver

**Participant Service Methods:**
- `addParticipant(bookingId, studentId)` - Join a ride
- `removeParticipant(bookingId, studentId)` - Leave a ride
- `getParticipants(bookingId)` - Get ride participants
- `getStudentParticipations(studentId)` - Get rides a student joined

### `api.js`

Wrapper API that exposes the carpool service through consistent API calls.

**Exports:**
- `rideAPI` - Ride booking operations
- `bidAPI` - Bidding operations
- `driverAPI` - Driver operations

## User Flows

### Student Requesting a Ride

1. Student logs in and navigates to Carpool page
2. Clicks "Post a Ride" tab
3. Fills out ride request form:
   - Pickup: "Campus"
   - Drop-off: "Railway Station"
   - Date: "2025-11-15"
   - Time: "08:00 AM"
   - Seats: 2
   - Max Fare: ₹200
4. Submits request
5. Ride is created with status "pending"
6. Drivers can now see and bid on this ride

### Driver Accepting a Ride

1. Driver logs in and views Driver Dashboard
2. Sees pending ride requests
3. Either:
   - **Option A:** Accepts at fixed fare immediately
   - **Option B:** Places a competitive bid (e.g., ₹180)
4. If bidding, student reviews all bids and accepts the best one
5. Booking status changes to "accepted"
6. Driver can view in "Confirmed Bookings"
7. After ride completion, driver marks as "completed"

### Student Joining Another's Ride

1. Student A posts a ride from Campus to Mall
2. Student B browses available rides
3. Finds Student A's ride
4. Clicks "Join Ride"
5. Student B is added as a participant
6. Both can share the ride and split costs

## Data Flow

```
Student Creates Ride Request
  ↓
Stored in ride_bookings (status: pending)
  ↓
Drivers View Available Requests
  ↓
Driver Places Bid
  ↓
Stored in ride_bids (status: pending)
  ↓
Student Views All Bids
  ↓
Student Accepts Best Bid
  ↓
- Bid status → accepted
- Other bids → rejected
- Booking status → accepted
- Booking.accepted_driver_id set
  ↓
Driver Completes Ride
  ↓
- Booking status → completed
- Driver total_rides incremented
```

## Testing the System

### Test Scenario 1: Complete Ride Flow

1. **Login as Student** (student_123)
2. **Post Ride Request:**
   - From: "IIIT Nagpur Campus"
   - To: "Airport"
   - Date: Tomorrow
   - Time: "10:00 AM"
   - Seats: 3
   - Max Fare: ₹500

3. **Login as Driver** (driver_123)
4. **View Pending Requests** - You should see the ride
5. **Place Bid** - Enter ₹450
6. **Logout and Login as Student**
7. **View My Rides** → "View Bids"
8. **Accept the Bid**
9. **Login as Driver**
10. **View Confirmed Bookings** - Ride should appear
11. **Complete the Ride**

### Test Scenario 2: Multiple Students Joining

1. **Student A** posts a ride to Mall
2. **Student B** joins the ride
3. **Student C** joins the ride
4. **Student A** views participants - should see B and C
5. **Student B** leaves the ride
6. **Student A** views participants - should only see C

## Utility Functions

### Clear All Data
```javascript
import { clearCarpoolData } from './services/carpoolService';

// Reset all carpool data (for testing)
clearCarpoolData();
```

### Initialize with Sample Data
Sample driver data is automatically loaded from `src/data/driver_profiles.json` on first run.

## File Structure

```
src/
├── data/
│   ├── ride_bookings.json          # Initial ride bookings (empty)
│   ├── ride_bids.json              # Initial bids (empty)
│   ├── driver_profiles.json        # Sample driver data
│   └── driver_availability.json    # Driver availability
├── services/
│   ├── carpoolService.js           # Main carpool logic
│   └── api.js                      # API wrappers
└── pages/
    ├── student/
    │   └── StudentCarpool.jsx      # Student carpool interface
    └── driver/
        └── DriverDashboard.jsx     # Driver dashboard
```

## Future Enhancements

1. **Real-time Updates** - WebSocket integration for live bid updates
2. **Route Optimization** - Calculate optimal routes
3. **Payment Integration** - Handle payments through the app
4. **Ratings & Reviews** - Students rate drivers after rides
5. **Push Notifications** - Notify users of bids, acceptances
6. **Chat System** - In-app communication between students and drivers
7. **GPS Tracking** - Real-time location tracking during rides
8. **Recurring Rides** - Better support for daily commutes
9. **Ride Sharing Algorithm** - Match compatible rides automatically
10. **Admin Dashboard** - Monitor all rides and resolve disputes

## Notes

- All data persists in localStorage - clearing browser data will reset everything
- No actual backend is required for this implementation
- The system is fully functional for demonstration purposes
- Driver profiles are pre-populated with 3 sample drivers
- All IDs are auto-generated with timestamps for uniqueness

## Support

For issues or questions, refer to the main project documentation or contact the development team.
