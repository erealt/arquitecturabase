if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const fs=require("fs"); 
const express = require('express'); 
const app = express(); 
const passport=require("passport");
const cookieSession=require("cookie-session");
require("./servidor/passport-setup.js");
const modelo = require("./servidor/modelo.js"); 
const PORT = process.env.PORT || 3000; 
const bodyParser=require("body-parser");
const LocalStrategy = require('passport-local').Strategy;

app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());

app.use(express.static(__dirname + "/"));
let sistema = new modelo.Sistema();

app.use(cookieSession({
   name: 'Sistema', keys: ["key1","key2"] }));
app.use(passport.initialize()); 
app.use(passport.session());
app.get("/auth/google",passport.authenticate('google', { scope: ['profile','email'] }));

 app.get("/", function(request,response){
   var contenido = fs.readFileSync(__dirname + "/cliente/index.html",'utf-8');
   contenido = contenido.replace('data-client_id=process.env.GOOGLE_CLIENT_ID', 'data-client_id="' + process.env.GOOGLE_CLIENT_ID + '"');
   response.setHeader("Content-type", "text/html");
   response.send(contenido);
});
app.get("/agregarUsuario/:nick",function(request,response){ 
  let nick=request.params.nick; 
  let res=sistema.agregarUsuario(nick); 
  response.send(res); });

  app.get("/obtenerUsuarios", function(request, response) {
  let usuarios = sistema.obtenerUsuario();
  response.send(usuarios);
});

app.get("/usuarioActivo/:nick", function(request, response) {
  let nick = request.params.nick;
  let activo = sistema.usuarioActivo(nick).activo;
  response.send({ res: activo });
});

app.get("/numeroUsuarios", function(request, response) {
  let num = sistema.numeroUsuarios();
  response.send({ num: num });
});

app.get("/eliminarUsuario/:nick", function(request, response) {
  let nick = request.params.nick;
  sistema.eliminarUsuario(nick);
  response.send({ res: "ok" });
});
app.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/fallo' }),
   function(req, res) { res.redirect('/good'); });

app.get("/good", function(request,response){
   let email=request.user.emails[0].value;
    sistema.usuarioGoogle({"email":email},function(obj){
       response.cookie('nick',obj.email);
        response.redirect('/');
       });
       });
  app.post('/oneTap/callback', 
    passport.authenticate('google-one-tap', { failureRedirect: '/fallo' }),
     function(req, res) { 
      // Successful authentication, redirect home. 
      res.redirect('/good');
     });

  app.post("/registrarUsuario",function(request,response){
     sistema.registrarUsuario(request.body,function(res){
       response.send({"nick":res.email});
       }); 
      });
  
    app.post('/loginUsuario',passport.authenticate("local",{failureRedirect:"/fallo",successRedirect: "/ok"}) );
app.get("/ok",function(request,response){ response.send({nick:request.user.email}) });
app.get("/confirmarUsuario/:email/:key",function(request,response){
   let email=request.params.email; 
   let key=request.params.key;
    sistema.confirmarUsuario({"email":email,"key":key},function(usr){ 
      if (usr.email!=-1){ 
        response.cookie('nick',usr.email); 
      } 
      response.redirect('/'); 
    }); 
  })

  app.get("/fallo",function(request,response){
    response.send({nick:"nook"});
  });
  passport.use(new LocalStrategy({usernameField:"email",passwordField:"password"},
function(email,password,done){
   sistema.loginUsuario({"email":email,"password":password},function(user){
     return done(null,user);
     }) } 
    ));


       app.listen(PORT, () => { 
        console.log(`App está escuchando en el puerto ${PORT}`); 
       console.log('Ctrl+C para salir'); });