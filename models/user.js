const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    firstName: {
      type: String,
      required: true
    },
    lastName: {
      type: String,
      required: true
    },
    userName: {
      type: String,
      required: true
    },
    email: {
      type: String,
      required: true
    },
    password: {
      type: String,
      required: true
    },
    gameCollection: [
      {
        gameId: {
          type: Schema.Types.ObjectId,
          required: true,
          ref: "Game"
        }
      }
    ],
    wishList: {
      required: true,
      type: Array,
      default: []
    },
    following: {
      required: true,
      type: Array,
      default: []
    },
    followers: {
      type: Array,
      required: true,
      default: []
    },
    isVerified: {
      required: true,
      type: Boolean,
      default: false
    },
    pwResetToken: String,
    pwResetExpiration: Date
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("user", userSchema);
