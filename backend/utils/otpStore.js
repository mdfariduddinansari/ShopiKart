/**
 * In-memory OTP store with automatic expiration
 * In production, use Redis instead
 */

const otpStore = new Map();
const timers = new Map();

module.exports = {
  set: (email, otp, expiryTime = 5 * 60 * 1000) => {
    // Clear existing timer if any
    if (timers.has(email)) {
      clearTimeout(timers.get(email));
    }

    // Store OTP
    otpStore.set(email, otp);

    // Set expiry timer
    const timer = setTimeout(() => {
      otpStore.delete(email);
      timers.delete(email);
      console.log(`OTP expired for email: ${email}`);
    }, expiryTime);

    timers.set(email, timer);
  },

  get: (email) => {
    return otpStore.get(email) || null;
  },

  delete: (email) => {
    otpStore.delete(email);
    if (timers.has(email)) {
      clearTimeout(timers.get(email));
      timers.delete(email);
    }
  },

  clear: () => {
    // Clear all timers
    timers.forEach(timer => clearTimeout(timer));
    otpStore.clear();
    timers.clear();
  }
};
