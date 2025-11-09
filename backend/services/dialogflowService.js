import { SessionsClient } from '@google-cloud/dialogflow';
import { v4 as uuidv4 } from 'uuid';

class DialogflowService {
  constructor() {
    // Construct service account credentials from environment variables
    const credentials = {
      type: process.env.GOOGLE_SERVICE_ACCOUNT_TYPE,
      project_id: process.env.GOOGLE_SERVICE_ACCOUNT_PROJECT_ID,
      private_key_id: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY_ID,
      private_key: process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_EMAIL,
      client_id: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_ID,
      auth_uri: process.env.GOOGLE_SERVICE_ACCOUNT_AUTH_URI,
      token_uri: process.env.GOOGLE_SERVICE_ACCOUNT_TOKEN_URI,
      auth_provider_x509_cert_url: process.env.GOOGLE_SERVICE_ACCOUNT_AUTH_PROVIDER_CERT_URL,
      client_x509_cert_url: process.env.GOOGLE_SERVICE_ACCOUNT_CLIENT_CERT_URL,
      universe_domain: process.env.GOOGLE_SERVICE_ACCOUNT_UNIVERSE_DOMAIN,
    };

    // Validate that all required credentials are present
    const requiredFields = [
      'type', 'project_id', 'private_key_id', 'private_key', 
      'client_email', 'client_id'
    ];
    
    for (const field of requiredFields) {
      if (!credentials[field]) {
        throw new Error(
          `Missing required service account credential: ${field}. ` +
          'Please check your backend/.env file.'
        );
      }
    }

    // Initialize Dialogflow client with credentials from environment
    this.sessionClient = new SessionsClient({
      credentials: credentials
    });
    
    // Get project ID from environment
    this.projectId = process.env.DIALOGFLOW_PROJECT_ID || process.env.GOOGLE_SERVICE_ACCOUNT_PROJECT_ID;
    this.languageCode = process.env.DIALOGFLOW_LANGUAGE_CODE || 'en-US';

    console.log('✅ Dialogflow service initialized with environment credentials');
  }

  /**
   * Send a text query to Dialogflow
   * @param {string} sessionId - Unique session ID for the conversation
   * @param {string} query - User's query text
   * @returns {Promise<Object>} Dialogflow response
   */
  async detectIntent(sessionId, query) {
    try {
      // Create session path
      const sessionPath = this.sessionClient.projectAgentSessionPath(
        this.projectId,
        sessionId
      );

      // The text query request
      const request = {
        session: sessionPath,
        queryInput: {
          text: {
            text: query,
            languageCode: this.languageCode,
          },
        },
      };

      // Send request and get response
      const responses = await this.sessionClient.detectIntent(request);
      const result = responses[0].queryResult;

      return {
        success: true,
        fulfillmentText: result.fulfillmentText,
        intent: result.intent ? result.intent.displayName : 'No intent matched',
        confidence: result.intentDetectionConfidence,
        parameters: result.parameters,
        allRequiredParamsPresent: result.allRequiredParamsPresent,
      };
    } catch (error) {
      console.error('Error in Dialogflow detectIntent:', error);
      return {
        success: false,
        error: error.message,
        fulfillmentText: 'Sorry, I encountered an error. Please try again.',
      };
    }
  }

  /**
   * Generate a unique session ID
   * @returns {string} UUID session ID
   */
  generateSessionId() {
    return uuidv4();
  }

  /**
   * Get context information for a session
   * @param {string} sessionId - Session ID
   * @returns {Promise<Array>} List of active contexts
   */
  async getContexts(sessionId) {
    try {
      const sessionPath = this.sessionClient.projectAgentSessionPath(
        this.projectId,
        sessionId
      );

      const request = {
        parent: sessionPath,
      };

      const [contexts] = await this.sessionClient.listContexts(request);
      return contexts;
    } catch (error) {
      console.error('Error getting contexts:', error);
      return [];
    }
  }

  /**
   * Create a context for a session
   * @param {string} sessionId - Session ID
   * @param {string} contextName - Name of the context
   * @param {Object} parameters - Context parameters
   * @param {number} lifespanCount - Number of queries the context should survive
   */
  async createContext(sessionId, contextName, parameters = {}, lifespanCount = 5) {
    try {
      const sessionPath = this.sessionClient.projectAgentSessionPath(
        this.projectId,
        sessionId
      );

      const contextPath = `${sessionPath}/contexts/${contextName}`;

      const context = {
        name: contextPath,
        lifespanCount: lifespanCount,
        parameters: parameters,
      };

      const request = {
        parent: sessionPath,
        context: context,
      };

      await this.sessionClient.createContext(request);
      return { success: true };
    } catch (error) {
      console.error('Error creating context:', error);
      return { success: false, error: error.message };
    }
  }
}

export default DialogflowService;
