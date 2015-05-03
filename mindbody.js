var soap = require('soap');
var config = require('./config.js');
var _ = require('underscore');
var moment = require('moment');
var Promise = require('bluebird');
var toNumber = require('underscore.string').toNumber;
var toBoolean = require('underscore.string').toBoolean;


exports.stripClasses = function(data){
	var output = []
    _.each(data.GetClassesResult.Classes.Class, function(class_cache){
    	var C = {
    		"classId" : toNumber(class_cache.ID),
    		"name" : class_cache.ClassDescription.Name,
    		"startTime" : moment(class_cache.StartDateTime).format(),
    		"endTime" : moment(class_cache.EndDateTime).format(),
    		"teacherName" : class_cache.Staff.Name,
    		"teacherID" : toNumber(class_cache.Staff.ID),
    		"isCancelled" : toBoolean(class_cache.IsCanceled)
    	}
    	output.push(C);
    })
    return output
}

exports.getSoapClient = function (params) {
	var url = "https://api.mindbodyonline.com/0_5/ClassService.asmx?wsdl";
	return new Promise(function(resolve, reject){
        soap.createClient(url, function (err, client) {
            if (err) { reject(err); }
            else {
	            client.setEndpoint('https://api.mindbodyonline.com/0_5/ClassService.asmx');
	            resolve(client);
	        }
		})
	})
}

exports.getClassesWithClient = function (client, aParams) {
	return new Promise(function(resolve, reject){		
    	client.setEndpoint('https://api.mindbodyonline.com/0_5/ClassService.asmx');
        var params = {
            "Request": {
                "SourceCredentials": {
                    "SourceName": config.MB.SourceName,
                    "Password": config.MB.Password,
                    "SiteIDs": {
                        "int": config.MB.SiteIDs
                    }
                },
                "StartDateTime" : aParams.StartDateTime,
                "EndDateTime" : aParams.EndDateTime
            }
        };
        client.Class_x0020_Service.Class_x0020_ServiceSoap.GetClasses(params, function (err, classData) {
            if (err) { reject(err); }
            else {
	            client.setEndpoint('https://api.mindbodyonline.com/0_5/ClassService.asmx');
	            resolve(classData);
	        }
		})
	})
}
