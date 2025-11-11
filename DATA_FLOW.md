# Carpool System - Data Flow Documentation

## 🔄 How Data Flows in the System

### Overview
The carpool system uses a **3-layer architecture** that seamlessly works with JSON files now and can easily switch to a backend API later.

```
┌─────────────────┐
│  React Components│
│  (UI Layer)     │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│   api.js        │
│  (API Wrapper)  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  carpoolAPI.js  │
│  (Abstraction)  │
└────────┬────────┘
         │
    ┌────┴─────┐
    ↓          ↓
┌───────┐  ┌─────────┐
│ Mock  │  │Backend  │
│Service│  │HTTP API │
└───┬───┘  └─────────┘
    │
    ↓
┌─────────────────┐
│  localStorage   │
│  (Persistence)  │
└────────┬────────┘
         │
         ↓
┌─────────────────┐
│  JSON Files     │
│  (Initial Data) │
└─────────────────┘
```

---

## 📁 Data Storage Structure

### JSON Files (Initial Data Source)
Located in `src/data/`:

1. **driver_profiles.json** - Driver information (3 drivers)
2. **driver_availability.json** - Driver availability status
3. **ride_bookings.json** - Empty initially, populated at runtime
4. **ride_bids.json** - Empty initially, populated at runtime

### localStorage Keys
Runtime data is stored in browser localStorage:

```javascript
{
  'carpool_ride_bookings': [],        // All ride requests
  'carpool_ride_bids': [],            // All bids from drivers
  'carpool_driver_profiles': [],      // Driver profiles (from JSON)
  'carpool_driver_availability': [],  // Driver availability (from JSON)
  'carpool_booking_participants': [], // Students who joined rides
  'carpool_initialized': 'true'       // Initialization flag
}
```

---

## 🚀 System Initialization Flow

### Step 1: App Starts (`main.jsx`)
```javascript
initializeCarpoolSystem()  // Called on app load
```

### Step 2: carpoolService Loads (`carpoolService.js`)
```javascript
// Auto-imports JSON data
import initialDriverProfiles from '../data/driver_profiles.json'
import initialDriverAvailability from '../data/driver_availability.json'

// Populates localStorage if empty
initializeData() {
  if (!localStorage.getItem('carpool_driver_profiles')) {
    saveToStorage('carpool_driver_profiles', initialDriverProfiles)
  }
  // ... same for availability
}
```

### Step 3: Sample Data Created (`carpoolInitializer.js`)
```javascript
// Creates 4 sample rides
// Creates bids from 3 drivers
// Creates 1 accepted ride
// Marks system as initialized
```

---

## 💾 Data Flow Examples

### Example 1: Student Posts a Ride

**1. User Action:**
```javascript
// StudentCarpool.jsx - handlePostRide()
const bookingData = {
  pickup_location: 'Campus',
  dropoff_location: 'Airport',
  required_time: '2024-11-15T10:00:00',
  booking_type: 'one_time',
  fixed_fare: 500,
  student_id: 'guest_student',
  seats_required: 3
}
```

**2. API Call:**
```javascript
// api.js - rideAPI.createBooking()
await carpoolAPI.createBooking(bookingData)
```

**3. Abstraction Layer:**
```javascript
// carpoolAPI.js - carpoolAPI.createBooking()
if (USE_MOCK_DATA) {
  return mockCarpoolService.createBooking(bookingData)
} else {
  return backendRequest('/bookings', 'POST', bookingData)
}
```

**4. Mock Service:**
```javascript
// carpoolService.js - createBooking()
const booking = {
  booking_id: 'BK_1731337200_abc123',
  ...bookingData,
  status: 'pending',
  created_at: new Date().toISOString()
}

// Save to localStorage
const bookings = getFromStorage('carpool_ride_bookings')
bookings.push(booking)
saveToStorage('carpool_ride_bookings', bookings)

return booking
```

**5. Data Persisted:**
```javascript
// localStorage['carpool_ride_bookings'] now contains:
[
  { booking_id: 'BK_...', pickup_location: 'Campus', ... }
]
```

---

### Example 2: Driver Places a Bid

**1. Driver Action:**
```javascript
// DriverDashboard.jsx
const bidData = {
  booking_id: 'BK_1731337200_abc123',
  driver_id: 'DRV001',
  proposed_fare: 450
}
```

**2. API Chain:**
```
bidAPI.placeBid(bidData)
  → carpoolBidAPI.placeBid(bidData)
    → mockCarpoolBidService.placeBid(bidData)
      → localStorage['carpool_ride_bids'].push(newBid)
```

**3. Result:**
```javascript
// Bid stored with:
{
  bid_id: 'BID_1731337300_xyz789',
  booking_id: 'BK_1731337200_abc123',
  driver_id: 'DRV001',
  proposed_fare: 450,
  status: 'pending',
  created_at: '2024-11-11T...'
}
```

---

### Example 3: Student Accepts Bid

**1. Student Action:**
```javascript
// StudentCarpool.jsx
bidAPI.acceptBid(bidId)
```

**2. Data Updates:**
```javascript
// 1. Bid status changes
bid.status = 'accepted'
bid.accepted_at = new Date().toISOString()

// 2. Booking status changes
booking.status = 'accepted'
booking.accepted_bid_id = bidId
booking.assigned_driver_id = bid.driver_id

// 3. Other bids rejected
otherBids.forEach(b => b.status = 'rejected')

// All saved back to localStorage
```

---

## 🔍 Debugging the System

### Available Debug Commands

Open browser console and use:

```javascript
// Show all data
window.carpoolDebug.debug()

// Show statistics
window.carpoolDebug.stats()

// Export data as JSON
window.carpoolDebug.export()

// Clear all data (requires page reload)
window.carpoolDebug.clear()
```

### Verify Data Flow

**Test 1: Check Initial Data**
```javascript
window.carpoolDebug.stats()
// Should show:
// - 3 drivers
// - 5-6 bookings
// - 6+ bids
```

**Test 2: Check localStorage**
```javascript
// Open DevTools → Application → Local Storage
// Look for keys starting with 'carpool_'
```

**Test 3: Monitor API Calls**
```javascript
// All API calls log to console
// Look for: "Creating booking:", "Placing bid:", etc.
```

---

## 🔄 Switching to Backend (Future)

### Step 1: Change Configuration
```javascript
// src/services/carpoolConfig.js
export const USE_MOCK_DATA = false  // Change to false
export const BACKEND_API_URL = 'http://localhost:5000/api/carpool'
```

### Step 2: That's It! ✅

The system automatically switches from localStorage to HTTP API calls.

### What Happens:
```javascript
// Before (Mock):
carpoolAPI.createBooking(data)
  → mockCarpoolService.createBooking(data)
    → localStorage

// After (Backend):
carpoolAPI.createBooking(data)
  → fetch('http://localhost:5000/api/carpool/bookings', { method: 'POST', body: data })
    → Backend API
```

---

## 📊 Data Validation

### On Every Operation:
1. **Console Logs**: Every CRUD operation logs to console
2. **localStorage Updates**: Data immediately persists
3. **UI Refresh**: Components reload data after mutations

### Example Console Output:
```
🚀 Initializing carpool system with sample data...
✅ Created 4 sample ride requests
✅ Created 6 sample bids from drivers
✅ Created 1 accepted ride for demonstration
✅ Carpool system initialization complete!
📊 Summary:
   - Total Bookings: 5
   - Total Bids: 7
   - Available Drivers: 3
```

---

## 🐛 Common Issues & Solutions

### Issue 1: "No rides showing"
**Solution:**
```javascript
window.carpoolDebug.stats()  // Check if data exists
// If no bookings, refresh page or:
window.carpoolDebug.clear()
// Then reload page
```

### Issue 2: "Data not persisting"
**Solution:**
- Check browser localStorage isn't disabled
- Clear cache and reload
- Check console for errors

### Issue 3: "Bids not appearing"
**Solution:**
- Verify driver IDs match (DRV001, DRV002, DRV003)
- Check bid status is 'pending'
- Refresh the student carpool page

---

## 📝 Testing Checklist

- [ ] Page loads without errors
- [ ] `window.carpoolDebug.stats()` shows data
- [ ] Student can post new ride
- [ ] New ride appears in "Available Rides"
- [ ] Driver can see ride request
- [ ] Driver can place bid
- [ ] Student can see bids
- [ ] Student can accept bid
- [ ] Ride status changes to "accepted"
- [ ] Data persists after page reload

---

## 🎯 Key Files Reference

| File | Purpose | Edits Data? |
|------|---------|-------------|
| `main.jsx` | Initializes system | No |
| `carpoolService.js` | Mock data operations | Yes (localStorage) |
| `carpoolAPI.js` | Abstraction layer | No (delegates) |
| `carpoolConfig.js` | Configuration | No |
| `api.js` | API wrapper | No (delegates) |
| `carpoolInitializer.js` | Sample data | Yes (on init) |
| `carpoolDebug.js` | Debugging tools | No (read only) |
| `StudentCarpool.jsx` | Student UI | No (calls API) |
| `DriverDashboard.jsx` | Driver UI | No (calls API) |

---

## 🎉 Summary

Your carpool system now has a **complete data flow**:

1. ✅ **JSON files** provide initial driver data
2. ✅ **localStorage** persists runtime data
3. ✅ **Sample data** auto-creates on first load
4. ✅ **All CRUD operations** work end-to-end
5. ✅ **Debug tools** help verify everything
6. ✅ **Backend-ready** - just flip a switch!

**Data flows seamlessly from UI → API → localStorage → JSON**

No more hardcoded data! 🚀
