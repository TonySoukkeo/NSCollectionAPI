const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const saleSchema = new Schema({
  title: {
    type: String,
    required: true
  }
});

module.exports = mongoose.model("sale", saleSchema);
