function ServidorWS(io){ 
    const srv = this;
    this.lanzarServidor=function(io, sistema){
         io.on('connection',function(socket){ 
            console.log("Capa WS activa"); 

            socket.on("crearPartida",function(datos){ 
                let codigo = sistema.crearPartida(datos.email); 
                if (codigo !=-1){ 
                    socket.join(codigo);
                 }
                 srv.enviarAlRemitente(socket,"partidaCreada",{
                    "codigo":codigo,
                    "email":datos.email,
                });
                  let lista = sistema.obtenerPartidasDisponibles();
                   srv.enviarATodosMenosRemitente(socket,"listaPartidas",lista); 
                });
            
                
        }); 
    }
   this.enviarAlRemitente=function(socket,mensaje,datos){ 
    socket.emit(mensaje,datos); }
     this.enviarATodosMenosRemitente=function(socket,mens,datos)
     {
         socket.broadcast.emit(mens,datos); 
        } 
        this.enviarGlobal=function(io,mens,datos){ 
            io.emit(mens,datos); 
        } 
}
// module.exports.WSServer=WSServer;
module.exports.ServidorWS =  ServidorWS;
