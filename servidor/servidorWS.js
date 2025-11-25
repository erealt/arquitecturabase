function ServidorWS(io){ 
    this.lanzarServidor=function(io, sistema){
         io.on('connection',function(socket){ 
            console.log("Capa WS activa"); 
        }); 
    }
}
// module.exports.WSServer=WSServer;
module.exports.ServidorWS =  ServidorWS;
