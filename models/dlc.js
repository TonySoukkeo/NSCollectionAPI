const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const dlcSchema = new Schema({
  title: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("dlc", dlcSchema);
