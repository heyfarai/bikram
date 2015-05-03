var config = require('./config.js');
var moment = require('moment');
var MB = require('./lib/mindBody.js');
var Promise = require('bluebird');
var Parse = require('parse').Parse;
var _ = require('underscore');
var toNumber = require('underscore.string').toNumber;

Parse.initialize(config.Parse.appId, config.Parse.jsKey)
var YogaClass = Parse.Object.extend("ClassObject");


var params = {
	"StartDateTime" : moment().subtract(2, 'days').format('YYYY-MM-DD'),
	"EndDateTime" : moment().add(1, 'days').format('YYYY-MM-DD')
};

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
			console.log("Gonna try save", itemsToSave.newObjCount, "new classes and", itemsToSave.updateObjCount, "updated classes")
			Parse.Object.saveAll(itemsToSave.objectsToSave,  
				{
			        success: function(objs) {
			            // objects have been saved...
						console.log("Saved ", objs.length, "Yoga Classes to Parse")
						return 1
			        },
			        error: function(error) { 
			            // an error occurred...
						console.log("error saving all", error)
						return 0
			        }
			    });
			})
	})
})

