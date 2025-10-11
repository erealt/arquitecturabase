const fs=require("fs"); 
const express = require('express'); 
const app = express(); 
const modelo = require("./servidor/modelo.js"); 
const PORT = process.env.PORT || 3000; 
app.use(express.static(__dirname + "/"));
let sistema = new modelo.Sistema();


 app.get("/", function(request,response){
   var contenido = fs.readFileSync(__dirname + "/cliente/index.html");
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


       app.listen(PORT, () => { 
        console.log(`App está escuchando en el puerto ${PORT}`); 
       console.log('Ctrl+C para salir'); });