const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mongoose_fuzzy_searching = require("mongoose-fuzzy-searching");

const gamesSchema = new Schema({
  title: { type: String, required: true },
  price: Number,
  description: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  gallery: {
    type: Array,
    required: true
  },
  image: {
    type: String,
    required: true
  },
  rating: {
    type: String,
    required: true
  },
  publisher: {
    type: String,
    required: true
  },
  releaseDate: {
    type: String,
    required: true
  },
  numOfPlayers: {
    type: String,
    required: true
  },
  fileSize: {
    type: String,
    required: true
  },
  ownedBy: [
    {
      user: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User"
      }
    }
  ],
  watchedBy: [
    {
      user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
      }
    }
  ],
  wantedBy: [
    {
      user: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User"
      }
    }
  ],
  demo: Boolean,
  onlinePlay: Boolean,
  cloudSave: Boolean,
  dlc: [],
  salePrice: Number
});

// gamesSchema.index({ title: "text" });
gamesSchema.plugin(mongoose_fuzzy_searching, {
  fields: [
    { name: "title", weight: 5 },
    { name: "description", weight: 1 }
  ]
});

module.exports = mongoose.model("Game", gamesSchema);
