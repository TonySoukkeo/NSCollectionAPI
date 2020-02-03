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
    wishList: [
      {
        gameId: {
          type: Schema.Types.ObjectId,
          required: true,
          ref: "Game"
        }
      }
    ],
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
    notifications: [
      {
        message: {
          type: String,
          required: true
        },
        gameId: {
          type: Schema.Types.ObjectId,
          ref: "Game"
        },
        userId: {
          type: Schema.Types.ObjectId,
          ref: "User"
        },
        notifyType: {
          type: String,
          required: true
        }
      }
    ],
    pwResetToken: String,
    pwResetExpiration: Date
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model("user", userSchema);
