require('dotenv').config()
const express = require('express')
const app = express()
const mongoose = require('mongoose')
const bodyParser = require('body-parser')
const session = require('express-session')
const passport = require('passport')
const passportLocalMongoose = require('passport-local-mongoose')
app.use(express.static('public'))
var GoogleStrategy = require('passport-google-oauth20').Strategy;
app.set('view engine','ejs')

app.use(bodyParser.urlencoded({extended:true}))

app.use(session({
  secret:'Our Little Secret',
  resave:false,
  saveUninitialized : false
}));

app.use(passport.initialize())
app.use(passport.session())


mongoose.connect('mongodb://0.0.0.0:27017/googleLogInDB' , {
    useUnifiedTopology: true
})

const userSchema = new mongoose.Schema({
  username : String,
  name : String,
  password : String,
  googleId : String,
  imgUrl : String
});

userSchema.plugin(passportLocalMongoose)
const User = new mongoose.model('User',userSchema)

passport.use(User.createStrategy())



passport.serializeUser((user, done) => {
  done(null, user._id);
});

passport.deserializeUser((id, done) => {
  
  User.findOne({_id : id}).then((result)=>{
      if(result == null){
        return done(null , result)
      }else{
        return done(null , result)
      }
  })
});

passport.use(new GoogleStrategy({
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.SECRET,
  callbackURL: "http://localhost:4545/auth/google/verify",
  passReqToCallback:true
},
function(request, accessToken, refreshToken, profile, done) {
  console.log(profile._json + " ")
  console.log(profile._json.name + " " + profile._json.email)
  console.log(profile)
  var temp = new User({
      username : profile._json.email,
      googleId : profile.id,
      name:profile._json.name,
      imgUrl : profile._json.picture
  })
  var isFound = false;
  User.findOne({googleId:profile.id}).then((result)=>{
    console.log("temp")
    console.log(result)
    if(result != null){
      isFound = true
      return done(null , result);
    }else{
      temp.save().then((err)=>{
        return done(err , temp)
      })
    }
  })
  
  


  //return done(null , temp)
  
}
));


app.get('/', function(req,res){
  res.render("homepage")
})

app.get('/auth/google' , function(req , res){

})


app.post('/signup' , (req , res)=>{
    User.register({username : req.body.username ,name : req.body.name , imgUrl : "https://images.unsplash.com/photo-1633332755192-727a05c4013d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MXx8dXNlcnxlbnwwfHwwfHw%3D&w=1000&q=80"}, req.body.password , function(err , user){
      if(err){
          console.log("Oop! Wrong Creds ")
          res.redirect('/register')
      }else{
          passport.authenticate('local')(req,res, function(){
              res.redirect('/profile')
         })
      }
  })
})
app.get('/login' , function(req , res){
  res.render("login")
})
app.get('/signup' , function(req , res){
  res.render("signup")
})
app.post('/login' , function(req , res){
  const user = new User({
    email : req.body.username,
    password : req.body.password 
    
  });
console.log(req.body.username + " " + req.body.password)
  req.login(user , function(err){
      if(err){
          console.log('Error'+ err)
      }else{
        
      }
      passport.authenticate('local')(req,res,function(){
          res.redirect('/profile');
      })
  })
})
app.get('/profile' , function(req , res){
  if(req.isAuthenticated()){
    res.render('profile' , {user : req.user})
  }else{
    res.redirect('/homepage')
  }
})
app.get('/homepage' , (req,res)=>{
  res.render('homepage')
})
// app.get('/*' , function(req,res){
//   res.render("login")
// })

app.post('/logout',function(req,res){
  req.logout(function(err){
    console.log(err + " ");
    res.redirect("/profile")
  })
})
app.get('/users/google-oauth',
  passport.authenticate('google', { scope: ['email','profile'] }));

app.get( '/auth/google/verify',
  passport.authenticate( 'google', {
      successRedirect: '/auth/google/success',
      failureRedirect: '/auth/google/failure'
}));
app.get('/auth/google/failure' , function(req , res){
  console.log("Oops !!!... Failed to Log - In")
})
app.get('/auth/google/success' , function(req , res){
  console.log("Success !!!")
  res.redirect('/profile')
})



app.listen(4545 , function(){
  console.log("Yup ! Server is Running ")
})
