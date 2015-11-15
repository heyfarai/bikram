var express = require('express');
var _ = require('underscore');
var str = require('underscore.string');
var config = require('../config');
var db = require('./db');
var Parse = require('parse').Parse;
var _ = require('underscore');
var router = express.Router();


// INTIALISE PARSE
// Parse.initialize(config.Parse.appId, config.Parse.jsKey)
// var YogaClass = Parse.Object.extend("YogaClass");

/* GET home page. */
router.get('/', function(req, res) {
	res.render('index.html', { 
								title: 'Bikram Hot Yoga Fourways',
								current_page : 'home' 
							});
});

router.get('/about', function(req, res) {
	res.render('about.html', { 
								title: 'Bikram Yoga Fourways',
								current_page : 'about'
							});
});


router.get('/has/26-poses', function(req, res) {
	all_poses = []
	_.each(db.poses, function(o){
		o.slug = str.slugify(o.name)
		all_poses.push(o)
	})
	res.render('positions.html', { 
									title: '26 Poses and Benefits - Bikram Yoga Fourways' ,
									all_poses : all_poses,
									current_page : 'poses'
								});
});


router.get('/has/26-poses/:pose_id/:name', function(req, res) {
	var next_pose = !1
	var previous_pose = !1

	var pose_id = str.toNumber(req.params.pose_id);
	var pose = _.findWhere(db.poses, {id: pose_id});
	all_poses = []
	_.each(db.poses, function(o){
		all_poses.push({id: o.id, name: o.name, slug: str.slugify(o.name) })
	})

	// GET THE NEXT LINK
	if(pose_id!=26){
		var next_pose_id = pose_id+1
		var next_pose = _.findWhere(all_poses, {id: next_pose_id});
	}

	// GET THE PREVIOUS LINK
	if(pose_id!=1){
		var previous_pose_id = pose_id-1
		var previous_pose = _.findWhere(all_poses, {id: previous_pose_id});
	}
	res.render('position-detail.html', { 
											title: pose.name + ' | Bikram Yoga Fourways',
											pose : pose,
											all_poses : all_poses,
											next_pose : next_pose,
											previous_pose : previous_pose
										});
});

router.get('/classes', function(req, res) {
	// var query = new Parse.Query(YogaClass);
	// query.notEqualTo("teacherID", -1, "teacherID", 1);
	// query.greaterThan("startTime", "2015-11-09");
	// query.limit(1000);
	// query.find({
 //        success: function(objs) {
 //            // objects have been saved...
 //            var success_msg = "\nFound" + objs.length + " Yoga Classes to Parse."
	// 		console.log(objs);
	// 		return 
 //        },
 //        error: function(error) { 
 //            // an error occurred...
 //            var error_msg = "\nError saving " + error.message
	// 		console.log(error_msg);
	// 		return 
 //        }
 //    });
	res.render('classes.html', { 
									title: 'Class Schedule - Bikram Yoga Fourways',
									current_page : 'classes'
								});
});

router.get('/packages-and-prices', function(req, res) {
	res.render('pricing.html', { 
									title: 'Packages & Prices - Bikram Yoga Fourways',
									current_page : 'pricing'
								});
});


router.get('/contact', function(req, res) {
	res.render('contact.html', { 
									title: 'Contact - Bikram Yoga Fourways',
									current_page : 'contact' 
								});
});

// OLD SCHEDULE GOOGLE REDIRECT
router.get('/class-schedule', function(req, res) {
	res.redirect(301, '/classes');
});

// OLD GOOGLE REDIRECT
router.get('/info/yoga-etiquette', function(req, res) {
	res.redirect(301, '/has/26-poses');
});

// OLD GOOGLE REDIRECT
router.get('/info/yoga-etiquette', function(req, res) {
	res.redirect(301, '/has/26-poses');
});

// OLD GOOGLE REDIRECT
router.get('/info/new-students', function(req, res) {
	res.redirect(301, '/');
});

// OLD GOOGLE REDIRECT
router.get('/the-studio/facilities', function(req, res) {
	res.redirect(301, '/');
});

// OLD GOOGLE REDIRECT
router.get('/info/rates', function(req, res) {
	res.redirect(301, '/packages-and-prices');
});

// OLD GOOGLE REDIRECT
router.get('/the-studio/teachers', function(req, res) {
	res.redirect(301, '/');
});


module.exports = router;