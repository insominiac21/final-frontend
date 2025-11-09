# AI Categorization System Guide

## Overview

The system now uses **AI to automatically categorize complaints** into departments. Students don't need to select departments - the AI analyzes the complaint text and determines which departments should handle it.

## How It Works

### 1. **Student Submits Complaint**
- Student provides only **Title** and **Description**
- No manual category or department selection required

### 2. **Flask AI Processing**
The Flask backend (`complain.py`) uses LLM to:
- **Classify departments** from a predefined list:
  - Drinking Water
  - Network & IT
  - Housekeeping
  - Maintenance
  - Transport
  - Mess & Dining
  - Accounts / Fee Office
  - Academics / Registrar
  - Library
  - Hostel Office / Residence Life

### 3. **Frontend Mapping**
The frontend maps AI-detected departments to page categories:

| AI Department(s) | Frontend Page |
|-----------------|---------------|
| Mess & Dining | Mess Management |
| Network & IT | Network Management |
| Maintenance, Housekeeping, Drinking Water, Plumbing, Electrical | Maintenance Management |
| Transport | Transport Management |

### 4. **Multi-Department Support**
- AI can assign **multiple departments** to a single complaint
- Example: "Water leaking from ceiling" → `["Maintenance", "Drinking Water"]`
- Complaint appears in **all relevant department views**

## Examples

### Example 1: Simple Categorization
**Student Input:**
```
Title: WiFi not working
Description: Internet is down in hostel Block A
```

**AI Output:**
```json
{
  "departments": ["Network & IT"],
  "severity": 4
}
```

**Result:** Appears in "Network Management" admin page

---

### Example 2: Multi-Department
**Student Input:**
```
Title: Water leakage in room
Description: Water dripping from ceiling, floor is wet
```

**AI Output:**
```json
{
  "departments": ["Maintenance", "Drinking Water"],
  "severity": 4
}
```

**Result:** Appears in "Maintenance Management" admin page

---

### Example 3: Detailed Categorization
**Student Input:**
```
Title: Electrical and plumbing issues
Description: The geyser is not working and there's also water leakage
```

**AI Output:**
```json
{
  "departments": ["Maintenance", "Drinking Water", "Housekeeping"],
  "severity": 4
}
```

**Result:** Appears in "Maintenance Management" admin page

## Dummy Complaints for Testing

The system now includes **6 dummy complaints** for testing:

### 1. **Mess - Food Quality (Severity 4/5)**
- Undercooked dal causing health issues
- Department: Mess & Dining
- Status: Pending

### 2. **Network - WiFi Outage (Severity 5/5)** ⚠️
- Complete WiFi failure in Hostel Block A
- Department: Network & IT
- Status: In Progress

### 3. **Maintenance - Water Leakage (Severity 4/5)**
- Ceiling leak causing property damage
- Departments: Maintenance, Drinking Water
- Status: Resolved

### 4. **Network - Slow Internet (Severity 3/5)**
- Slow speeds in library
- Department: Network & IT
- Status: Pending

### 5. **Maintenance - Broken Window (Severity 4/5)**
- Safety hazard in classroom
- Department: Maintenance
- Status: Pending

### 6. **Mess - Menu Variety (Severity 2/5)**
- Suggestion for breakfast variety
- Department: Mess & Dining
- Status: Pending

## Testing the AI Categorization

### Test Case 1: Submit Mess Complaint
1. Go to **Mess Management** (student view)
2. Submit: "The rice served today was stale and smelled bad"
3. **Expected AI Output:**
   - Department: `["Mess & Dining"]`
   - Severity: 3-4/5
   - Appears in Mess admin view

### Test Case 2: Submit Maintenance Complaint
1. Go to **Maintenance** (student view)
2. Submit: "The tap in my room is leaking continuously"
3. **Expected AI Output:**
   - Departments: `["Maintenance", "Drinking Water"]`
   - Severity: 3/5
   - Appears in Maintenance admin view

### Test Case 3: Submit Network Complaint
1. Go to **Network & IT** (student view)
2. Submit: "Cannot connect to eduroam WiFi on my laptop"
3. **Expected AI Output:**
   - Department: `["Network & IT"]`
   - Severity: 2-3/5
   - Appears in Network admin view

### Test Case 4: Ambiguous Complaint
1. Submit from any page: "My room needs urgent attention - water and electricity both have issues"
2. **Expected AI Output:**
   - Departments: `["Maintenance", "Drinking Water"]` (AI intelligently categorizes)
   - Severity: 4/5
   - Appears in Maintenance admin view

## Key Features

### ✅ **Automatic Department Assignment**
- No manual selection needed
- AI analyzes complaint context
- Multi-department support

### ✅ **Intelligent Severity Assessment**
- 1-5 scale based on urgency
- Keywords like "urgent", "emergency", "broken" increase severity
- Safety issues get high priority

### ✅ **Smart Filtering**
- Admin sees only relevant complaints
- Based on AI-detected departments
- Not hardcoded categories

### ✅ **Flexibility**
- Works even if student submits from wrong page
- Example: Submit maintenance issue from network page → AI still routes correctly

## Admin View Benefits

### Before (Manual System):
- Student selects department (might be wrong)
- Admin has to manually reassign
- Complaints might be missed

### After (AI System):
- AI automatically routes to correct department(s)
- Admin sees accurate categorization
- Multiple departments can collaborate

## Code Changes Summary

### `api.js`
```javascript
// New function to map AI departments to frontend categories
const mapDepartmentsToCategory = (departments) => {
  const deptStr = departments.join(' ').toLowerCase();
  
  if (deptStr.includes('mess') || deptStr.includes('dining')) return 'mess';
  if (deptStr.includes('network') || deptStr.includes('it')) return 'network';
  if (deptStr.includes('maintenance') || ...) return 'maintenance';
  // ... more mappings
}

// AI determines category from departments
submitComplaint: async (complaintText) => {
  const response = await flaskApiCall('/process', ...);
  const aiDepartments = response.admin_view?.departments || [];
  const aiCategory = mapDepartmentsToCategory(aiDepartments);
  // Store with AI-determined category
}
```

### Student Pages
```javascript
// Show AI-detected departments in success message
const departments = complaintData.admin_view?.departments || [];
alert(`Departments: ${departments.join(', ')}`);
```

### Admin Page
```javascript
// Filter by AI-detected departments, not hardcoded categories
const departments = c.admin_view?.departments || [];
const deptStr = departments.join(' ').toLowerCase();

if (currentDept.dept_id === 'MESS') {
  return deptStr.includes('mess') || deptStr.includes('dining');
}
```

## Flask Backend (Reference)

The `classify_departments()` function in Flask:

```python
def classify_departments(text):
    prompt = f"""Given this complaint by a student at IIIT Nagpur:
{text}
Classify it into one or more of the following campus departments:
{', '.join(DEPARTMENTS)}.
Return only department names as a comma-separated list."""
    
    resp = llm.invoke(prompt)
    return [d.strip() for d in resp.content.split(",") 
            if d.strip() in DEPARTMENTS]
```

## Troubleshooting

### Issue: Complaint not appearing in expected admin view
**Solution:** Check AI-detected departments in complaint details

### Issue: Multiple departments assigned
**Behavior:** This is expected - complaint appears in all relevant views

### Issue: Wrong department categorization
**Solution:** AI learns from complaint text - make descriptions more specific

## Future Enhancements

- [ ] Admin can manually reassign departments
- [ ] Department assignment history/audit log
- [ ] AI confidence scores for categorization
- [ ] Feedback loop to improve AI accuracy
- [ ] Department-specific sub-categorization (e.g., Plumbing, Electrical under Maintenance)

---

**Remember:** The AI is analyzing the **complaint content**, not the page it was submitted from. A maintenance issue submitted from the mess page will still be correctly routed to maintenance! 🎯
