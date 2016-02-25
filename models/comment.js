var mongodb = require('./db');

function Comment(name, day, title, comment){
	this.name = name;
	this.day = day;
	this.title = title;
	this.comment = comment;
};

module.exports = Comment;

// save Comment's info
Comment.prototype.save = function(callback){
	// data need to save
	var name = this.name,
		day = this.day,
		title = this.title,
		comment = this.comment;
	
	// open db
	mongodb.open(function (err, db){
		if(err){
			return callback(err);		// return err info
		}
		
		// read posts data-set
		db.collection('posts', function (err, collection){
			if(err){
				mongodb.close();
				return callback(err);	// return err info
			}
			
			// put user info into the data-set
			collection.update({
				"name":		name,
				"time.day":	day,
				"title":	title
			}, {
				$push: {"comments": comment}
			}, function (err){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null);	// success! set err NULL
			});
		});
		
	});
};
