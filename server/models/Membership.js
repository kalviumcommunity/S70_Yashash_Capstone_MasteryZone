const mongoose = require('mongoose');

const memberSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  zone: { type: String, enum: ['CODING', 'GYM', 'VECHILES', 'LANGUAGE'], required: true },
  tier: { type: String, enum: ['silver', 'gold', 'platinum'], default: 'gold' },
  cycle: { type: String, enum: ['monthly', 'annual'], default: 'monthly' },
  primaryName: { type: String, required: true },
  email: { type: String, required: true },
  accentColor: { type: String, default: '#00A859' },
  passId: { type: String },
  roster: [
    {
      name: { type: String, required: true },
      age: { type: Number, required: true },
      relationship: { type: String, required: true },
      goal: { type: String, required: true },
      addedAt: { type: Date, default: Date.now }
    }
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// A user can only have one membership pass per zone
memberSchema.index({ userId: 1, zone: 1 }, { unique: true });

module.exports = mongoose.model('Membership', memberSchema);
