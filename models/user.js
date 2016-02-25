var mongodb = require('./db');
var crypto = require('crypto');

function User(user){
	this.name = user.name;
	this.password = user.password;
	this.email = user.email;
};

module.exports = User;

// save user's info
User.prototype.save = function(callback){
	// data need to save
	var md5 = crypto.createHash('md5'),
		email_md5 = md5.update(this.email.toLowerCase()).digest('hex'),
		head = "https://secure.gravatar.com/avatar/" + email_md5 + "?s=48";
		
	var user = {
		name: 		this.name,
		password:	this.password,
		email:		this.email,
		head:		head
	}
	
	// open db
	mongodb.open(function (err, db){
		if(err){
			return callback(err);		// return err info
		}
		
		// read users data-set
		db.collection('users', function (err, collection){
			if(err){
				mongodb.close();
				return callback(err);	// return err info
			}
			
			// put user info into the data-set
			collection.insert(user, {safe: true}, function (err, user){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null,user[0]);	// success! set err NULL & return saved user info! 
			});
		});
		
	});
};

User.get = function(name, callback){
	// open db
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		
		// read users collection
		db.collection('users', function(err,collection){
			if(err){
				mangodb.close();
				return callback(err);
			}
			
			// find the 'name' key in users collection
			collection.findOne({name: name}, function(err, user){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null, user); // success! set err NULL & return the found user!
			});
		});
	});
};
