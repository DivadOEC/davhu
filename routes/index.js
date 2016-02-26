var crypto = require('crypto');
var express = require('express');
var passport = require('passport');
var router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});


User = require('../models/user');
Post = require('../models/post');
Comment = require('../models/comment');

module.exports = function(app){
	/*
	app.get('/', function(req, res, next) {
		var page = req.query.p ? parseInt(req.query.p) : 1;
		
		Post.getTen(null, page, function(err, posts, total){
			if(err){
				posts=[];
			}
			
			res.render('index', {
				title: 'Home',
				user:	req.session.user,
				posts:	posts,
				page:	page,
				isFirstPage:(page - 1) == 0,
				isLastPage: ((page - 1) * 5 + posts.length) == total,
				success:req.flash('success').toString(),
				error:	req.flash('error').toString()
			});			
		});

	});
	*/
	
	app.get('/login', checkNotLogin);
	app.get('/login', function(req, res, next) {
		res.render('login', { 
			title: 'Login',
			user:	req.session.user,
			success:req.flash('success').toString(),
			error:	req.flash('error').toString()			
		});
	});
	
	app.get('/login/github', passport.authenticate("github", {session: false}));
	app.get('/login/github/callback', passport.authenticate("github", {
		session:			false,
		failureRedirect: 	'/login',
		successFlash:		'Login Success!'
	}), function(req, res){
		req.session.user = {name: req.user.username, head: "https://secure.gravatar.com/avatar/" + req.user._json.gravatar_id + "?s=48"};
		res.redirect('/');
	});

	app.post('/login', checkNotLogin);
	app.post('/login', function(req, res, next) {
		// gen the md5 password
		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');
		
		// check if exist same username
		User.get(req.body.name, function(err, user){
			if(!user){
				req.flash('error', 'User not Exists!');
				return res.redirect('/login');
			}
			
			if(user.password != password){
				req.flash('error', 'Password Incorrect!');
				return res.redirect('/login');	
			}
			
			req.session.user = user;
			req.flash('success', 'Login Success!');
			return res.redirect('/');
		});			
	});	
	
	app.get('/reg', checkNotLogin);
	app.get('/reg', function(req, res, next) {
		res.render('reg', {
			title: 'Register',
			user:	req.session.user,
			success:req.flash('success').toString(),
			error:	req.flash('error').toString()
		});		
	});

	app.post('/reg', checkNotLogin);
	app.post('/reg', function(req, res, next) {
		var name = req.body.name,
			password = req.body.password,
			//password_re = req.body.password_repeat,
			password_re = req.body['password_repeat'],
			email = req.body.email;
			
		// validator the two password
		if(password_re != password){
			req.flash('error', 'the confirm password is not correct!');
			return res.redirect('/reg');	// return to the reg page
		}
		
		// gen the md5 password
		var md5 = crypto.createHash('md5'),
			password = md5.update(req.body.password).digest('hex');
		var newUser = new User({
			name:		req.body.name,
			password:	password,
			email:		req.body.email
		});
		
		// check if exist same username
		User.get(newUser.name, function(err, user){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			
			if(user){
				req.flash('error', 'UserName Exists!');
				return res.redirect('/reg');	
			}
			
			newUser.save(function(err, user){
				if(err){
					req.flash('error', err);
					return res.redirect('/reg');
				}
				
				req.session.user = user;
				req.flash('success', 'Register Success!');
				return res.redirect('/');
			});
		});		
	});	

	app.get('/logout', checkLogin);	
	app.get('/logout', function(req, res, next) {
		req.session.user = null;
		req.flash('success', 'Logout Success!');
		return res.redirect('/');
	});
	
	app.get('/upload', checkLogin);	
	app.get('/upload', function(req, res, next) {
		res.render('upload', {
			title: 'Upload',
			user:	req.session.user,
			success:req.flash('success').toString(),
			error:	req.flash('error').toString()
		});	
	});
	
	app.post('/upload', checkLogin);	
	app.post('/upload', function(req, res, next) {
		req.flash('success', 'File Upload Success!');
		return res.redirect('/upload');		
	});	
	
	app.get('/post', checkLogin);
	app.get('/post', function(req, res, next) {
		res.render('post', {
			title: 'Post',
			user:	req.session.user,
			success:req.flash('success').toString(),
			error:	req.flash('error').toString()
		});		
	});

	app.post('/post', checkLogin);
	app.post('/post', function(req, res, next) {
		var currentUser = req.session.user,
			tags = [req.body.tag1, req.body.tag2, req.body.tag3]
			post = new Post(currentUser.name, currentUser.head, req.body.title, tags, req.body.post);
			
		post.save(function(err){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			
			req.flash('success', 'Post Success!');
			res.redirect('/');
		});
	});
	
	app.get('/u/:name', function(req, res) {
		var page = req.query.p ? parseInt(req.query.p) : 1;

		// check if user exist
		User.get(req.params.name, function(err,user){
			if(!user){
				req.flash('error', 'User Not Exists!');
				return res.redirect('/');
			}

			Post.getTen(user.name, page, function(err, posts, total){
				if(err){
					req.flash('error', err);
					return res.redirect('/');
				}
				
				res.render('user', {
					title: 'Home',
					user:	user.name + '|Just David.Hu',
					posts:	posts,
					page:	page,
					isFirstPage:(page - 1) == 0,
					isLastPage: ((page - 1) * 5 + posts.length) == total,
					success:req.flash('success').toString(),
					error:	req.flash('error').toString()
				});			
			});	
		});			
	});

	app.get('/u/:name/:day/:title', function(req, res) {
		
		Post.getOne(req.params.name, req.params.day, req.params.title,  function(err,post){
			if(err){
				req.flash('error', err);
				return res.redirect('/');				
			}
			res.render('article', {
				title: 	req.params.title + '|' + req.params.name + '|Just David.Hu',
				post:	post,
				user:	req.session.user,
				success:req.flash('success').toString(),
				error:	req.flash('error').toString()
			});			
		});	
	});
	
	app.post('/u/:name/:day/:title', function(req, res) {
		var date = new Date(),
			time = date.getFullYear() + "-" + (date.getMonth() + 1) + "_" + date.getDate() + " " + date.getHours() + ":" + (date.getMinutes() < 10 ? "0" + date.getMinutes() : date.getMinutes() );
		var md5 = crypto.createHash('md5'),
			email_md5 = md5.update(req.body.email.toLowerCase()).digest('hex'),
			head = "https://secure.gravatar.com/avatar/" + email_md5 + "?s=48";			
		var comment = {
			name:	req.body.name,
			head:	head,
			email:	req.body.email,
			website:req.body.website,
			time:	time,
			content:req.body.content
		};
		var newComment = new Comment(req.params.name, req.params.day, req.params.title, comment);
		newComment.save(function(err){
			if(err){
				req.flash('error', err);
				return res.redirect('back');
			}
			
			req.flash('success', 'u commnet have left successful!');
			return res.redirect('back');			
		});
	});	
	
	app.get('/edit/:name/:day/:title', checkLogin);	
	app.get('/edit/:name/:day/:title', function(req, res) {
		var currentUser = req.session.user;
		
		Post.edit(currentUser.name, req.params.day, req.params.title,  function(err,post){
			if(err){
				req.flash('error', err);
				return res.redirect('back');				
			}

			res.render('edit', {
				title: 	req.params.title + '|' + req.params.name + '|Just David.Hu',
				post:	post,
				user:	req.session.user,
				success:req.flash('success').toString(),
				error:	req.flash('error').toString()
			});			
		});	
	});
	
	app.post('/edit/:name/:day/:title', checkLogin);	
	app.post('/edit/:name/:day/:title', function(req, res) {
		var currentUser = req.session.user;
		
		Post.update(currentUser.name, req.params.day, req.params.title, req.body.post,  function(err){
			var url = encodeURI('/u/' + req.params.name + '/' + req.params.day + '/' + req.params.title);
			if(err){
				req.flash('error', err);
				return res.redirect(url);				
			}

			req.flash('success', 'edit success!');
			return res.redirect(url);		
		});	
	});
	
	app.get('/remove/:name/:day/:title', checkLogin);	
	app.get('/remove/:name/:day/:title', function(req, res) {
		var currentUser = req.session.user;
		
		Post.remove(currentUser.name, req.params.day, req.params.title, function(err){
			if(err){
				req.flash('error', err);
				return res.redirect('back');				
			}

			req.flash('success', 'delete success!');
			return res.redirect('/');				
		});	
	});
	
	app.get('/archive', function(req, res) {
				
		Post.getArchive(function(err, posts){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			
			res.render('archive', {
				title: 'Archive',
				user:	req.session.user,
				posts:	posts,
				success:req.flash('success').toString(),
				error:	req.flash('error').toString()
			});			
		});
	});
	
	app.get('/tags', function(req, res) {
				
		Post.getTags(function(err, posts){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			
			res.render('tags', {
				title: 'Tags',
				user:	req.session.user,
				posts:	posts,
				success:req.flash('success').toString(),
				error:	req.flash('error').toString()
			});			
		});
	});

	app.get('/tags/:tag', function(req, res) {
				
		Post.getTag(req.params.tag, function(err, posts){
			if(err){
				req.flash('error', err);
				return res.redirect('/');
			}
			
			res.render('tag', {
				title: 'TAG:' + req.params.tag,
				user:	req.session.user,
				posts:	posts,
				success:req.flash('success').toString(),
				error:	req.flash('error').toString()
			});			
		});
	});

	app.get('/search', function(req, res) {
				
		Post.search(req.query.keryword,  function(err, posts){
			if(err){
				req.flash('error', err.message);
				return res.redirect('/');
			}
			
			res.render('search', {
				title: 'SEARCH:' + req.query.keryword,
				user:	req.session.user,
				posts:	posts,
				success:req.flash('success').toString(),
				error:	req.flash('error').toString()
			});			
		});
	});

	app.get('/links', function(req, res) {
				
		res.render('links', {
			title: 'Links:',
			user:	req.session.user,
			success:req.flash('success').toString(),
			error:	req.flash('error').toString()
		});
	});	
	
	app.get('/reprint/:name/:day/:title', checkLogin);
	app.get('/reprint/:name/:day/:title', function(req, res) {
		var currentUser = req.session.user,
			reprint_from = {name:req.params.name, day:req.params.day, title:req.params.title},
			reprint_to = {name:currentUser.name, head:currentUser.head};
			
		Post.reprint(reprint_from, reprint_to, function(err, post){
			if(err){
				req.flash('error', err.message);
				return res.redirect('back');
			}
			req.flash('success','Reprint Success!');
			var url = encodeURI('/u/' + post.name + '/' + post.time.day + '/' + post.title);
			res.redirect(url);
		});
	});		
	
	function checkLogin(req, res, next){
		if(!req.session.user){
			req.flash('error', 'User Not Login!');
			res.redirect('/login');
		}
		next();		// 转移控制权
	}

	function checkNotLogin(req, res, next){
		if(req.session.user){
			req.flash('error', 'User Logined!');
			res.redirect('back');
		}
		next();
	}
	
	// Redirect to 404 page, when noting was matched in the router!
	app.use(function(req, res){
		res.render('404');
	});
};


