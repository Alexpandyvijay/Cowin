'/register' - used to register user

'/login' -  used to login, this api will generate jwt bearer token for authorization

'/slotAvailable' -  will return the slot available at that particular date in this formate ['10 AM','10:30 AM','11 AM']

'/registerSlot' - will register slot for the selected date an time and this will create a document in slot collection

'/updateSlot' -  will update the registered slot , till 24 hour prior to the already registered slot

'/userInfo' -  will filter and return document according to the request we need to send request with body contain information in this formate { age : 25} or {pincode : 6-----0} or what every required and this only accessed by admin

'/slotInfo' - return data regarding the slot registered. request should contain body in this format { data : 10 January, time : 10 AM}

