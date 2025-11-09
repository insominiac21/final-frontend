const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

class ChatbotService {
  constructor() {
    this.baseURL = `${API_BASE_URL}/api/chatbot`;
  }

  /**
   * Create a new chat session
   * @returns {Promise<string>} Session ID
   */
  async createSession() {
    try {
      const response = await fetch(`${this.baseURL}/session`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.sessionId) {
        return data.sessionId;
      }
      throw new Error('Failed to create session');
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  /**
   * Send a message to the chatbot
   * @param {string} message - User's message
   * @param {string} sessionId - Current session ID
   * @returns {Promise<Object>} Bot response
   */
  async sendMessage(message, sessionId) {
    try {
      const response = await fetch(`${this.baseURL}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          sessionId,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Get contexts for a session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Array>} List of contexts
   */
  async getContexts(sessionId) {
    try {
      const response = await fetch(`${this.baseURL}/contexts/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data.contexts || [];
    } catch (error) {
      console.error('Error getting contexts:', error);
      throw error;
    }
  }

  /**
   * Create a context for a session
   * @param {string} sessionId - Session ID
   * @param {string} contextName - Name of the context
   * @param {Object} parameters - Context parameters
   * @param {number} lifespanCount - Context lifespan
   * @returns {Promise<Object>} Result
   */
  async createContext(sessionId, contextName, parameters = {}, lifespanCount = 5) {
    try {
      const response = await fetch(`${this.baseURL}/context`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sessionId,
          contextName,
          parameters,
          lifespanCount,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error creating context:', error);
      throw error;
    }
  }
}

export default new ChatbotService();
