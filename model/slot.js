const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const slot = new Schema({
    userId : Number, // userId represent phone number given by the user at the time of registration
    date : String,  // registered slot date and date should be in this formate -> "10 January" / "11 february"
    time : String,  // registered slot time and time should be in this formate -> "10 AM" / "10:30 AM"
    doseType : String // this should be in this formate --> "First dose" or "Second dose"
})

module.exports = mongoose.model('slot', slot)