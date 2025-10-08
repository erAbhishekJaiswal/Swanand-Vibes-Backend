const mongoose = require('mongoose');

const db = () =>{
  mongoose.connect('mongodb+srv://abhishekjaiswalkit:SPViEM61ARTFTDB5@cluster0.g0bz4e1.mongodb.net/', {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => {
  console.log('MongoDB connected successfully');
})
.catch((error) => {
  console.error('MongoDB connection error:', error);
});
}

module.exports = db;
