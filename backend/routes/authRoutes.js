const express=require("express");
const router=express.Router();
const passport=require("../config/Passport")
const { SignUp ,Login,LogOut,ForgetPassword, ResetPassword, thirdPartyLogin  }=require("../controllers/authcontroller")

router.post("/signup",SignUp)
router.post("/login",Login)
router.post("/logout",LogOut)
router.post("/forgetpassword",ForgetPassword)
router.post("/resetpassword",ResetPassword)

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: '/login' }),
    thirdPartyLogin
  );

router.get('/facebook', passport.authenticate('facebook', { scope: ['email'] }));

router.get( '/facebook/callback',
    passport.authenticate('facebook', { failureRedirect: '/login' }),
    thirdPartyLogin 
  );


module.exports = router;
