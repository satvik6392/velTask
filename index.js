const express = require('express');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();
const port = 3000;


app.use(express.json());
app.use(cors());

// const connection = mysql.createConnection({
//   host: 'localhost', 
//   user: 'root', 
//   database: 'veltask'
// });

// // Open the MySQL connection
// connection.connect(error => {
//   if (error) {
//     console.error('Error connecting to the database:', error.stack);
//     return;
//   }
//   console.log('Connected to the database as ID', connection.threadId);
// });

mongoose.connect("mongodb+srv://ssdb001:Shark_002@nodeexpressprojects.98wpo.mongodb.net/veltask")
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Failed to connect to MongoDB', err));


const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  dob: { type: Date, required: true },
  mobileNumber: { type: String, required: true,unique : true},
  role: { type: String, required: true, default: 'user', enum: ['admin', 'user'] }
});

const User = mongoose.model('User', userSchema);



const adminMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, 'my_key');
    const user = await User.findById(decoded.userId);

    if (!user || user.role !== 'admin') {
      return res.status(403).send('Access denied. Admins only.');
    }

    next();
  } catch (error) {
    res.status(401).send('Unauthorized: ' + error.message);
  }
};


app.post('/signup', async (req, res) => {
  try {
    const { username, password, email, dob, mobileNumber, role  } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(400).json({ message: 'User already exists' });
    }
    const newUser = new User({ username, password, email, dob, mobileNumber,role });
    await newUser.save();
    const status = 'success'
    const token = jwt.sign({ userId: newUser._id }, 'my_key',);
    res.status(201).send({status,token,user : newUser});
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
      console.log(user.password);
      return res.status(400).send('Invalid password');
    }
    const token = jwt.sign({ userId: user._id }, 'my_key',);
    // const user = await User.findById({email}).select('-password');
    res.status(200).json({ token,user });
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
    res.status(200).json({user: user});
  } catch (error) {
    res.status(400).send('Error fetching profile: ' + error.message);
  }
});

app.get('/allUsers', adminMiddleware, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.status(200).json({users : users});
  } catch (error) {
    res.status(400).send('Error fetching users: ' + error.message);
  }
});


app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
