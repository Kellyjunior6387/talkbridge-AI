import { escalateToAgent as atEscalateToAgent } from './africastalking.js';

/**
 * Escalates an urgent message to a human agent via Africa's Talking SMS
 * @param {Object} payload - Escalation details
 */
export async function escalateToAgent(payload) {
  return atEscalateToAgent(payload);
}
