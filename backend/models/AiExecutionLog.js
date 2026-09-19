const db = require('../config/database');

class AiExecutionLog {
  static async log({ action_id, plan_id, store_id, attempt_number = 1, status, request_payload = {}, result_payload = {}, error_message = null }) {
    const res = await db.query(
      `INSERT INTO ai_action_execution_logs 
       (action_id, plan_id, store_id, attempt_number, status, request_payload, result_payload, error_message, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
       RETURNING *`,
      [action_id, plan_id, store_id, attempt_number, status, request_payload, result_payload, error_message]
    );
    return res.rows[0];
  }

  static async findByAction(action_id, store_id) {
    const res = await db.query(
      `SELECT * FROM ai_action_execution_logs WHERE action_id = $1 AND store_id = $2 ORDER BY started_at DESC`,
      [action_id, store_id]
    );
    return res.rows;
  }
}

module.exports = AiExecutionLog;
