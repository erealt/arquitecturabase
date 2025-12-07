function ServidorWS(io) {
    const srv = this;
    this.io = undefined;
    this.sistema = undefined;

    this.lanzarServidor = function (io, sistema) {
        srv.sistema = sistema;
        srv.io = io;
        io.on('connection', function (socket) {
            console.log("Capa WS activa");

            socket.on("crearPartida", function (datos) {
                let codigo = sistema.crearPartida(datos.email);
                if (codigo != -1) {
                    socket.join(codigo);
                }
                srv.enviarAlRemitente(socket, "partidaCreada", {
                    "codigo": codigo,
                    "email": datos.email,
                });
                let lista = sistema.obtenerPartidasDisponibles();
                srv.enviarATodosMenosRemitente(socket, "listaPartidas", lista);
            });

            socket.on("unirAPartida", function (datos) {
                // Pedir a sistema unir a partida (devuelve el objeto Partida o -1/-2)
                let partida = srv.sistema.unirAPartida(datos.email, datos.codigo);

                let codigoRespuesta = (partida && partida.codigo) ? partida.codigo : partida;

                if (partida && partida != -1 && partida != -2) {
                    // 1. Unirse al socket si el código no es -1
                    socket.join(datos.codigo);

                    // 2. Notificar a todos los miembros de la sala que un jugador se ha unido
                    // (Esto es opcional, pero útil para iniciar el juego)
                    srv.io.sockets.in(datos.codigo).emit('jugadorUnido', datos.email);
                }

                // 3. Enviar al remitente el código de la partida (o -1/-2 si falló)
                srv.enviarAlRemitente(socket, "unidoAPartida", { "codigo": codigoRespuesta });

                // 4. Enviar al resto la lista de partidas actualizada
                let lista = srv.sistema.obtenerPartidasDisponibles();
                srv.enviarGlobal(srv.io, "listaPartidas", lista); // Enviamos a TODOS, no solo al resto
            });
            socket.on("obtenerListaPartidas", function () {
                let lista = sistema.obtenerPartidasDisponibles();
                srv.enviarAlRemitente(socket, "listaPartidas", lista);
            });


        });
    }
    this.enviarAlRemitente = function (socket, mensaje, datos) {
        socket.emit(mensaje, datos);
    }
    this.enviarATodosMenosRemitente = function (socket, mens, datos) {
        socket.broadcast.emit(mens, datos);
    }
    this.enviarGlobal = function (io, mens, datos) {
        io.emit(mens, datos);
    }
}
// module.exports.WSServer=WSServer;
module.exports.ServidorWS = ServidorWS;
