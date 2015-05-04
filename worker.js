var config = require('./config.js');
var moment = require('moment');
var MB = require('./mindbody.js');
var Promise = require('bluebird');
var Parse = require('parse').Parse;
var _ = require('underscore');
var toNumber = require('underscore.string').toNumber;
var Mandrill = require('mandrill-api/mandrill');

// CONFIGURE EMAILS
var m = new Mandrill.Mandrill('KOI-UXu9dE9qgjSabCcf5w');

// INTIALISE PARSE
Parse.initialize(config.Parse.appId, config.Parse.jsKey)
var YogaClass = Parse.Object.extend("ClassObject");

// SET QUERY PARAMETERS
var params = {
	"StartDateTime" : moment().subtract(2, 'days').format('YYYY-MM-DD'),
	"EndDateTime" : moment().add(1, 'days').format('YYYY-MM-DD')
};


// var params = {
// 	"StartDateTime" : moment().startOf('month').format('YYYY-MM-DD'),
// 	"EndDateTime" : moment().endOf('month').format('YYYY-MM-DD')
// };

var yogaClassProperties = [
	"classId",
	"name",
	"startTime",
	"endTime",
	"teacherName",
	"teacherID",
	"isCancelled"
	];

var newClassIds = []

var getClassDataById = function (allClassDataObjects, id) {
	return _.find(allClassDataObjects, function (obj) {
		return obj.classId == id
	})
}

var sendResultEmail = function (res) {

	var message = {
	    "text": res.msg + "\nPeace",
	    "subject": "Schedule Sync : " + res.result,
	    "from_email": "farai@me.com",
	    "from_name": "Bikram SyncBot",
	    "to": [{
	            "email": "farai+bot@me.com",
	            "name": "Farai"
	        }],
	    "headers": {
	        "Reply-To": "farai@me.com"
	    },
	    "important": false,
	};

	m.messages.send({"message": message}, function(result) {
	    console.log("SYNC RESULT EMAIL", result);
	   
	}, function(e) {
	    // Mandrill returns the error as an object with name and message keys
	    console.log("SYNC RESULT EMAIL", 'A mandrill error occurred: ' + e.name + ' - ' + e.message);
	    // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
	});
	return 1
}
console.log("Bikram SyncBot activated.")
MB.getSoapClient()
.then(function(client){ 
	MB.getClassesWithClient(client, params)
	.then(function(classData){
		retrievedClassData = MB.stripClasses(classData);
		return(retrievedClassData)
	})
	.then(function(newClassData){
		var objectsToSave = []
		var newClassIdsAsString = _.pluck(retrievedClassData, 'classId')
		var newClassIds = (_.map(newClassIdsAsString, function(input){ return toNumber(input) }))
		
		// New Parse Query for YogaClass
		var query = new Parse.Query(YogaClass)
		// Find classes to update
		query.containedIn("classId", newClassIds);
		// Execute query
		query.find()
		.then(function(existingClasses){
			// Extract the classids
			var existingClassIds = _.invoke(existingClasses, 'get', 'classId')
			//console.log("Existing Ids", existingClassIds)
			var updateObjCount = 0;
			var newObjCount = 0;
			_.each(newClassIds, function(newClassId){
				// find the new class data for the object
				var newClassDataCache = getClassDataById(retrievedClassData, newClassId)
				// check if this object is in objects to update
				if(_.contains(existingClassIds,newClassId)) {
					// find the existing object
					var objToUpdate = _.find(existingClasses, function (existingClass) {
										return existingClass.get('classId') == newClassId
									})

					_.each(yogaClassProperties, function (prop) {
						objToUpdate.set(prop, newClassDataCache[prop])
					})
					// update it
					objectsToSave.push(objToUpdate)
					updateObjCount+=1
				}
				else {
					// create a new one
					var newYogaClass = new YogaClass();
					_.each(yogaClassProperties, function (prop) {
						newYogaClass.set(prop, newClassDataCache[prop])
					})
					objectsToSave.push(newYogaClass)
					newObjCount+=1
				}
			})
			return { 'objectsToSave' : objectsToSave,
						'updateObjCount' : updateObjCount,
						'newObjCount' : newObjCount
					}
		})
		.then(function(itemsToSave){
			var msg = "Gonna try save " 
						+ itemsToSave.newObjCount
						+ " new classes and "
						+ itemsToSave.updateObjCount
						+ " updated classes";
			console.log(msg)
			Parse.Object.saveAll(itemsToSave.objectsToSave,  
			{
		        success: function(objs) {
		            // objects have been saved...
		            var success_msg = msg + " \nSaved " + objs.length + " Yoga Classes to Parse."
					console.log(success_msg);
					sendResultEmail(
						{
							"result" 	: "success",
							"msg" 		: success_msg
						})
					return 1
		        },
		        error: function(error) { 
		            // an error occurred...
		            var error_msg = msg + " \nError saving " + objs.length + "\n" + error
					console.log(error_msg);
					sendResultEmail(
						{
							"result" 	: "error",
							"msg" 		: error_msg
						})
					return 0
		        }
		    });
		})
	})
})

