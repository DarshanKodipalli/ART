var User = require('../models/user');
var UserTag = require('../models/userTag');
var Kyc = require('../models/kyc');
var Log = require('../controllers/transactionCtrl');
var config = require('../config/sysProp');

var nodemailer = require('nodemailer');
var mail = require('../templates/mail');

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: config.smtp.gmail.user,
        pass: config.smtp.gmail.password
       }
   });

const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const AdminConnection = require('composer-admin').AdminConnection;
const IdCard = require('composer-common').IdCard;


const namespace = "io.aeries.art.participant";


// POST /signup
exports.signup = async function(req, res){
    console.log('Entered into Signup Module');
    if(req.session.user.role !== 'banker'){
        return res.json({"error":"not authorized"});
    }
    console.log('Only banker is authorized to perform this action');
    try{
        console.log(req.body)
        let user = await User.findOne({ email : req.body.email});
        if(user){
            return res.json({'message':'Already registered. Please login'});
        }else{
            user = new User(); 
	
            user.email = req.body.email;
            user.username = req.body.username;
            var randomString = Math.random().toString(36).slice(2);
            user.password = randomString;
            user.role = req.body.role+'' || 'buyer';
            user.verifiedUser = false;
            user.emailVerification = false;
            user.firstName = '';
            user.lastName = '';
            user.companyName = req.body.companyName || '';
            user.companyTicker = req.body.companyTicker || ''; // check uniqueness of this ticker (ajax check)
            user.position = '';
            user.cinNumber = '';
            user.companyType = '';
            user.addressLine1 = '';
            user.addressLine2 = '';
            user.addressLine3 = '';
            user.maxlimit = 0;

            // convert into hash and make a blockchain call which registers the hash
            
            // register, create participant with admin card and issue participant card

            // UserTypes Aeries and Banker shouldnt be exposed ..
            var role = user.role;

            
            if(role == 'banker'){
                user.verifiedUser = true;
            }

            role = role.toLowerCase();
            user.role = role;
            console.log("role is "+role);
            try {
                let updateUser = await user.save();
                var type = 'Buyer';
                if(role == 'buyer'){
                    type = 'Buyer';
                }else if(role == 'seller'){
                    type = 'Seller';
                }else if(role == 'buyerchecker' && config.makerCheckerEnabled){
                    type = 'BuyerChecker';
                }else if(role == 'sellerchecker' && config.makerCheckerEnabled){
                    type = 'SellerChecker';
                }else if(role == 'auditor'){
                    type = 'Auditor';
                }else{
                    return res.json({"error":"not valid role"});
                }
                // As Email can be changed later. Fix username as key and check availability 
                // for registration
                await createParticipant(updateUser.email, type, updateUser);
                // Needs to integrate with Email service
                artHtmlTemplate = mail.signup(user.email, randomString, user.username, role.slice(0,1).toUpperCase()+role.slice(1));
                console.log(artHtmlTemplate)
                const mailOptions = {
                    from: config.smtp.gmail.user, // sender address
                    to: 'darshan@aeries.io', // list of receivers Add BCC too
                    subject: 'Get Started Now with ART', // Subject line
                    html: artHtmlTemplate// plain text body
                  };
                  transporter.sendMail(mailOptions, function (err, info) {
                    if(err)
                      console.log(err)
                    else
                      console.log(info);
                 });
                
                return res.json({status: 'Success', message: 'Signed Up successfully. Please check your mail'});

            } catch(err){
                return res.json({'message':'problem while saving user'+err});
            }
        }
    } catch (err){
        console.log('Error: FindOne -'+err);
        return res.json({'message':'Please contact Admin'});
    }

};

// POST /login
exports.login = function(req, res){
    
    // validate the inputs (express-validator)
    // Make use of user in session object

    var email = req.body.email || '';
    var password = req.body.password || '';
	User.findOne({ email: email }, function(err, user) {
        if (err) throw err;

        if(user){
            // EMail verification check
            //if(!user.verifiedUser){
            //    res.json({status: false, 'message':'User is not verified yet.'});
            //}
            // test a matching password
            user.comparePassword(password, function(err, isMatch) {
                //console.log("user before "+user);
                if (err) throw err;
                if(isMatch){
                    // created a new object with only required fields 
                    user = user.toObject();
                    delete user.password;
                    delete user._id;
                    delete user.__v;
                    delete user.firstName;
                    delete user.lastName;
                    delete user.companyName;
                    delete user.companyTicker;
                    delete user.position;
                    delete user.cinNumber;
                    delete user.companyType;
                    delete user.addressLine1;
                    delete user.addressLine2;
                    delete user.addressLine3;
                    delete user.maxlimit;

                    //console.log("user after "+user);
                    req.session.user = user;
                    return res.json({status: 'Success','message':'Login successful', data: user});
                }else{
                    return res.json({status: 'Failure','message':'Login failed'});
                }
            });
        }else{
            return res.json({'message':'Something went wrong. Please contact Administrator'});
        }
        
    });
};

// PUT /users/me
exports.updateUser = async function(req, res){
    console.log('Entered into updateuser Module');
    
    try{
        let updatedUser = await User.findOne({ email : req.session.user.email});
        if(updatedUser){
            updatedUser.firstName = req.body.firstName || '';
            updatedUser.lastName = req.body.lastName || '';
            updatedUser.companyName = req.body.companyName || '';
            updatedUser.companyTicker = req.body.companyTicker || '';
            updatedUser.position = req.body.position || '';
            updatedUser.cinNumber = req.body.cinNumber || '';
            updatedUser.companyType = req.body.companyType || '';
            updatedUser.addressLine1 = req.body.addressLine1 || '';
            updatedUser.addressLine2 = req.body.addressLine2 || '';
            updatedUser.addressLine3 = req.body.addressLine3 || '';

            var transactionType = '';
            var buyer=''
                ,seller = '', banker = 'banker1@aeries.io', buyerchecker = '', sellerchecker = '';
            if(updatedUser.role == 'buyer'){
                buyer = req.session.user.email;
                buyerchecker = req.body.checker || '';
                transactionType =  'UpsertBuyer';
            }else if(updatedUser.role == 'seller'){
                seller = req.session.user.email;
                sellerchecker = req.body.checker || '';
                transactionType = 'UpsertSeller';
            }
            /*else if(updatedUser.role == 'buyerchecker'){
                buyerchecker = req.session.user.email;
                transactionType =  'UpsertBuyerChecker';
            }else if(updatedUser.role == 'sellerchecker'){
                sellerchecker = req.session.user.email;
                transactionType = 'UpsertSellerChecker';
            }*/

            updatedUser.buyer = buyer;
            updatedUser.seller = seller;
            updatedUser.banker = banker;
            updatedUser.buyerchecker = buyerchecker;
            updatedUser.sellerchecker = sellerchecker;

            updatedUser = await updatedUser.save();
            console.log(updatedUser);

            let result = await bcUpdateUser(req.session.user.email, updatedUser, transactionType);
            let transactionId = JSON.parse(result).transactionId;
            

            await Log.transactionlog(updatedUser.email, 'Participant', transactionType, 'User Updated', req.session.user.email,
             req.session.user.role, buyer, seller, banker, transactionId);
            return res.json({status: 'Success', message: 'Updated user', 'transactionHash': transactionId});
        }
    } catch (err){
        console.log('Error: FindOne -'+err);
        return res.json({'message':'Please contact Admin'});
    }

};

// POST /users/me/password
exports.updatePassword = async function(req, res){
    console.log('Entered into updatePassword Module');
    
    var oldPassword = req.body.oldPassword || '';
    var newPassword = req.body.newPassword || '';
    var newMatchPassword = req.body.newMatchPassword || '';

    if(!oldPassword || !newPassword || !newMatchPassword){
        return res.json({"error":"please fill all the required fields"});
    }
    let updatedUser;
    let wrongOldPassword = true;
    try{
        updatedUser = await User.findOne({ email : req.session.user.email});
    }catch(err){
        return res.json({"error":err});
    }

    updatedUser.comparePassword(oldPassword, function(err, isMatch){
        console.log("isMatch"+isMatch);
        if(isMatch){
            wrongOldPassword = false;
        }
    
        if( wrongOldPassword || (newPassword !== newMatchPassword)){
            return res.json({"error":"Please enter correct details"});
        }
        try{
            if(updatedUser){
                updatedUser.password = newPassword;
    
                updatedUser.save(function(user){
                //console.log(updatedUser);
                // update maintuserid and maintdate
                return res.json({status: 'Success', message: 'Updated password.'});
                });
                
            }
        } catch (err){
            console.log('Error: FindOne -'+err);
            return res.json({'message':'Please contact Admin'});
        }
    });
    

};

// POST /users/me/kyc

// Only for seller
exports.upsertKyc = async function(req, res){
    // request validations
    // only seller can update kyc
    let seller,buyer;
    let input;
    let role = req.session.user.role;
    if(role == 'buyer'){
        buyer = req.session.user.email || '';
        input = {buyer: buyer};
    }else if(role == ''){
        seller = req.session.user.email || '';
        input = {seller: seller};
    }else{
        res.json({"message":"Please contact Admin!"})
    }
 
    let banker = 'banker1@aeries.io';
    let update = false;
    try{
        
        let kyc = await Kyc.findOne(input);
        if(kyc){
            update = true;
        }else{
            kyc = new Kyc();
        }
        kyc.aadhaarCardNumber = req.body.aadhaarCardNumber;
        kyc.panCardNumber = req.body.panCardNumber;
        kyc.cinNumber = req.body.cinNumber;
        kyc.document1Hash = '';
        kyc.document2Hash = '';
        kyc.banker = banker;
        if(role == 'seller'){
            kyc.seller = seller;
        }else{
            kyc.buyer = buyer;
        }
        
        let updatedKyc = await kyc.save();
        console.log('Updated kyc is '+updatedKyc);
        if(updatedKyc){
            let result = await bcUpsertKyc(req.session.user.email, updatedKyc, role);
            let transactionId = JSON.parse(result).transactionId;
            console.log("hash is "+transactionId);
            let updateMessage = 'Kyc Updated';
            if(!update){
                let id = updatedKyc._id;
                let kycData = await bcGetKycNumberById(req.session.user.email, id);
                console.log(kycData[0].kycID);
                updatedKyc.kycID = kycData[0].kycID;
                await kyc.save();
                updateMessage = 'Kyc Created';
            }
            
            await Log.transactionlog(updatedKyc.kycID, 'Kyc', 'UpsertKyc', updateMessage, req.session.user.email, req.session.user.role,
			'', updatedKyc.seller,	updatedKyc.banker, transactionId);
			return res.json({status: 'success', message: updateMessage, 'transactionHash': transactionId});
        }
    }catch(err){
        console.log(err);
        return res.send(err);
    }
};

// POST /users/approve/:id (Approved by banker)
exports.approveUser = async function(req, res){

    if(req.session.user.role !== 'banker'){
        res.json({success: false, message: 'Not Authorized . Please contact admin'});
    }

    let email = req.params.id; // buyer1@aeries.io
    let banker=req.session.user.email;
    let limit = req.body.limit || 0;
    
    let buyer='',seller='';
	// validation for inputs
    console.log("Approve user "+email);
    var role;
	try{
		// Make an update call
		let user = await User.findOne({email: email});
		if(user){
            role = user.role;
            user.verifiedUser = true;
            user.banker=banker;
            user.maxlimit = limit;
            if(config.makerCheckerEnabled) {
                // validate checker 
                checkerData = req.body.checker || '';
                let checker = await User.findOne({email: checkerData});
                console.log(role);
                console.log(checker);
                if(checker && role == 'seller'){
                    //if(checker.role == 'buyerchecker' && role == 'buyer'){
                    //    user.buyerchecker = checker.email;
                    //}else
                    if(checker.role == 'sellerchecker'){
                        user.sellerchecker = checker.email;
                    }else {
                        return res.json({success: false, message: 'Please send valid checker data - sellerchecker'});
                    }
                }else if(role != "buyer"){
                    return res.json({success: false, message: 'Please send valid checker data'});
                }
            }
			let updatedUser = await user.save();
			if(updatedUser){
                var transactionType ;
                if(role == 'buyer'){
                    transactionType = 'ApproveBuyer';
                    buyer = req.session.user.email;
                }else if(role == 'seller'){
                    transactionType = 'ApproveSeller';
                    seller = req.session.user.email;
                }
				let result = await bcApproveUser(req.session.user.email, updatedUser, transactionType);
				// if result returns orderNumber/transactionHash update the database
				// Handle the response and act on the mongoDB record based on the response.
                var transactionId = JSON.parse(result).transactionId;
                
				await Log.transactionlog(updatedUser.email, 'User', transactionType, 'User Approved', req.session.user.email, req.session.user.role,
				buyer, seller, updatedUser.banker, transactionId);
				return res.json({message: 'User Approved', 'transactionHash': transactionId});
			}
		}else{
			console.log("User not found");
		}
	}catch(err){
		return res.send(err);
	}
};

// POST /users/approves (Approved by banker)
exports.approveBulkUser = async function(req, res){

    if(req.session.user.role !== 'banker'){
        res.json({success: false, message: 'Not Authorized . Please contact admin'});
    }

    let email = req.params.id;
    let buyer='',seller='',banker=req.session.user.email;
	// validation for inputs
    console.log("Approve user "+userID);
    var role;
	try{
		// Make an update call
		let user = await User.findOne({email: email});
		if(user){
            role = user.role;
            user.verifiedUser = true;
            user.buyer=email;
            user.seller=seller;
            user.banker=banker;
			let updatedUser = await user.save();
			if(updatedUser){
                var transactionType ;
                if(role == 'buyer'){
                    transactionType = 'ApproveBuyer';
                }else if(role == 'seller'){
                    transactionType = 'ApproveSeller';
                }
				let result = await bcApproveUser(req.session.user.email, updatedUser, transactionType);
				// if result returns orderNumber/transactionHash update the database
				// Handle the response and act on the mongoDB record based on the response.
                var transactionId = JSON.parse(result).transactionId;
                
				await Log.transactionlog(updatedUser.email, 'User', transactionType, 'User Approved', req.session.user.email, req.session.user.role,
				updatedUser.buyer, updatedUser.seller,updatedUser.banker, transactionHash);
				return res.json({message: 'User Approved', 'transactionHash': transactionId});
			}
		}else{
			console.log("Order not found");
		}
	}catch(err){
		return res.send(err);
	}
};

// POST /users/:id/propose (Approved by banker)
exports.proposeUser = async function(req, res){

    if(req.session.user.role !== 'banker'){
        res.json({success: false, message: 'Not Authorized . Please contact admin'});
    }

    let email = req.params.id;
    let buyer='',seller='',banker=req.session.user.email;
	// validation for inputs
    console.log("Approve user "+userID);
    var role;
	try{
		// Make an update call
		let user = await User.findOne({email: email});
		if(user){
            role = user.role;
            user.verifiedUser = true;
            user.buyer=email;
            user.seller=seller;
            user.banker=banker;
			let updatedUser = await user.save();
			if(updatedUser){
                var transactionType ;
                if(role == 'buyer'){
                    transactionType = 'ApproveBuyer';
                }else if(role == 'seller'){
                    transactionType = 'ApproveSeller';
                }
				let result = await bcApproveUser(req.session.user.email, updatedUser, transactionType);
				// if result returns orderNumber/transactionHash update the database
				// Handle the response and act on the mongoDB record based on the response.
                var transactionId = JSON.parse(result).transactionId;
                
				await Log.transactionlog(updatedUser.email, 'User', transactionType, 'User Approved', req.session.user.email, req.session.user.role,
				updatedUser.buyer, updatedUser.seller,updatedUser.banker, transactionHash);
				res.json({message: 'User Approved', 'transactionHash': transactionId});
			}
		}else{
			console.log("Order not found");
		}
	}catch(err){
		res.send(err);
	}
};

// POST /users/proposes (Approved by banker)
exports.proposeBulkUser = async function(req, res){

    if(req.session.user.role !== 'banker'){
        return res.json({success: false, message: 'Not Authorized . Please contact admin'});
    }

    let email = req.params.id;
    let buyer='',seller='',banker=req.session.user.email;
	// validation for inputs
    console.log("Approve user "+userID);
    var role;
	try{
		// Make an update call
		let user = await User.findOne({email: email});
		if(user){
            role = user.role;
            user.verifiedUser = true;
            user.buyer=email;
            user.seller=seller;
            user.banker=banker;
			let updatedUser = await user.save();
			if(updatedUser){
                var transactionType ;
                if(role == 'buyer'){
                    transactionType = 'ApproveBuyer';
                }else if(role == 'seller'){
                    transactionType = 'ApproveSeller';
                }
				let result = await bcApproveUser(req.session.user.email, updatedUser, transactionType);
				// if result returns orderNumber/transactionHash update the database
				// Handle the response and act on the mongoDB record based on the response.
                var transactionId = JSON.parse(result).transactionId;
                
				await Log.transactionlog(updatedUser.email, 'User', transactionType, 'User Approved', req.session.user.email, req.session.user.role,
				updatedUser.buyer, updatedUser.seller,updatedUser.banker, transactionHash);
				return res.json({message: 'User Approved', 'transactionHash': transactionId});
			}
		}else{
			console.log("Order not found");
		}
	}catch(err){
		return res.send(err);
	}
};

// GET /users/me
exports.getUser = async function(req, res){
    var user = await getUser(req.session.user.email, req.session.user.role);
	return res.json({'message':'User Data', 'user': user});
};

// users
exports.getUsers = async function(req, res){
    // get only required fields, Hide passwords in the results
    var role = req.session.user.role;
    var verifiedFlag = req.body.verified;
    var query = {};
    if(verifiedFlag){
        query.verifiedUser = verifiedFlag;
    }
    if(role !== 'banker'){
        return res.json({"error":"Please contact Admin"});
    }
    var users = await User.find(query, { password: 0 });
    res.json({"success":"true", "data": users});
}

// users/me/tags
exports.getTags = async function(req, res){
    // get only required fields, Hide passwords in the results
    var role = req.session.user.role;
    var email = req.session.user.email;
    var isBuyer = false;
    if(role == 'banker'){
        return res.json({"error":"Please contact Admin"});
    }
    let user = await User.findOne({email: email});
	if(user){
        if(user.role == 'buyer'){
            isBuyer = true;
        }
    }else{
        return res.json({"error":"User not found.Please contact Admin"});
    }
    var data = {};
    var query = {};

    data.active = 0;
    data.enddate = 0;
    data._id = 0;

    query.active = true;

    if(isBuyer){
        data.buyer = 0;
        query.buyer = email;
    } else {
        data.seller = 0;
        query.seller = email; 
    }
    var tags = await UserTag.find({}, data);
    res.json({"success":"true", "data": tags});
}


// users/untag
exports.getUntagUserList = async function(req, res) {
    // get only required fields, Hide passwords in the results
    var role = req.session.user.role;
    var email = req.body.email || '';
    var isBuyer = false;
    if(role !== 'banker'){
        return res.json({"error":"Please contact Admin"});
    }
    let user = await User.findOne({email: email});
	if(user) {
        if(user.role == 'buyer') {
            isBuyer = true;
        }
    }else {
        return res.json({"error":"User not found.Please contact Admin"});
    }
    var data = {};
    var query = {};

    data._id = 0;
    data.active = 0;
    query.active = true;
    if(isBuyer) {
        data.buyer = 0;
        query.buyer = email;
    } else {
        data.seller = 0;
        query.seller = email;
    }
    var tags = await UserTag.find(query, data);
    var userList= [];
    if(isBuyer){
        userList = await User.find({email: {$nin: tags}, role: 'seller'},{email:1});
    } else {
        userList = await User.find({email: {$nin: tags}, role: 'buyer'},{email:1});
    }
    res.json({"success":"true", "data": userList});
}

// users/tags GET
exports.getUserTags = async function(req, res){
    // get only required fields, Hide passwords in the results
    var role = req.session.user.role;
    var email = req.body.email;
    var isBuyer = false;
    if(role !== 'banker'){
        return res.json({"error":"Please contact Admin"});
    }
    let user = await User.findOne({email: email});
	if(user){
        if(user.role == 'buyer'){
            isBuyer = true;
        }
    }else {
        return res.json({"error":"User not found.Please contact Admin"});
    }
    var data = {};
    var query = {};

    data._id = 1;
    query.active = true;

    if(isBuyer){
        data.seller = 1;
        query.buyer = email;
    } else {
        data.buyer = 1;
        query.seller = email; 
    }
    var tags = await UserTag.find(query, data);
    res.json({"success":"true", "data": tags});
}

// users/tagfilter GET
exports.getFilteredUsers = async function(req, res){
    // get only required fields, Hide passwords in the results
    var role = req.session.user.role;
    var email = req.body.email;
    var isBuyer = false;
    if(role !== 'banker'){
        return res.json({"error":"Please contact Admin"});
    }
    let user = await User.findOne({email: email});
	if(user){
        if(user.role == 'buyer'){
            isBuyer = true;
        }
    }else {
        return res.json({"error":"User not found.Please contact Admin"});
    }
    var data = {};
    var query = {};

    data._id = 1;
    query.active = true;

    if(isBuyer){
        data.seller = 1;
        query.buyer = email;
    } else {
        data.buyer = 1;
        query.seller = email; 
    }
    var tags = await UserTag.find(query, data);
    var tagData = [];
    for(var i=0;i < tags.length;i++){
        if(isBuyer){
            tagData.push(tags[i].seller);
        }else{
            tagData.push(tags[i].buyer);
        }
    }

    var users = await User.find({},{email:{"$nin": tags}});
    res.json({"success":"true", "data": tags});
}

// /users/tags POST
exports.updateUserTags = async function(req, res){
    // get only required fields, Hide passwords in the results
    var role = req.session.user.role;
    var email = req.body.email;
    // validate the email tags
    var emailtags = req.body.tags || [];
    // tag {id=0, email=""}
    // loop and Create if any tag is not created previously and delete left over tags from UserTags Collection
    if(role !== 'banker'){
        return res.json({"error":"Please contact Admin"});
    }
    let user = await User.findOne({email: email});
	if(user){
        var data = {};
        var query = {};
        data._id = 0;
        query.active = true;
        if(user.role == 'buyer'){
            data.seller = 1;
            query.buyer = user.email;
        }else if(user.role == 'seller'){
            data.buyer = 1;
            query.seller = user.email;
        }
        
        var oldTagsData = await UserTag.find(query, data);
        console.log("oldTagsData"+JSON.stringify(oldTagsData));

        var deleteTags=[]; // emailids of buyer or seller
        var addTags=[]; // jsons of add tags

        var oldTags = [];

        for(var i=0;i<oldTagsData.length;i++){
            var tag = '';
            
            if(user.role == 'buyer'){
                tag = oldTagsData[i].seller;
            }else if(user.role == 'seller'){
                tag = oldTagsData[i].buyer;
            }
            oldTags.push(tag);
            if(emailtags.indexOf(tag) == -1){
                deleteTags.push(tag);
            }
        }

        for(var i=0;i<emailtags.length;i++){
            var emailtag = {};
            if(user.role == 'buyer'){
                emailtag = {buyer:user.email, seller:emailtags[i], enddate:null, active:true};
            }else if(user.role == 'seller'){
                emailtag = {buyer:emailtags[i], seller:user.email, enddate:null, active:true};
            }
            
            if(oldTags.indexOf(emailtags[i]) == -1){
                addTags.push(emailtag);
            }
        }

        // Enddate instead of Delete Tags. deactivate
        console.log("Delete Tags"+JSON.stringify(deleteTags));
        console.log("Add Tags"+JSON.stringify(addTags));
        if(user.role == 'buyer'){
            //await UserTag.deleteMany({ seller: { $in: deleteTags}});
            
            await UserTag.updateMany({seller:{$in:deleteTags}},
                {$set:{active:false,enddate:new Date()}});
        }else if(user.role == 'seller'){
            await UserTag.updateMany({ buyer: { $in: deleteTags}},
                {$set:{active:false,enddate:new Date()}});
        }

        await UserTag.insertMany(addTags);

    }else{
        return res.json({"error":"User not found.Please contact Admin"});
    }
    
    res.json({"success":"true"});
}

// users/:id
exports.getUnverifiedUserByEmail = async function(req, res){
    var email = req.params.id||'';
    var role = req.session.user.role;
    if(role !== 'banker'){
        return res.json({"error":"Please contact Admin"});
    }
    var user = await User.findOne({verifiedUser: false, email: email}, { password: 0 } );
    res.json({"success":"true", "data": user});
}

/*
 * Blockchain Functions
 */

async function createParticipant(username, type, updatedUser) {
    console.log('Creating Participant');
    let businessNetworkConnection = new BusinessNetworkConnection();
    let adminConnection = new AdminConnection();

    try {
        await businessNetworkConnection.connect('admin@test');
        await adminConnection.connect('admin@test');
        let registry = await businessNetworkConnection.getParticipantRegistry(namespace+'.'+type);
        console.log('1. Received Registry: ', registry.id);
        // Utility method for adding the participants
        console.log('Adding participant to registry');
        
        const bnDef = businessNetworkConnection.getBusinessNetwork();
        const  factory = bnDef.getFactory();

        let    resource = factory.newResource(namespace, type,username);
        resource.setPropertyValue('companyName', 'ABC');
        resource.setPropertyValue('companyTicker','ABC');

        await registry.add(resource);
        console.log('Added Buyer Resource Successfully !!');

        console.log('Importing card');
        let result = await businessNetworkConnection.issueIdentity('io.aeries.art.participant.'+type+'#'+username, username)
        console.log(`userID = ${result.userID}`);
        console.log(`userSecret = ${result.userSecret}`);

        // Importing card
        const metadata = {
            userName: result.userID,
            version: 1,
            enrollmentSecret: result.userSecret,
            businessNetwork: 'test'
        }

        const connectionProfile = {"name":"artnetwork","x-type":"hlfv1","version":"1.0.0","client":{"organization":"Org1","connection":{"timeout":{"peer":{"endorser":"300","eventHub":"300","eventReg":"300"},"orderer":"300"}}},"channels":{"artchannel":{"orderers":["orderer.aeries.io"],"peers":{"peer0.org1.aeries.io":{},"peer1.org1.aeries.io":{}}}},"organizations":{"Org1":{"mspid":"Org1MSP","peers":["peer0.org1.aeries.io","peer1.org1.aeries.io"],"certificateAuthorities":["ca.org1.aeries.io"]}},"orderers":{"orderer.aeries.io":{"url":"grpc://localhost:7050"}},"peers":{"peer0.org1.aeries.io":{"url":"grpc://localhost:7051","eventUrl":"grpc://localhost:7052"},"peer1.org1.aeries.io":{"url":"grpc://localhost:7053","eventUrl":"grpc://localhost:7054"}},"certificateAuthorities":{"ca.org1.aeries.io":{"url":"http://localhost:7071","caName":"ca.org1.aeries.io"}}};

        const card = new IdCard(metadata, connectionProfile);
        await adminConnection.importCard(username, card);
        console.log(username+" Card imported");

        await businessNetworkConnection.disconnect();
        await adminConnection.disconnect();
    } catch(error) {
        console.log(error);
    }
}

async function bcUpdateUser(cardName, updatedUser, transactionType) {
	// Do basic validations and test for role in initial endpoint
	let businessNetworkConnection = new BusinessNetworkConnection();

    try {
        await businessNetworkConnection.connect(cardName);
        
        const bnDef = businessNetworkConnection.getBusinessNetwork();
        const  factory = bnDef.getFactory();

        let transaction = factory.newTransaction(namespace, transactionType);

        //transaction.setPropertyValue('id', updatedUser._id+'');
        transaction.setPropertyValue('firstName', updatedUser.firstName);
        transaction.setPropertyValue('lastName', updatedUser.lastName);
        transaction.setPropertyValue('companyName', updatedUser.companyName);
        transaction.setPropertyValue('companyTicker', updatedUser.companyTicker);
        transaction.setPropertyValue('position', updatedUser.position);
        transaction.setPropertyValue('cinNumber', updatedUser.cinNumber);
        transaction.setPropertyValue('companyType', updatedUser.companyType);
        transaction.setPropertyValue('addressLine1', updatedUser.addressLine1);
        transaction.setPropertyValue('addressLine2', updatedUser.addressLine2);
        transaction.setPropertyValue('addressLine3', updatedUser.addressLine3);

        if(transactionType == 'UpsertBuyer'){
            let buyer = factory.newRelationship('io.aeries.art.participant', 'Buyer', updatedUser.buyer);
		    transaction.setPropertyValue('buyer', buyer);
        }else if(transactionType == 'UpsertSeller'){
            let seller = factory.newRelationship('io.aeries.art.participant', 'Seller', updatedUser.seller);
		    transaction.setPropertyValue('seller', seller);
        }

		let banker = factory.newRelationship('io.aeries.art.participant', 'Banker', updatedUser.banker);
		transaction.setPropertyValue('banker', banker);

		await businessNetworkConnection.submitTransaction(transaction);

		console.log("Updated the user : "+cardName);
		
		console.log(transactionType+" Transaction Submitted successfully "+transaction);
		console.log('Json'+JSON.stringify(transaction));
		 
		await businessNetworkConnection.disconnect();
		return JSON.stringify(transaction);
    } catch(error) {
        console.log(error);
    }
}

async function bcGetKycNumberById(cardName, id){
	console.log("Entered into kycbyid");
	let businessNetworkConnection = new BusinessNetworkConnection();
	try{
		await businessNetworkConnection.connect(cardName);
		console.log('Getting '+cardName+' kyc based on MongoDB ID');
		return await businessNetworkConnection.query('selectKycById', {id:id});
	}catch(err){
		console.log(err);
	}
}

// Upsert KYC
async function bcUpsertKyc(cardName, updatedKyc, role) {
	console.log("bcUpserKyc"+updatedKyc);
	let businessNetworkConnection = new BusinessNetworkConnection();
	let transactionType = "UpsertKyc";

    try {
        await businessNetworkConnection.connect(cardName);
        
        const bnDef = businessNetworkConnection.getBusinessNetwork();
        const  factory = bnDef.getFactory();

        let transaction = factory.newTransaction(namespace, transactionType);
        transaction.setPropertyValue('aadhaarCardNumber', updatedKyc.aadhaarCardNumber);
        transaction.setPropertyValue('panCardNumber', updatedKyc.panCardNumber);
        transaction.setPropertyValue('cinNumber', updatedKyc.cinNumber);
        transaction.setPropertyValue('document1Hash', updatedKyc.document1Hash);
        transaction.setPropertyValue('document2Hash', updatedKyc.document2Hash);

		let isUpdate = false;
		if(updatedKyc.kycID){
			isUpdate = true;
			transaction.setPropertyValue('kycID', updatedKyc.kycID);
		}

        if(role == 'seller'){
            let seller = factory.newRelationship('io.aeries.art.participant', 'Seller', updatedKyc.seller);
		    transaction.setPropertyValue('seller', seller);
        }else{
            let buyer = factory.newRelationship('io.aeries.art.participant', 'Buyer', updatedKyc.buyer);
		    transaction.setPropertyValue('buyer', buyer);
        }
	    

		let banker = factory.newRelationship('io.aeries.art.participant', 'Banker', updatedKyc.banker);
		transaction.setPropertyValue('banker', banker);

		transaction.setPropertyValue('id', updatedKyc._id+'');

		await businessNetworkConnection.submitTransaction(transaction);
		if(isUpdate){
			console.log("Updated the KYC : "+updatedKyc.kycID);
		}else{
			console.log("Saved the Kyc"+updatedKyc);
		}
		console.log(transactionType+" Transaction Submitted successfully "+transaction);
		console.log('Json'+JSON.stringify(transaction));
		 
		await businessNetworkConnection.disconnect();
		return JSON.stringify(transaction);
    } catch(error) {
        console.log(error);
    }
}

// POST /users/:id/approve
async function bcApproveUser(cardName, updatedUser, transactionType) {
    console.log("bcApproveUser for "+updatedUser.email);
    
    let businessNetworkConnection = new BusinessNetworkConnection();
    /*let transactionType;
    if(updatedUser.role == 'buyer'){
        transactionType = 'ApproveBuyer';
    }else if(updatedUser.role == 'seller'){
        transactionType = 'ApproveSeller';
    }*/

    try {
        await businessNetworkConnection.connect(cardName);
        
        const bnDef = businessNetworkConnection.getBusinessNetwork();
        const  factory = bnDef.getFactory();

        let transaction = factory.newTransaction(namespace, transactionType);
       // transaction.setPropertyValue('verifiedUser', updatedUser.verifiedUser);
        transaction.setPropertyValue('maxlimit', updatedUser.maxlimit+'');
        
        if(updatedUser.role == 'buyer'){
            let buyer = factory.newRelationship('io.aeries.art.participant', 'Buyer', updatedUser.email);
		    transaction.setPropertyValue('buyer', buyer);
        }else if(updatedUser.role == 'seller'){
            let seller = factory.newRelationship('io.aeries.art.participant', 'Seller', updatedUser.email);
		    transaction.setPropertyValue('seller', seller);
        }
        if(updatedUser.banker){
            let banker = factory.newRelationship('io.aeries.art.participant', 'Banker', updatedUser.banker);
		    transaction.setPropertyValue('banker', banker);
        }
		

		await businessNetworkConnection.submitTransaction(transaction);
        
        console.log("Updated the User : "+updatedUser.email);
		console.log(transactionType+" Transaction Submitted successfully "+transaction);
		console.log('Json'+JSON.stringify(transaction));
		 
		await businessNetworkConnection.disconnect();
		return JSON.stringify(transaction);
    } catch(error) {
        console.log(error);
    }
}

async function getUser(cardName, role){
	let businessNetworkConnection = new BusinessNetworkConnection();
	try{
		await businessNetworkConnection.connect(cardName);
        console.log('Getting '+cardName+' users');
        let query = '';
        if(role == 'buyer'){
            query = 'selectBuyers';
        }else if(role == 'seller'){
            query = 'selectSellers';
        }else if(role == 'banker'){
            query = 'selectBankers';
        }
		return await businessNetworkConnection.query(query);
	}catch(err){
		console.log(error);
	}
}