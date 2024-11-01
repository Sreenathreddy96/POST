const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded());
app.use("/uploads",express.static("uploads"));

let authorize = (req,res,next)=>{
  console.log("inside authorize mwf");
  console.log(req.headers.authorization);
  next();

};
app.use(authorize);

const storage = multer.diskStorage({
    destination: (req, file, cb)=> {
      cb(null, "uploads");
    },
    filename:(req, file, cb)=> {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, `${Date.now}_${file.originalname}`);
    },
  });
  
  const upload = multer({ storage: storage });

let userSchema = new mongoose.Schema({
    firstName:String,
    lastName:String,
    age:Number,
    email:String,
    password:String,
    mobileNo:String,
    profilePic:String,
});

let User = new mongoose.model("user", userSchema);

app.post("/Login", upload.none(), async (req, res) => {
  console.log(req.body);
  console.log(req.body);
  let userDetails = await User.find().and({email:req.body.email});

  if(userDetails.length > 0){
      console.log(userDetails);
    let idPasswordValid = await bcrypt.compare(req.body.password,userDetails[0].password)

if(idPasswordValid == true){
let encryptedCred = jwt.sign({email:req.body.email, password:req.body.password},"abracadabra");

let loginDetails ={
  firstName:userDetails[0].firstName,
  lastName:userDetails[0].lastName,
  email:userDetails[0].email,
  profilePic:userDetails[0].profilePic,
  token: encryptedCred,
};

res.json({status:"Success",data:loginDetails});
}else{
  res.json({status:"Failed",msg:"Invalid Password"});
}      
  }else{
      res.json({status:"Failed",msg:"User doesnot exist"});
  }

});

app.post("/validateToken", upload.none(),async(req,res)=>{
  console.log(req.body);

  let decryptedCred = jwt.verify(req.body.token,"abracadabra");
  let userDetails = await User.find().and({email:decryptedCred.email});

  if(userDetails.length > 0){
      console.log(userDetails);

if(userDetails[0].password == decryptedCred.password){

 
let loginDetails ={
  firstName:userDetails[0].firstName,
  lastName:userDetails[0].lastName,
  email:userDetails[0].email,
  profilePic:userDetails[0].profilePic,
  
}

res.json({status:"Success",data:loginDetails});
}else{
  res.json({status:"Failed",msg:"Invalid Password"});
}      
  }else{
      res.json({status:"Failed",msg:"USer doesnot exist"});
  };
});

app.post("/signup",upload.single("profilePic"), async (req,res)=>{
    console.log(req.body);
    console.log(req.file);
    console.log(req.files);

    let hashedPassword = await bcrypt.hash(req.body.password,10);

   try{
    let newUser = new User({
        firstName:req.body.firstName,
        lastName:req.body.lastName,
        age:req.body.age,
        email:req.body.email,
        password:hashedPassword,
        mobileNo:req.body.mobileNo,
        profilePic:req.file.path,
    });

    await User.insertMany([newUser]);
    
    res.json({status:"Success", msg:"User created successfully"});
   }catch(err){
    res.json({status:"failure", msg:"Unable to create user"});
   }
});

app.patch("/updateProfile",upload.single("profilePic"), async(req,res)=>{
  try{

  
   if(req.body.firstName.trim().length>0){
    await User.updateMany({email:req.body.email},{firstName:req.body.firstName});

   };
   if(req.body.lastName.trim().length>0){
    await User.updateMany({email:req.body.email},{lastName:req.body.lastName});

   };
   if(req.body.age>0){
    await User.updateMany({email:req.body.email},{age:req.body.age});

   };
   if(req.body.password.length>0){
    await User.updateMany({email:req.body.email},{password:req.body.password});

   };
   if(req.body.mobileNo.trim().length>0){
    await User.updateMany({email:req.body.email},{mobileNo:req.body.mobileNo});

   };

   if(req.file && req.file.path){
    await User.updateMany({email:req.body.email},{profilePic:req.file.path});
   }
 
  res.json({status:"success", msg:"Profile updates successfully"});

}catch(err){
  res.json({status:"failed", msg:"Unable to update your profile. Something went wrong. Please try again after sometime"});
}
});
app.delete("/deleteProfile", async (req,res) => {
  let delResult = await User.deleteMany({ email: req.query.email });
  console.log(delResult);
 
  if(delResult.deletedCount > 0){
 
    res.json({ status: "success", msg: "User deleted successfully."});
   }else{
   res.json({ status: "failure", msg: "Unable to delete account."});
   }
 });


app.listen(8889,()=>{
    console.log("Listening to port 8889");
});

let connectToMDB = async ()=>{
    try{
        mongoose.connect("mongodb+srv://sreenathlsp44:Sreenath@mern2406cluster.jyxki.mongodb.net/Players?retryWrites=true&w=majority&appName=Mern2406Cluster");
   console.log("Successfully connected to MDB")
    }catch(err){
        console.log("Unable to connect to MDB");
    }
    };

    connectToMDB();