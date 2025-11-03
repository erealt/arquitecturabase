function Sistema(){ 
    this.usuarios={};
     this.agregarUsuario=function(nick){ 
        this.usuarios[nick]=new Usuario(nick); 
    } 
    this.obtenerUsuario=function(){ 
        return this.usuarios; 
    }
    this.usuarioActivo=function(nick){
        return this.usuarios.hasOwnProperty(nick);
    }
    this.eliminarUsuario=function(nick){
        delete this.usuarios[nick];
    }
    this.numeroUsuarios=function(){
        return Object.keys(this.usuarios).length;
} 
this.registrarUsuario=function(obj,callback){
     let modelo=this; 
     if (!obj.nick){ obj.nick=obj.email;
       obj.email=obj.nick;
      } 
      this.cad.buscarUsuario(obj,function(usr){ 
        if (!usr){
             modelo.cad.insertarUsuario(obj,function(res){ 
                callback(res); });
             }
              else { callback({"email":-1});
             } });
             }
}
function Usuario(nick){ 
    this.nick=nick;
}
