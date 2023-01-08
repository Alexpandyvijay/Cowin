const express = require('express')
const mongoose = require('mongoose');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const router = require('./index.js');
require('dotenv').config();
mongoose.set('strictQuery', false);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.json());
app.use(cors());

app.use('/',router);
mongoose.connect(process.env.MONGO_URL,()=>(console.log('Database connected successfully ......')));
app.listen(process.env.PORT || 4000, ()=>(console.log(`server running at port ${process.env.PORT}`)));