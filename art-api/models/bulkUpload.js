var mongoose = require('mongoose');
var bulkUploadSchema = new mongoose.Schema({
	fileName: { type : String },
	fileStatus: { type : String },
	fileType: { type : String },
	processed: { type : Number , default : 0},
	errorMessage: { type : String },
	createDate : {
		type : Date,
		default : Date.now
	},
	createdUser : { type : String }
});

// start and end for initiating and completion of record insertion timestamps are tracked in the schema
// start
// end

// uploadStatus - progress bar while uploading file, File uploaded , file processing, file processed
// Capture createdDate, createdUser, maintDate, maintUser fields for each schema

module.exports = mongoose.model('BulkUpload', bulkUploadSchema);