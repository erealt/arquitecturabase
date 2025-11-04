const datos=require("./cad.js");
const correo=require("./emails.js");
const bcrypt = require('bcrypt');
function Sistema(test){ 
    this.cad=new datos.CAD();
    if (!test.test){
    this.cad.conectar(function(db){
         console.log("Conectado a Mongo Atlas"); });
        }
    this.usuarios={};
    
    this.registrarUsuario=function(obj,callback){
         let modelo=this; 
         if (!obj.nick){
            obj.nick=obj.email; 
        } 
        this.cad.buscarUsuario({"email":obj.email},async function(usr){
             if (!usr){ //el usuario no existe, luego lo puedo registrar 
                const hash = await bcrypt.hash(obj.password, 10); // Genera el hash de forma asíncrona
                obj.password = hash;
            
                obj.key=Date.now().toString();
              obj.confirmada=false;

               modelo.cad.insertarUsuario(obj,function(res){
                 callback(res); 
                });
                 correo.enviarEmail(obj.email,obj.key,"Confirmar cuenta"); 
                } else { callback({"email":-1});
             } });
             }
  
     this.agregarUsuario=function(nick){ 
       let res={"nick":-1};
        if (!this.usuarios[nick]){
             this.usuarios[nick]=new Usuario(nick);
              res.nick=nick; 
            } else{
                 console.log("el nick "+nick+" está en uso"); 
                }
        return res;
    }
    this.usuarioGoogle=function(usr,callback){ 
        this.cad.buscarOCrearUsuario(usr,function(obj){ 
            callback(obj); });
         } 
    this.obtenerUsuario=function(){ 
        return this.usuarios; 
    }
    this.usuarioActivo=function(nick){
    return { activo: this.usuarios.hasOwnProperty(nick) };
}
    this.eliminarUsuario=function(nick){
        delete this.usuarios[nick];
    }
    this.numeroUsuarios=function(){
        return Object.keys(this.usuarios).length;
    }
   this.loginUsuario=function(obj,callback) { 
    this.cad.buscarUsuario({"email":obj.email,"confirmada":true},function(usr){
        if(usr){
                // Compara la contraseña que llega (texto plano) con el hash guardado (usr.password)
                bcrypt.compare(obj.password, usr.password, function(err, result) {
                    if (result) {
                        // Las contraseñas coinciden
                        callback(usr);
                    } else {
                        // Las contraseñas NO coinciden
                        callback({"email":-1});
                    }
                });
            } else {
                // Usuario no encontrado o no confirmado
                callback({"email":-1});
            }
    });
} 

this.confirmarUsuario=function(obj,callback){ 
    let modelo=this; this.cad.buscarUsuario({"email":obj.email,"confirmada":false,"key":obj.key},function(usr){
         if (usr){
             usr.confirmada=true; modelo.cad.actualizarUsuario(usr,function(res){
                 callback({"email":res.email}); //callback(res)
                 }) 
                } else {
                     callback({"email":-1});
                     } })
                     }
}
function Usuario(nick){ 
    this.nick=nick;
}

module.exports = {
    Sistema: Sistema,
    Usuario: Usuario
};

module.exports.Sistema=Sistema;
