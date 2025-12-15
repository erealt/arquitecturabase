function ServidorWS(io) {
    const srv = this;
    this.io = undefined;
    this.sistema = undefined;
    this.socketsActivos = {};


    this.enviarAlRemitente = function (socket, mensaje, datos) {
        socket.emit(mensaje, datos);
    }
    this.enviarATodosMenosRemitente = function (socket, mens, datos) {
        socket.broadcast.emit(mens, datos);
    }
    this.enviarGlobal = function (io, mens, datos) {
        io.emit(mens, datos);
    }


    this.lanzarServidor = function (io, sistema) {
        srv.sistema = sistema;
        srv.io = io;
        io.on('connection', function (socket) {
            console.log("Capa WS activa");
            socket.on("identificar", function (datos) {
                srv.socketsActivos[datos.email] = socket;
                console.log(`[WS ID] Usuario ${datos.email} identificado y socket almacenado.`);
            });
            socket.on("crearPartida", function (datos) {
                let codigo = sistema.crearPartida(datos.email);
                if (codigo != -1) {
                    socket.join(codigo);
                    // --- DEBUG TEMPORAL: Verifica la sala del creador ---
                    console.log(`[DEBUG] Creador ${datos.email} unido a sala: ${codigo}. Salas del socket:`, [...socket.rooms]);
                    // ----------------------------------------------------
                }
                srv.enviarAlRemitente(socket, "partidaCreada", {
                    "codigo": codigo,
                    "email": datos.email,
                });
                let lista = srv.sistema.obtenerPartidasDisponibles();
                // Usamos enviarGlobal para actualizar a todos, lo cual es más robusto.
                srv.enviarGlobal(srv.io, "listaPartidas", lista);
            });

            socket.on("unirAPartida", function (datos) {
                // Pedir a sistema unir a partida (devuelve el objeto Partida o -1/-2)
                let partida = srv.sistema.unirAPartida(datos.email, datos.codigo);

                let codigoRespuesta = (partida && partida.codigo) ? partida.codigo : partida;

                if (partida && partida != -1 && partida != -2) {
                    // 1. Unirse al socket (el Jugador Unido se une a la sala)
                    socket.join(datos.codigo);

                    // 2. Notificar a todos los miembros de la sala SI la partida está lista (2 jugadores)
                    if (partida.jugadores.length === partida.maxJug) {
                        let emailCreador = partida.jugadores[0];
                        let socketCreadorActual = srv.socketsActivos[emailCreador];
                        if (socketCreadorActual) {
                            socketCreadorActual.join(datos.codigo); // Asegurar que el socket actual esté en la sala
                            socketCreadorActual.emit('partidaLista', {
                                "codigo": partida.codigo,
                                "jugadores": partida.jugadores
                            });
                            console.log(`Notificación 'partidaLista' enviada al Creador a través de socket ID actualizado.`);
                        }
                        // if (partida.socketCreator) {
                        //     //  CRÍTICO: Usar el array de jugadores del objeto Partida, que tiene al Creador en [0]
                        //     partida.socketCreator.emit('partidaLista', {
                        //         "codigo": partida.codigo,
                        //         "jugadores": partida.jugadores // ESTO DEBE SER [P1_email, P2_email]
                        //     });
                        //     console.log(`Notificación 'partidaLista' enviada al Creador. Orden de jugadores: ${partida.jugadores.join(', ')}`);
                        // }
                        // Partida completa, notificar a todos los jugadores en la sala
                        srv.io.sockets.in(datos.codigo).emit('partidaLista', {
                            codigo: datos.codigo,
                            jugadores: partida.jugadores // Array de emails: [creador, unido]
                        });
                        console.log(`Partida ${datos.codigo} lista para iniciar. Jugadores: ${partida.jugadores.join(', ')}`);
                    } else {
                        // Si es una partida de >2 jugadores y aún no está llena
                        srv.io.sockets.in(datos.codigo).emit('jugadorUnido', datos.email);
                    }

                    // 3. Enviar al remitente el código de la partida (o -1/-2 si falló)
                    srv.enviarAlRemitente(socket, "unidoAPartida", { "codigo": codigoRespuesta });

                    // 4. Enviar al resto la lista de partidas actualizada
                    let lista = srv.sistema.obtenerPartidasDisponibles();
                    srv.enviarGlobal(srv.io, "listaPartidas", lista); // Enviamos a TODOS, no solo al resto
                }
            });
            socket.on("obtenerListaPartidas", function () {
                let lista = sistema.obtenerPartidasDisponibles();
                srv.enviarAlRemitente(socket, "listaPartidas", lista);
            });


        });
    }
}
module.exports.ServidorWS = ServidorWS;