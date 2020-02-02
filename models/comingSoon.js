const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const comingSoonSchema = new Schema(
  {
    title: {
      type: String,
      required: true
    }
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

comingSoonSchema.virtual("details", {
  ref: "Game",
  localField: "title",
  foreignField: "title"
});

module.exports = mongoose.model("Coming Soon", comingSoonSchema);
