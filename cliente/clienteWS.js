function ClienteWS(){ 
    this.socket=undefined;
    //this.email=undefined;
    this.codigo=undefined;

     this.ini=function(){ 
        this.socket=io.connect();

        this.socket.on("partidaCreada",function(datos){
         console.log(datos.codigo); 
         ws.codigo=datos.codigo; 
         if (typeof cw !== 'undefined' && cw.mostrarMensaje){
                cw.mostrarMensaje("Se ha creado la partida con código: "+datos.codigo, 'info');
            }
    });


     }
     this.ini();

     this.lanzarServidor = function(){
        let ws = this;

      };

this.crearPartida=function(){ 
   this.socket.emit("crearPartida",{"email":this.email});
 }
 
 }