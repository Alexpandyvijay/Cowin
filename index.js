const express = require('express')
const mongoose = require('mongoose');
const router = express.Router();
const userDetails = require('./model/user.js');
const slot = require('./model/slot.js');
const {body , validationResult} = require('express-validator');
const {sign ,verify} = require('jsonwebtoken');
const {hash,compare} = require('bcrypt');

/* '/register' used to register user */

router.post('/register', body('name').notEmpty(), 
            body('phone').isNumeric().isLength({min : 10 , max : 10}),
            body('age').isInt({min : 18 , max : 110}),
            body('pincode').isNumeric().isLength({min : 6, max : 6}),
            body('aadhar').isNumeric().isLength({min : 12, max : 12}),
            body('password').notEmpty().isLength({min : 8}),
            body('vaccinStatus').isIn(['none','first dose completed','all completed']),async (req,res)=>{
                const error = validationResult(req);
                if(!error.isEmpty()){
                    res.status(400).json({ errors: error.array() });
                }else{
                    let newUser = {...req.body};
                    newUser['password'] = await hash(req.body.password,10);
                    userDetails.create(newUser, (err)=>{
                        if(err){
                            res.json({
                                status : 'failed',
                                message : err
                            })
                        }else{
                            res.json({
                                status : 'success',
                                message : 'user successfully registered..'
                            })
                        }
                    })
                }
            })

/* '/login' used to login, this api will generate jwt bearer token for authorization */

router.post('/login', body('phone').isNumeric().isLength({min : 10 , max : 10}),
            body('password').notEmpty().isLength({min : 8}), async (req,res)=>{
                const error = validationResult(req);
                if(!error.isEmpty()){
                    res.status(400).json({ errors: error.array() });
                }else{
                    const {phone , password} = req.body;
                    let userExist = await userDetails.findOne({phone : phone});
                    if(!userExist){
                        res.json({
                            status : 'failed',
                            message : 'Invalid Phone number'
                        })
                    }else{
                        if(await compare(password,userExist.password)){
                            const token = sign({phone},process.env.JWT_SECRET_KEY);
                            res.json({
                                status : 'success',
                                message : 'authenticated successfully',
                                token
                            })
                        }else{
                            res.json({
                                status : 'failed',
                                message : 'Incorrect password'
                            })
                        }
                    }
                }
            })

/* '/slotAvailable' will return the slot available at that particular date in this formate ['10 AM','10:30 AM','11 AM'] */

router.get('/slotAvailable', body('date').notEmpty() ,async (req,res)=>{
    let token = req.headers['authorization'].split(' ')[1];
    const error = validationResult(req);
    if(!error.isEmpty()){
        res.status(400).json({ errors: error.array() });
    }else{
        if(!token){
            res.json({
                status : 'failed',
                message : 'unauthorized'
            })
        }else{
            let {phone} = verify(token,process.env.JWT_SECRET_KEY);
            let userExist = await userDetails.find({phone : phone});
            if(!userExist){
                res.json({
                    status : 'failed',
                    message : 'unauthorized'
                })
            }else{
                slot.find({ date : req.body.date}, (err, doc)=>{
                    if(err){
                        res.json({
                            status : 'failed',
                            message : err
                        });
                    }else if(doc.length==0){
                        res.json({
                            status : 'success',
                            availableSlot : ['10 AM','10:30 AM','11 AM','11:30 AM','12 PM','12:30 PM','1 PM','1:30 PM','2 PM','2:30 PM','3 PM','3:30 PM','4 PM','4:30 PM']
                        })
                    }else{
                        console.log(doc);
                        let count = {
                            '10 AM': 0,'10:30 AM': 0,'11 AM':0,'11:30 AM':0,'12 PM':0,'12:30 PM':0,'1 PM':0,'1:30 PM':0,'2 PM':0,'2:30 PM':0,'3 PM':0,'3:30 PM':0,'4 PM':0,'4:30 PM':0
                        };
                        let finalSlot = []
                        for(let obj of doc){
                            if(obj.time in count){
                                count[obj.time] +=1;
                            }
                        }
                        for(let key in count){
                            if(count[key]<10){
                                finalSlot.push(key);
                            }
                        }
                        res.json({
                            status : 'success',
                            availableSlot : finalSlot
                        })
                    }
                })
            }
        }
    }
})

/* '/registerSlot' will register slot for the selected date an time and this will create a document in slot collection*/

router.post('/registerSlot', body('time').notEmpty(), body('date').notEmpty(), async (req,res)=>{
    let token = req.headers['authorization'].split(' ')[1];
    const error = validationResult(req);
    if(!error.isEmpty()){
        res.status(400).json({ errors: error.array() });
    }else{
        if(!token){
            res.json({
                status : 'failed',
                message : 'unauthorized'
            })
        }else{
            let {phone} = verify(token,process.env.JWT_SECRET_KEY);
            let userExist = await userDetails.findOne({phone : phone});
            let alreadyRegistered = await slot.findOne({userId : phone});
            if(!userExist){
                res.json({
                    status : 'failed',
                    message : 'unauthorized'
                })
            }else if(alreadyRegistered){
                res.json({
                    status : 'failed',
                    message : 'Already registered for dose'
                })
            }else{
                const newSlot = {
                    userId : phone,
                    date : req.body.date,
                    time : req.body.time,
                    doseType : ''
                }
                if(userExist.vaccinStatus === 'all completed'){
                    res.json({
                        status : 'success',
                        message : 'Two doses completed'
                    })
                }else{
                    if(userExist.vaccinStatus === 'none'){
                        newSlot.doseType = 'First dose'
                    }else if(userExist.vaccinStatus === 'first dose completed'){
                        newSlot.doseType = 'Second dose'
                    }
                    slot.create(newSlot,(err)=>{
                        if(err){
                            res.json({
                                status : 'failed',
                                message : err
                            })
                        }else{
                            res.json({
                                status : 'success',
                                message : 'slot for dose registered'
                            })
                        }
                    })
                }
            }
        }
    }
})

/* '/updateSlot' will update the registered slot , till 24 hour prior to the already registered slot */
router.put('/updateSlot', body('time').notEmpty(), body('date').notEmpty(),async (req,res)=>{
    let token = req.headers['authorization'].split(' ')[1];
    const error = validationResult(req);
    if(!error.isEmpty()){
        res.status(400).json({ errors: error.array() });
    }else{
        if(!token){
            res.json({
                status : 'failed',
                message : 'unauthorized'
            })
        }else{
            let {phone} = verify(token,process.env.JWT_SECRET_KEY);
            let userExist = await userDetails.find({phone : phone});
            if(!userExist){
                res.json({
                    status : 'failed',
                    message : 'unauthorized'
                })
            }else{
                let oldSlot = await slot.findOne({userId : phone});
                let timeString = oldSlot.date.split(' ').reverse().join(' ')+','+' 2023 '+oldSlot.time.split(' ')[0]+':00';
                let oldTime = new Date(timeString);
                let presentTime = new Date();
                let diffTime = Math.abs(oldTime - presentTime);
                diffTime = Math.ceil(diffTime / (1000 * 60 * 60));
                console.log(diffTime);
                if(diffTime>24){
                    slot.updateOne({userId : phone},{ time : req.body.time, date : req.body.date},(err)=>{
                        if(err){
                            res.json({
                                status : 'failed',
                                message : err
                            })
                        }else{
                            res.json({
                                status : 'success',
                                message : `slot update to ${req.body.date} ${req.body.time} `
                            })
                        }
                    })

                }else{
                    res.json({
                        status : 'success',
                        message : 'User can update registered slot, till 24 hours prior to his registered slot time'
                    })
                }
            }
        }
    }
})
/* '/userInfo' will filter and return document according to the request 
we need to send request with body contain information in this formate { age : 25} or {pincode : 6-----0} or what every required
and this only accessed by admin */
router.get('/userInfo', async (req,res)=>{
    let token = req.headers['authorization'].split(' ')[1];
    if(!token){
        res.json({
            status : 'failed',
            message : 'unauthorized'
        })
    }else{
        let {phone} = verify(token,process.env.JWT_SECRET_KEY);
        let userExist = await userDetails.findOne({phone : phone});
        if(!userExist){
            res.json({
                status : 'failed',
                message : 'user not exist'
            })
        }else{
            if(userExist.userType !== 'admin'){
                res.json({
                    status : 'failed',
                    message : 'you are not allowed to access this page'
                })
            }else{
                userDetails.find({...req.body},(err,doc)=>{
                    if(err){
                        res.json({
                            status : 'failed',
                            message : err
                        })
                    }else{
                        res.json({
                            status : 'success',
                            totalUserInThisCategory : doc.length,
                            data : doc
                        })
                    }
                })
            }
        }
    }
})
/* '/slotInfo' return data regarding the slot registered. request should contain body in this format { data : 10 January, time : 10 AM} */
router.get('/slotInfo', async (req,res)=>{
    let token = req.headers['authorization'].split(' ')[1];
    if(!token){
        res.json({
            status : 'failed',
            message : 'unauthorized'
        })
    }else{
        let {phone} = verify(token,process.env.JWT_SECRET_KEY);
        let userExist = await userDetails.findOne({phone : phone});
        if(!userExist){
            res.json({
                status : 'failed',
                message : 'user not exist'
            })
        }else{
            if(userExist.userType !== 'admin'){
                res.json({
                    status : 'failed',
                    message : 'you are not allowed to access this page'
                })
            }else{
                slot.find({...req.body},(err,doc)=>{
                    if(err){
                        res.json({
                            status : 'failed',
                            message : err
                        })
                    }else{
                        res.json({
                            status : 'success',
                            totalUserInThisCategory : doc.length,
                            data : doc
                        })
                    }
                })
            }
        }
    }
})
module.exports = router;