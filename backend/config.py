import os
from dotenv import load_dotenv

# Load environment variables from parent directory
load_dotenv(os.path.join(os.path.dirname(__file__), '..', '.env'))

GROQ_API_KEY = os.getenv('GROQ_API_KEY')
if not GROQ_API_KEY:
    raise ValueError("GROQ_API_KEY environment variable is not set. Check your .env file!")

# Store complaints in backend folder
STORAGE_FILE = os.path.join(os.path.dirname(__file__), "complaints_store.json")

# Create complaints_store.json if it doesn't exist
if not os.path.exists(STORAGE_FILE):
    with open(STORAGE_FILE, 'w', encoding='utf-8') as f:
        f.write('[]')  # Initialize with empty array

DEPARTMENTS = [
    "Drinking Water",
    "Network & IT",
    "Housekeeping",
    "Maintenance",
    "Transport",
    "Mess & Dining",
    "Accounts / Fee Office",
    "Academics / Registrar",
    "Library",
    "Hostel Office / Residence Life"
]

# Department ID mapping
DEPARTMENT_IDS = {
    "Drinking Water": "D00",
    "Network & IT": "D01",
    "Housekeeping": "D02",
    "Maintenance": "D03",
    "Transport": "D04",
    "Mess & Dining": "D05",
    "Accounts / Fee Office": "D06",
    "Academics / Registrar": "D07",
    "Library": "D08",
    "Hostel Office / Residence Life": "D09"
}

DEPARTMENT_CONTACTS = {
    "Drinking Water": "water@iiit-nagpur.ac.in",
    "Network & IT": "it@iiit-nagpur.ac.in",
    "Housekeeping": "housekeeping@iiit-nagpur.ac.in",
    "Maintenance": "maintenance@iiit-nagpur.ac.in",
    "Transport": "transport@iiit-nagpur.ac.in",
    "Mess & Dining": "mess@iiit-nagpur.ac.in",
    "Accounts / Fee Office": "accounts@iiit-nagpur.ac.in",
    "Academics / Registrar": "academics@iiit-nagpur.ac.in",
    "Library": "library@iiit-nagpur.ac.in",
    "Hostel Office / Residence Life": "hostel@iiit-nagpur.ac.in"
}
