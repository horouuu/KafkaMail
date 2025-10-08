const utils = require("../utils");

/**
 * @property {number} id
 * @property {string} thread_id
 * @property {string} author_id
 * @property {string} body
 * @property {string} created_at
 */
class Reminder {
  constructor(props) {
    utils.setDataModelProps(this, props);
  }
}

module.exports = Reminder;
