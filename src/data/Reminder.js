const utils = require("../utils");

/**
 * @property {number} id
 * @property {string} thread_id
 * @property {string} created_by
 * @property {string} fire_at
 * @property {string} created_at
 */
class Reminder {
  constructor(props) {
    utils.setDataModelProps(this, props);
  }

  getSQLProps() {
    return Object.entries(this).reduce((obj, [key, value]) => {
      if (typeof value === "function") return obj;
      if (typeof value === "object" && value != null) {
        obj[key] = JSON.stringify(value);
      } else {
        obj[key] = value;
      }
      return obj;
    }, {});
  }
}

module.exports = Reminder;
