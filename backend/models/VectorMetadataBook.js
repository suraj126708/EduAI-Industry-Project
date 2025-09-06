// models/VectorMetadataBook.js
import mongoose from "mongoose";

const vectorMetadataBookSchema = new mongoose.Schema(
  {
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Book",
      required: true,
    },

    chunkId: {
      type: Number,
      required: true,
      min: 0,
    },

    chapter: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    llmMetadata: {
      type: mongoose.Schema.Types.Mixed, // JSON object
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    collection: "vector_metadata_books",
  }
);

// Indexes
vectorMetadataBookSchema.index({ bookId: 1 });
vectorMetadataBookSchema.index({ chunkId: 1 });
vectorMetadataBookSchema.index({ chapter: 1 });
vectorMetadataBookSchema.index({ bookId: 1, chunkId: 1 }, { unique: true });
vectorMetadataBookSchema.index({ bookId: 1, chapter: 1 });

// Instance methods
vectorMetadataBookSchema.methods.getBook = function () {
  return mongoose.model("Book").findById(this.bookId);
};

vectorMetadataBookSchema.methods.isValidChunkId = function () {
  return this.chunkId >= 0;
};

vectorMetadataBookSchema.methods.getMetadataKeys = function () {
  if (this.llmMetadata && typeof this.llmMetadata === "object") {
    return Object.keys(this.llmMetadata);
  }
  return [];
};

vectorMetadataBookSchema.methods.getMetadataValue = function (key) {
  if (this.llmMetadata && typeof this.llmMetadata === "object") {
    return this.llmMetadata[key];
  }
  return null;
};

vectorMetadataBookSchema.methods.setMetadataValue = function (key, value) {
  if (!this.llmMetadata || typeof this.llmMetadata !== "object") {
    this.llmMetadata = {};
  }
  this.llmMetadata[key] = value;
};

// Static methods
vectorMetadataBookSchema.statics.findByBook = function (bookId) {
  return this.find({ bookId });
};

vectorMetadataBookSchema.statics.findByChunkId = function (chunkId) {
  return this.find({ chunkId });
};

vectorMetadataBookSchema.statics.findByChapter = function (chapter) {
  return this.find({ chapter: { $regex: chapter, $options: "i" } });
};

vectorMetadataBookSchema.statics.findByBookAndChunkId = function (
  bookId,
  chunkId
) {
  return this.findOne({ bookId, chunkId });
};

vectorMetadataBookSchema.statics.findByBookAndChapter = function (
  bookId,
  chapter
) {
  return this.find({ bookId, chapter: { $regex: chapter, $options: "i" } });
};

vectorMetadataBookSchema.statics.findByChunkIdRange = function (
  minChunkId,
  maxChunkId
) {
  return this.find({ chunkId: { $gte: minChunkId, $lte: maxChunkId } });
};

vectorMetadataBookSchema.statics.findByBookAndChunkIdRange = function (
  bookId,
  minChunkId,
  maxChunkId
) {
  return this.find({
    bookId,
    chunkId: { $gte: minChunkId, $lte: maxChunkId },
  });
};

vectorMetadataBookSchema.statics.getChaptersByBook = function (bookId) {
  return this.distinct("chapter", { bookId });
};

vectorMetadataBookSchema.statics.getChunkCountByBook = function (bookId) {
  return this.countDocuments({ bookId });
};

vectorMetadataBookSchema.statics.getChunkCountByChapter = function (
  bookId,
  chapter
) {
  return this.countDocuments({
    bookId,
    chapter: { $regex: chapter, $options: "i" },
  });
};

vectorMetadataBookSchema.statics.getMaxChunkIdByBook = function (bookId) {
  return this.findOne({ bookId }).sort({ chunkId: -1 }).select("chunkId");
};

vectorMetadataBookSchema.statics.getMinChunkIdByBook = function (bookId) {
  return this.findOne({ bookId }).sort({ chunkId: 1 }).select("chunkId");
};

// Transform output
vectorMetadataBookSchema.methods.toJSON = function () {
  const vmbObject = this.toObject();
  delete vmbObject.__v;
  return vmbObject;
};

const VectorMetadataBook = mongoose.model(
  "VectorMetadataBook",
  vectorMetadataBookSchema
);

export default VectorMetadataBook;
