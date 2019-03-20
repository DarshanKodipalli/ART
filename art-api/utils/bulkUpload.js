var crypto = require('crypto');

exports.getHash = function(text){
	if(!text){
		return " ";
	}
	var s3 = crypto.createHash('sha1');
	return s3.update(text.toString()).digest("hex").toString();
};

exports.decrypt = function(text,password){
    if(!text||!password){
        return "";
    }
    var decipher = crypto.createDecipher("aes-256-ctr",password.toString());
    var dec = decipher.update(text.toString(),'hex','utf8');
    dec += decipher.final('utf8');
    return dec;
};

exports.isValidFileType = function(data){
    var types = ["order","invoice"];
    var isValid = false;
    if(types.indexOf(data) > -1){
        isValid = true;
    }
    return isValid;
}