import os
import json
import datetime
import logging
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.exceptions import HTTPException
from langchain_groq import ChatGroq
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import load_summarize_chain
from langchain_core.documents import Document
from config import *
from google.oauth2 import service_account
from google.cloud import dialogflow_v2beta1 as dialogflow

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*", "methods": ["GET", "POST"]}})

# Initialize LLM components
llm = ChatGroq(model="llama-3.3-70b-versatile", api_key=GROQ_API_KEY)
text_splitter = RecursiveCharacterTextSplitter(chunk_size=500, chunk_overlap=50)
summarize_chain = load_summarize_chain(llm, chain_type="map_reduce")

# Initialize Dialogflow
try:
    # Try multiple paths
    service_account_path = None
    if os.path.exists('service_account.json'):
        service_account_path = 'service_account.json'
    elif os.path.exists('../service_account.json'):
        service_account_path = '../service_account.json'
    else:
        raise FileNotFoundError("service_account.json not found in backend or parent directory")
    
    with open(service_account_path) as f:
        service_account_info = json.load(f)
    
    credentials = service_account.Credentials.from_service_account_info(
        service_account_info,
        scopes=['https://www.googleapis.com/auth/cloud-platform']
    )
    dialogflow_project_id = service_account_info['project_id']
    session_client = dialogflow.SessionsClient(credentials=credentials)
    logger.info(f"✓ Dialogflow initialized successfully from {service_account_path}")
except Exception as e:
    logger.error(f"Failed to initialize Dialogflow: {e}")
    dialogflow_project_id = None
    session_client = None

# Error handling
@app.errorhandler(Exception)
def handle_error(error):
    code = 500
    if isinstance(error, HTTPException):
        code = error.code
    logger.error(f"Error: {str(error)}", exc_info=True)
    return jsonify({"error": str(error)}), code


def _append_to_store(item):
    try:
        existing = []
        logger.info(f"Storage file path: {STORAGE_FILE}")
        logger.info(f"Storage file exists: {os.path.exists(STORAGE_FILE)}")
        
        # Ensure directory exists
        os.makedirs(os.path.dirname(STORAGE_FILE), exist_ok=True)
        
        if os.path.exists(STORAGE_FILE):
            with open(STORAGE_FILE, "r", encoding="utf-8") as f:
                content = f.read().strip()
                existing = json.loads(content) if content else []
                logger.info(f"Read {len(existing)} existing complaints")
        
        existing.append(item)
        logger.info(f"Total complaints after append: {len(existing)}")
        
        # Write to file
        with open(STORAGE_FILE, "w", encoding="utf-8") as f:
            json.dump(existing, f, indent=2, ensure_ascii=False)
        
        logger.info(f"✓ Successfully saved complaint to {STORAGE_FILE}")
        logger.info(f"✓ Complaint ID: {item['id']}")
    except Exception as e:
        logger.error(f"Storage error: {str(e)}", exc_info=True)
        raise


def classify_departments(text):
    prompt = f"""Given this complaint by a student at IIIT Nagpur:
{text}
Classify it into one or more of the following campus departments:
{', '.join(DEPARTMENTS)}.
Return only department names as a comma-separated list."""
    resp = llm.invoke(prompt)
    return [d.strip() for d in resp.content.split(",") if d.strip() in DEPARTMENTS]


def get_severity_score(text):
    prompt = f"""
You are an assistant for IIIT Nagpur's complaint system.
Analyze the following student complaint and rate its SEVERITY from 1 to 5:

1 - Very minor inconvenience or suggestion  
2 - Minor issue, can wait  
3 - Moderate issue, causes discomfort but not urgent  
4 - Serious problem, needs quick attention  
5 - Critical or safety issue, requires immediate response  

Complaint: "{text}"

Return ONLY a single digit (1-5) as the severity score.
"""
    try:
        resp = llm.invoke(prompt).content.strip()
        # Extract digit safely
        score = int("".join(filter(str.isdigit, resp[:5]))) if any(c.isdigit() for c in resp) else None

        # Backup keyword-based estimation if unclear
        if not score:
            t = text.lower()
            if any(k in t for k in ["urgent", "immediate", "emergency", "fire", "danger", "broken", "water leakage", "power cut"]):
                score = 5
            elif any(k in t for k in ["bad", "poor", "problem", "issue", "slow", "leak", "complaint"]):
                score = 4
            elif any(k in t for k in ["inconvenience", "delay", "not working", "not available"]):
                score = 3
            else:
                score = 2
        return min(max(score, 1), 5)
    except Exception:
        return 3



def summarize_text(text):
    docs = [Document(page_content=t) for t in text_splitter.split_text(text)]
    return summarize_chain.run(docs)


def get_contact_info(departments):
    return {d: DEPARTMENT_CONTACTS[d] for d in departments if d in DEPARTMENT_CONTACTS}


def fetch_interim_suggestions(complaint_text, department):
    query = f"""
You are an IIIT Nagpur administrator assisting students with complaints.

Complaint:
{complaint_text}

Department Concerned:
{department}

Give 3–4 short, realistic, and actionable suggestions a student can follow 
while their complaint is being reviewed by the {department} department. 
Keep the tone polite, supportive, and student-friendly. Avoid generic or repetitive advice. 
Begin each suggestion with a bullet like '- '.
"""
    try:
        resp = llm.invoke(query).content.strip()
        suggestions = [line.strip("-• ").strip() for line in resp.split("\n") if line.strip()]
        cleaned = [s for s in suggestions if len(s) > 3]
        return cleaned[:4] if cleaned else [
            "Please wait while the department reviews your complaint.",
            "You may follow up politely if no response within a few days."
        ]
    except Exception:
        return [
            "Your complaint has been recorded. Please wait while it is processed.",
            "You can contact your department representative for urgent concerns."
        ]


def generate_officer_brief(summary, severity, departments):
    dept_str = ", ".join(departments) if departments else "relevant department"
    return f"A student complaint has been received regarding {summary}. It is rated {severity}/5 in severity and forwarded to the {dept_str} department(s)."


def process_complaint_core(text):
    try:
        timestamp = datetime.datetime.now(datetime.timezone.utc).isoformat()
        logger.info(f"Step 1: Classifying departments...")
        departments = classify_departments(text)
        departments_id = [DEPARTMENT_IDS[dept] for dept in departments if dept in DEPARTMENT_IDS]
        logger.info(f"  Departments: {departments}")
        
        logger.info(f"Step 2: Getting severity score...")
        severity = get_severity_score(text)
        logger.info(f"  Severity: {severity}/5")
        
        logger.info(f"Step 3: Summarizing text...")
        summary = summarize_text(text)
        logger.info(f"  Summary: {summary[:50]}...")
        
        logger.info(f"Step 4: Getting contact info...")
        contact_info = get_contact_info(departments)
        
        logger.info(f"Step 5: Fetching suggestions...")
        suggestions = []
        for dept in departments:
            suggestions.extend(fetch_interim_suggestions(text, dept))
        logger.info(f"  Suggestions: {len(suggestions)} generated")
        
        logger.info(f"Step 6: Generating officer brief...")
        officer_brief = generate_officer_brief(summary, severity, departments)

        student_view = {
            "complaint": text,
            "timestamp": timestamp,
            "status": "Pending"
        }

        admin_view = {
            "timestamp": timestamp,
            "severity": severity,
            "summary": summary,
            "complaint": text,
            "departments": departments,
            "departments_id": departments_id,
            "contacts": contact_info,
            "suggestions": suggestions,
            "institute": "IIIT Nagpur",
            "officer_brief": officer_brief
        }

        record = {
            "id": int(datetime.datetime.now(datetime.timezone.utc).timestamp() * 1000),
            "student_view": student_view,
            "admin_view": admin_view
        }

        logger.info(f"Step 7: Appending to storage...")
        _append_to_store(record)
        logger.info(f"✓ Complaint processed and saved: {record['id']}")
        
        return record
    except Exception as e:
        logger.error(f"Complaint processing failed: {str(e)}", exc_info=True)
        raise


@app.route("/", methods=["GET"])
def home():
    return jsonify({"message": "IIIT Nagpur Complaint System API", "status": "running"})


@app.route("/health", methods=["GET"])
def health():
    return jsonify({"status": "ok"})


@app.route("/process", methods=["POST"])
def process_complaint():
    if not request.is_json:
        return jsonify({"error": "Content-Type must be application/json"}), 415
    
    payload = request.get_json()
    complaint = payload.get("complaint", "").strip()
    
    if not complaint:
        return jsonify({"error": "complaint field is required"}), 400
    
    if len(complaint) > 5000:
        return jsonify({"error": "complaint text too long"}), 400
    
    try:
        logger.info(f"NEW REQUEST: Processing complaint: {complaint[:60]}...")
        record = process_complaint_core(complaint)
        logger.info(f"✓ SUCCESS: Complaint ID {record['id']}")
        return jsonify(record), 200
    except Exception as e:
        logger.error(f"Processing error: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/complaints", methods=["GET"])
def list_complaints():
    try:
        logger.info(f"Reading from: {STORAGE_FILE}")
        if not os.path.exists(STORAGE_FILE):
            logger.warning(f"File not found: {STORAGE_FILE}")
            return jsonify([])
        
        with open(STORAGE_FILE, "r", encoding="utf-8") as f:
            content = f.read().strip()
            data = json.loads(content) if content else []
        
        logger.info(f"✓ Found {len(data)} complaints in storage")
        return jsonify(data)
    except Exception as e:
        logger.error(f"Read error: {str(e)}", exc_info=True)
        return jsonify([]), 500


@app.route("/complaints/<int:cid>", methods=["GET"])
def get_complaint(cid):
    try:
        if not os.path.exists(STORAGE_FILE):
            return jsonify({"error": "not found"}), 404
        with open(STORAGE_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
        for item in data:
            if item.get("id") == cid:
                return jsonify(item)
        return jsonify({"error": "not found"}), 404
    except Exception as e:
        logger.error(f"Read error: {str(e)}", exc_info=True)
        raise


@app.route("/dialogflow/message", methods=["POST"])
def dialogflow_message():
    """Handle Dialogflow messages"""
    if not session_client or not dialogflow_project_id:
        logger.error("Dialogflow not initialized")
        return jsonify({"error": "Dialogflow not initialized"}), 500
    
    try:
        payload = request.get_json()
        text = payload.get("text", "").strip()
        session_id = payload.get("sessionId", "default-session")
        
        if not text:
            return jsonify({"error": "text field is required"}), 400
        
        logger.info(f"Processing Dialogflow message: {text}")
        
        # Create Dialogflow session path
        session_path = session_client.session_path(dialogflow_project_id, session_id)
        logger.info(f"Session path: {session_path}")
        
        # Prepare query
        text_input = dialogflow.types.TextInput(text=text, language_code="en-US")
        query_input = dialogflow.types.QueryInput(text=text_input)
        
        # Send to Dialogflow
        response = session_client.detect_intent(session=session_path, query_input=query_input)
        
        fulfillment_text = response.query_result.fulfillment_text
        logger.info(f"Dialogflow response: {fulfillment_text}")
        
        return jsonify({
            "fulfillment_text": fulfillment_text,
            "intent": response.query_result.intent.display_name,
            "confidence": response.query_result.intent_detection_confidence,
            "sessionId": session_id,
        }), 200
    except Exception as e:
        logger.error(f"Dialogflow error: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500


@app.route("/complaints/update", methods=["POST"])
def update_complaint_status():
    """Update complaint status"""
    try:
        payload = request.get_json()
        complaint_id = payload.get("complaint_id")
        new_status = payload.get("status")
        
        if not complaint_id or not new_status:
            return jsonify({"error": "complaint_id and status required"}), 400
        
        # Read current complaints
        if not os.path.exists(STORAGE_FILE):
            return jsonify({"error": "No complaints found"}), 404
        
        with open(STORAGE_FILE, "r", encoding="utf-8") as f:
            complaints = json.load(f)
        
        # Update status
        updated = False
        for complaint in complaints:
            if complaint.get("id") == complaint_id:
                complaint["student_view"]["status"] = new_status
                updated = True
                break
        
        if not updated:
            return jsonify({"error": "Complaint not found"}), 404
        
        # Save updated complaints
        with open(STORAGE_FILE, "w", encoding="utf-8") as f:
            json.dump(complaints, f, indent=2)
        
        logger.info(f"Updated complaint {complaint_id} status to {new_status}")
        return jsonify({"message": "Status updated successfully"}), 200
    except Exception as e:
        logger.error(f"Update error: {str(e)}", exc_info=True)
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)



