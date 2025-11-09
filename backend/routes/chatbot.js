import express from 'express';
import DialogflowService from '../services/dialogflowService.js';

const router = express.Router();
const dialogflowService = new DialogflowService();

/**
 * POST /api/chatbot/message
 * Send a message to the chatbot and get a response
 */
router.post('/message', async (req, res) => {
  try {
    const { message, sessionId } = req.body;

    // Validate input
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Message is required and must be a non-empty string',
      });
    }

    // Use provided sessionId or generate a new one
    const currentSessionId = sessionId || dialogflowService.generateSessionId();

    // Send query to Dialogflow
    const response = await dialogflowService.detectIntent(currentSessionId, message.trim());

    // Return response with sessionId
    res.json({
      ...response,
      sessionId: currentSessionId,
    });
  } catch (error) {
    console.error('Error in chatbot message endpoint:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'Sorry, something went wrong. Please try again later.',
    });
  }
});

/**
 * POST /api/chatbot/session
 * Generate a new session ID
 */
router.post('/session', (req, res) => {
  try {
    const sessionId = dialogflowService.generateSessionId();
    res.json({
      success: true,
      sessionId,
    });
  } catch (error) {
    console.error('Error generating session:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate session ID',
    });
  }
});

/**
 * GET /api/chatbot/contexts/:sessionId
 * Get active contexts for a session
 */
router.get('/contexts/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        error: 'Session ID is required',
      });
    }

    const contexts = await dialogflowService.getContexts(sessionId);
    res.json({
      success: true,
      contexts,
    });
  } catch (error) {
    console.error('Error getting contexts:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to retrieve contexts',
    });
  }
});

/**
 * POST /api/chatbot/context
 * Create a new context for a session
 */
router.post('/context', async (req, res) => {
  try {
    const { sessionId, contextName, parameters, lifespanCount } = req.body;

    if (!sessionId || !contextName) {
      return res.status(400).json({
        success: false,
        error: 'Session ID and context name are required',
      });
    }

    const result = await dialogflowService.createContext(
      sessionId,
      contextName,
      parameters || {},
      lifespanCount || 5
    );

    res.json(result);
  } catch (error) {
    console.error('Error creating context:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create context',
    });
  }
});

export default router;
