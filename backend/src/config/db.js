const mongoose = require('mongoose');

async function connectToDatabase() {
  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    throw new Error('MONGODB_URI is not set');
  }

  mongoose.set('strictQuery', true);
  await mongoose.connect(mongoUri, {
    autoIndex: true,
  });
  return mongoose.connection;
}

module.exports = { connectToDatabase };


