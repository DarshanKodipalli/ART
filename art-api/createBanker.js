/*mvn exec:java -Dexec.mainClass="signature.CreateVisibleSignature" -Dexec.args="../praveen1.p12 password ../sample1.pdf ../sign2.jpg"*/


var config = require('./config/sysProp');
var mongoose = require('mongoose');
mongoose.connect(config.database, { useNewUrlParser: true });
var User = require('./models/user');
var Log = require('./controllers/transactionCtrl');
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
           user: config.smtp.gmail.user,
           pass: config.smtp.gmail.password
       }
   });

var mail = require('./templates/mail');

const BusinessNetworkConnection = require('composer-client').BusinessNetworkConnection;
const AdminConnection = require('composer-admin').AdminConnection;
const IdCard = require('composer-common').IdCard;


const namespace = "io.aeries.art.participant";

async function createBanker(){
    console.log('Only banker is authorized to perform this action');
	var email = 'banker1@aeries.io';
	var username = 'banker1';
	var companyName = 'JPMorgan';
    var companyTicker = 'BANK';
    
    try{
        let user = await User.findOne({ email : email});
        if(user){
            console.log("Already registered");
            return;
        }else{
            user = new User(); 
	
            user.email = email;
            user.username = 'banker1';
            //var randomString = Math.random().toString(36).slice(2);
            user.password = 'password';
            user.role = 'banker';
            user.verifiedUser = false;
            user.emailVerification = false;
            user.firstName = '';
            user.lastName = '';
            user.companyName = companyName;
            user.companyTicker = companyTicker; // check uniqueness of this ticker (ajax check)
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
            console.log("role is "+role);
            try {
                let updateUser = await user.save();
                var type = 'Buyer';
                if(role == 'buyer'){
                    type = 'Buyer';
                }else if(role == 'seller'){
                    type = 'Seller';
                }else if(role == 'aeries'){
                    type = 'Aeries';
                }else if(role == 'banker'){
                    type = 'Banker';
                }else{
                    console.log("not valid role");
                }
                // As Email can be changed later. Fix username as key and check availability 
                // for registration
                await createParticipant(updateUser.email, type, updateUser);
                // Needs to integrate with Email service'
                // email, password,username
                artHtmlTemplate = mail.signup(user.email, 'password', user.username, type);
				const mailOptions = {
				from: config.smtp.gmail.user, // sender address
				to: 'praveen@aeries.io', // list of receivers Add BCC too
				subject: 'Get Started Now with ART', // Subject line
				html: artHtmlTemplate// plain text body
              };
              
			  transporter.sendMail(mailOptions, function (err, info) {
				if(err)
				  console.log(err)
				else
				  console.log(info);
             });
             
                console.log("Signed Up successfully. Please check your mail");

            } catch(err){
                console.log("problem while saving user");
            }
        }
    } catch (err){
        console.log('Error: FindOne -'+err);
        
    }
}
 

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
        resource.setPropertyValue('companyName', updatedUser.companyName);
        resource.setPropertyValue('companyTicker',updatedUser.companyTicker);

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

createBanker();