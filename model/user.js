const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userDetails = new Schema({
    name : String,
    phone : Number,
    age : Number,  
    pincode : Number,
    aadhar : Number,
    password : String,
    vaccinStatus : String, // this represent user dosage stage , value = ['none','first dose completed','all completed']
    userType : String   // user type represent user is admin or normal user ,value= ['admin','user']
})
module.exports = mongoose.model('userdetails',userDetails);