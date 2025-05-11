const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

const userSchema = new mongoose.Schema({
  email:     { type: String, required: true, unique: true, lowercase: true },
  password:  { type: String },
  provider:  { type: String, enum: ['email','google'], default: 'email' },
  verified:  { type: Boolean, default: false },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (this.provider === 'email' && this.isModified('password')) {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

userSchema.methods.comparePassword = function(candidate) {
  if (this.provider !== 'email') return false;
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', userSchema);
