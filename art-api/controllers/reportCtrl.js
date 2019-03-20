var report = require('../index');
var request = require('request');
var User = require('../models/user');
var Order = require('../models/order');
var Invoice = require('../models/invoice');
var config = require('../config/sysProp');
const jsreport = require('jsreport');

function isValidTemplate(template){
    template = template.toLowerCase();
    if(template == 'order' || template == 'invoice'){
        return true;
    }
    return false;
}

// Disable reports for order based on configuration
exports.getReport = async function(req, res){	


    // permissions for getting only authorized reports

   var template = req.query.template; // order , invoice
    var id = req.query.id; // orderNumber , invoiceNumber
    var templateId;
    if(!template && !isValidTemplate(template)) {
        return res.json({"error":"Please enter valid template"});
    }

    if(template === 'order')
    {
        templateId = config.reportTemplates.order;
    } else if(template === 'invoice')
    {
        templateId = config.reportTemplates.invoice;
    }

    // query mongodb data
    //get order or invoice details by id
    let idData;
    var input = {};
    if(req.session.user.role == 'buyer'){
        input.buyer = req.session.user.email;
    }else if(req.session.user.role == 'seller'){
        input.seller = req.session.user.email;
    }
    if(template == 'order'){
        input.orderNumber = id;
        idData = await Order.findOne(input);
    }else if(template == 'invoice'){
        input.invoiceNumber = id;
        idData = await Invoice.findOne(input);
    }

    if(!idData){
        return res.json({"error":"Please reverify id. Id record not found"});
    }
    //get buyer company details
    //idData.buyer;
    let buyer = await User.findOne({ email: idData.buyer });
    // validate buyer
    //get seller company details
    //idData.seller;
    let seller = await User.findOne({ email: idData.seller });
    // validate seller
    var items = idData.items || [];
    var orderNumber = idData.orderNumber || '';
    if(orderNumber){
        orderData = await Order.findOne({ orderNumber: orderNumber });
        items = orderData.items || [];
    }else{
        return res.json({"error":"order not found"});
    }
    var data= {
        "number": id,
        "orderNumber":orderNumber,
        "buyer": {
            "name": "Next Step Webs, Inc.",
            "road": "12345 Sunny Road",
            "country": "Sunnyville, TX 12345",
            "email":idData.buyer
        },
        "seller": {
            "name": "Acme Corp.",
            "road": "16 Johnson Road",
            "country": "Paris, France 8060",
            "email":idData.seller
        },
        "items": items
    };
/*options:{preview:true}, 
    data:{
        "books":[{
            "name":"",
            author:""
        },{
            "name":"",
            author:""
        }]
    }*/
/*
    var data = {
        "number": "123lkjldfkjsalfkjldaskfjldsjlkdjsalfkjds",
        "seller": {
            "name": "Next Step Webs, Inc.",
            "road": "12345 Sunny Road",
            "country": "Sunnyville, TX 12345",
            "email":"john@nextstep.in"
        },
        "buyer": {
            "name": "Acme Corp.",
            "road": "16 Johnson Road",
            "country": "Paris, France 8060",
            "email":"alice@acmecorp.in"
        },
        "items": [{
            "id":1,
            "description": "Website design",
            "units":1,
            "price": 300
        }]
    };
    var templateId = "Hyuo0un2Q";*/
    var inputData = {
        template : {'shortid': templateId},
        data: data,
        options:{preview:false}
    };

    
    // options:{preview:true}

    var options = {
        uri : 'http://localhost:5488/api/report',
        method : 'POST',
        json : inputData
    }
    request(options).pipe(res);
    //var result = await request(options);
   /* request(options, function (error, response, body) {
        //console.log('error:', error); // Print the error if one occurred
        //console.log('statusCode:', response && response.statusCode); // Print the response status code if a response was received
        //console.log('body:', body); // Print the HTML for the Google homepage.
        //res.json({"a":"b"});

        //var fileBase64String = body.toString('base64');
        console.log("fileBase64String:"+body);
        console.log("fileBase64String:"+JSON.stringify(body));
        //res.set('Content-Disposition', 'attachment; filename="filename.pdf"');
        //res.set('Content-Type', 'application/pdf');
        res.attachment('filename.pdf');
        res.type('application/pdf');

        res.end(body, 'utf8');

      });*/
    //var fileBase64String = ;
    //res.set('Content-Disposition', 'attachment; filename="filename.pdf"');
    //res.set('Content-Type', 'application/pdf');

    //res.end(fileBase64String, 'base64');
 
}