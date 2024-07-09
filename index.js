const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
const port = 3000;


app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect("mongodb+srv://ssdb001:Shark_002@nodeexpressprojects.98wpo.mongodb.net/")
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB', err));

// User schema and model
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  dob: { type: Date, required: true },
  mobileNumber: { type: String, required: true, unique: true }
});

const User = mongoose.model('User', userSchema);

// Signup endpoint
app.post('/signup', async (req, res) => {
  try {
    const { username, password, email, dob, mobileNumber } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }
    const newUser = new User({ username, password, email, dob, mobileNumber });
    await newUser.save();
    res.status(201).send('User registered successfully');
  } catch (error) {
    res.status(400).send('Error registering user: ' + error.message);
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).send('Invalid email');
    }
    if (user.password != password) {
      return res.status(400).send('Invalid password');
    }
    const token = jwt.sign({ userId: user._id }, 'my_key',);
    res.status(200).json({ token });
  } catch (error) {
    res.status(400).send('Error logging in: ' + error.message);
  }
});


app.get('/profile', async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, 'my_key');
    const user = await User.findById(decoded.userId).select('-password');

    if (!user) {
      return res.status(404).send('User not found');
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(400).send('Error fetching profile: ' + error.message);
  }
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
