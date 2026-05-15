const mongoose = require('mongoose');

const NoteSchema = new mongoose.Schema(
  {
    title: {
      type:      String,
      required:  [true, 'Title is required'],
      trim:      true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    content: {
      type:     String,
      required: [true, 'Content is required'],
      trim:     true,
    },
    owner: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true,
    },
    sharedWith: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref:  'User',
      },
    ],
    // Custom feature: tags for categorisation
    tags: [
      {
        type:      String,
        trim:      true,
        lowercase: true,
      },
    ],
    // Custom feature: pin to top
    isPinned: {
      type:    Boolean,
      default: false,
    },
  },
  {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    toJSON: {
      virtuals: true,
      transform(_, ret) {
        ret.id    = ret._id.toString();
        ret.owner = ret.owner?.toString?.() ?? ret.owner;
        ret.sharedWith = (ret.sharedWith || []).map((id) =>
          id?.toString?.() ?? id
        );
        delete ret._id;
        delete ret.__v;
        delete ret.score; // remove text-search score if projected
      },
    },
  }
);

// Compound text index for full-text search across title, content, and tags
NoteSchema.index({ title: 'text', content: 'text', tags: 'text' });
// Performance index for the most common access pattern
NoteSchema.index({ owner: 1, created_at: -1 });

module.exports = mongoose.model('Note', NoteSchema);
