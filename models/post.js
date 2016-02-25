var mongodb = require('./db');
var markdown = require('markdown').markdown;

function Post(name, head, title, tags, post){
	this.name = name;
	this.head = head;
	this.title = title;
	this.tags = tags;
	this.post = post;
};

module.exports = Post;

// save post's info
Post.prototype.save = function(callback){
	var date = new Date();
	// save var-format time
	var time = {
		date:	date,
		year:	date.getFullYear(),
		month:	date.getFullYear() + "-" + (date.getMonth() + 1),
		day:	date.getFullYear() + "-" + (date.getMonth() + 1) + "_" + date.getDate(),
		minute:	date.getFullYear() + "-" + (date.getMonth() + 1) + "_" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes() )
	};
	
	// data need to save
	var post = {
		name: 		this.name,
		head:		this.head,
		title:		this.title,
		tags:		this.tags,
		post:		this.post,
		time:		time,
		comments:	[],
		pv:			0,
		reprint_info:{}
		
		/*
		{
			reprint_from: {name: xxxx, day: xxx, title: xxxx},
			reprint_to: [
				{name: xxxx, day: xxx, title: xxxx},
				{name: xxxx, day: xxx, title: xxxx},
				...
			]
		}
		*/
	};
	
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
			
			// put post info into the data-set
			collection.insert(post, {safe: true}, function (err, user){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null);	// success! set err NULL
			});
		});
		
	});
};

Post.getTen = function(name, page, callback){
	// open db
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		
		// read posts collection
		db.collection('posts', function(err,collection){
			if(err){
				mangodb.close();
				return callback(err);
			}
			
			// find the 'name' key in users collection
			var query = {};
			if (name){
				query.name = name;
			}
			
			// return specify number of docs by count function
			collection.count(query, function(err,total){
				// use query to skip the previous (page-1)*10 results, return the next 10 results
				collection.find(query, {
					skip:	(page-1)*5,
					limit:	5
				}).sort({
					time:	-1
				}).toArray(function(err,docs){
					mongodb.close();
					if(err){
						return callback(err);
					}
					
					// parse markdown to html
					docs.forEach(function(doc){
						doc.post = markdown.toHTML(doc.post);
					});
					callback(null, docs, total);
				});			
			});
		});
	});
};

Post.getArchive = function(callback){
	// open db
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		
		// read posts collection
		db.collection('posts', function(err,collection){
			if(err){
				mangodb.close();
				return callback(err);
			}
			
			collection.find({}, {
				"name":	1,
				"time":	1,
				"title":1
			}).sort({
				time:	-1
			}).toArray(function(err, docs){
					mongodb.close();
					if(err){
						return callback(err);
					}

					callback(null, docs);				
			});
		});
	});
};

Post.getOne = function(name, day, title, callback){
	// open db
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		
		// read posts collection
		db.collection('posts', function(err,collection){
			if(err){
				mangodb.close();
				return callback(err);
			}
			
			collection.findOne({
				"name":	name,
				"time.day":	day,
				"title":	title
			},function(err, doc){
				//mongodb.close();
				if(err){
					mongodb.close();
					return callback(err);
				}
				
				if(doc){
					// increase post pv
					
					collection.update({
						"name":	name,
						"time.day":	day,
						"title":	title
					}, {
						$inc: {pv: 1}
					}, function(err){
						mongodb.close();
						if(err){
							return callback(err);
						}
					});
					
					
					// parse markdown to html
					doc.post = markdown.toHTML(doc.post);
					doc.comments.forEach(function(comment){
						comment.content = markdown.toHTML(comment.content);
					});
					callback(null, doc); // success! set err NULL & return the found user!
				}				
			});
		});
	});
};

Post.edit = function(name, day, title, callback){
	// open db
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		
		// read posts collection
		db.collection('posts', function(err,collection){
			if(err){
				mangodb.close();
				return callback(err);
			}
			
			collection.findOne({
				"name":	name,
				"time.day":	day,
				"title":	title
			},function(err, doc){
				mongodb.close();
				if(err){
					return callback(err);
				}
				
				callback(null, doc); // success! set err NULL & return the found user!				
			});
		});
	});
};

Post.update = function(name, day, title, post, callback){
	// open db
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		
		// read posts collection
		db.collection('posts', function(err,collection){
			if(err){
				mangodb.close();
				return callback(err);
			}
			
			collection.update({
				"name":	name,
				"time.day":	day,
				"title":	title
			}, {
				$set: {post: post}
			}, function(err){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null); // success! set err NULL	
			});
		});
	});
};

Post.remove = function(name, day, title, callback){
	// open db
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		
		// read posts collection
		db.collection('posts', function(err,collection){
			if(err){
				mangodb.close();
				return callback(err);
			}
			
			collection.findOne({
				"name":		name,
				"time.day":	day,
				"title":	title
			}, function(err, doc){
				if(err){
					mongodb.close();
					return callback();
				}
				
				var reprint_from = "";
				if(doc.reprint_info.reprint_from){
					reprint_from = doc.reprint_info.reprint_from;
				}
				if(reprint_from != ""){
					collection.update({
						"name":		reprint_from.name,
						"time.day":	reprint_from.day,
						"title":	reprint_from.title
					}, {
						$pull: {
							"reprint_info.reprint_to": {
								"name":	name,
								"day":	day,
								"title":title
							}
						}
					}, function(err){
						if(err){
							mongodb.close();
							return callback(err);
						}
					});
				}
				collection.remove({
					"name":	name,
					"time.day":	day,
					"title":	title
				}, {
					w: 1
				}, function(err){
					mongodb.close();
					if(err){
						return callback(err);
					}				
					callback(null); // success! set err NULL	
				});				
			});
		});
	});
};

Post.getTags = function(callback){
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			
			collection.distinct("tags", function(err, docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null, docs);
			});
		});
	})
};

Post.getTag = function(tag, callback){
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			
			collection.find({
				"tags":	tag
			}, {
				"name":	1,
				"time":	1,
				"title": 1
			}).sort({
				time:	-1
			}).toArray(function(err, docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null, docs);
			});
		});
	})
};

Post.search = function(keyword, callback){
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		db.collection('posts',function(err,collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			var pattern = new RegExp(keyword, "i");
			collection.find({
				"title":	pattern
			}, {
				"name":		1,
				"time":		1,
				"title":	1
			}).sort({
				time:	-1
			}).toArray(function(err, docs){
				mongodb.close();
				if(err){
					return callback(err);
				}
				callback(null, docs);
			});
		});
	});
}

Post.reprint = function(reprint_from, reprint_to, callback){
	mongodb.open(function(err,db){
		if(err){
			return callback(err);
		}
		
		db.collection('posts', function(err, collection){
			if(err){
				mongodb.close();
				return callback(err);
			}
			collection.findOne({
				"name":		reprint_from.name,
				"time.day":	reprint_from.day,
				"title":	reprint_from.title
			}, function(err, doc){
				if(err){
					mongodb.close();
					return callback(err);
				}
				
				var date = new Date();
				var time = {				
					date:	date,
					year:	date.getFullYear(),
					month:	date.getFullYear() + "-" + (date.getMonth() + 1),
					day:	date.getFullYear() + "-" + (date.getMonth() + 1) + "_" + date.getDate(),
					minute:	date.getFullYear() + "-" + (date.getMonth() + 1) + "_" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes() )					
				};
				
				// delete the old _id
				delete doc._id;
				
				doc.name = reprint_to.name;
				doc.head = reprint_to.head;
				doc.time = time;
				doc.title = (doc.title.search(/[转载]/) > -1 ? doc.title : '[转载]' + doc.title);
				doc.comments = [];
				doc.reprint_info = {"reprint_from": reprint_from};
				doc.pv = 0;
				
				// update the reprint_from page info
				collection.update({
					"name":		reprint_from.name,
					"time.day":	reprint_from.day,
					"title":	reprint_from.title
				}, {
					$push: {
						"reprint_info.reprint_to": {
							"name":		doc.name,
							"day":	time.day,
							"title":	doc.title							
						}
					}
				}, function(err){
					if(err){
						mongodb.close();
						return callback(err);
					}
				});
				
				// insert the reprint post
				collection.insert(doc, {
					safe:true
				}, function(err, post){
					mongodb.close();
					if(err){
						return callback(err);
					}
					callback(null, post[0]);
				});
			});
		});
	});
};