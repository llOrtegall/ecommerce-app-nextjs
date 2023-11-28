import { UserModel } from './models/User.js';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import bycrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const MONGO_URL=process.env.MONGO_URL
const JWT_SECRET=process.env.JWT_SECRET
const bcryptSalt = bycrypt.genSaltSync(10);
const PORT = 4040;
const app = express();

app.disable('x-powered-by');

app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(cookieParser());

mongoose.connect(MONGO_URL);

app.get('/test', (req, res) => {
  res.json({ message: 'Hello World' });
});

app.get('/login', async (req, res) => {
  const { username, password } = req.body
  const foundUser = await UserModel.findOne({username})
  if(foundUser){
    const passOk = bycrypt.compareSync(password, foundUser.password)
    if(passOk){
      jwt.sign({userId: foundUser._id, username}, JWT_SECRET, {}, (err, token) => {
        
      })
    }
  }

  
});

app.get('/profile', async (req, res) => {
  const token = req.cookies?.token;
  if(token){
    jwt.verify(token, JWT_SECRET, {}, (err, userData) => {
      if(err) throw err;
      res.json(userData)
    })
  }else{
    res.status(401).json({message: 'Unauthorized'})
  }
});
 

app.post('/register', async(req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = bycrypt.hashSync(password, bcryptSalt)
    const createdUser = await UserModel.create({ 
      username: username,
      password: hashedPassword
    })
    jwt.sign({userId: createdUser._id, username}, JWT_SECRET, {}, (err, token) => {
      if (err) {
        res.status(500).json({message: 'Internal server error', error: err})
      }
      res.cookie('token', token, {sameSite: 'none', secure: true }).status(201).json({
        id: createdUser._id, 
      })
    })
  } catch (err) {
    res.status(500).json({message: 'Internal server error', error: err})
  }
  
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});