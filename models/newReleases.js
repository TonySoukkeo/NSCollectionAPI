const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const newReleasesSchema = new Schema(
  {
    price: Number,
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

newReleasesSchema.virtual("details", {
  ref: "Game",
  localField: "title",
  foreignField: "title"
});

module.exports = mongoose.model("new release", newReleasesSchema);
