const WORLD = {
    WIDTH: 960,
    HEIGHT: 2400 // El alto del mundo de juego
};
const players = {};
const partidaStars = {};

function obtenerEstadoEstrellas(codigo) {
    if (!codigo) return null;
    if (!partidaStars[codigo]) {
        partidaStars[codigo] = new Set();
    }
    return partidaStars[codigo];
}

function limpiarEstadoEstrellasSiProcede(codigo) {
    if (!codigo) return;
    const quedanJugadores = Object.values(players).some(p => p.codigo === codigo);
    if (!quedanJugadores) {
        delete partidaStars[codigo];
    }
}
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
            if (!players[socket.id]) {
                players[socket.id] = {
                    id: socket.id,
                    // Posición inicial por defecto (arriba del mundo para que caiga)
                    x: Math.floor(Math.random() * (WORLD.WIDTH - 200)) + 100,
                    y: WORLD.HEIGHT - 60 - 32,
                    color: '#' + Math.floor(Math.random() * 16777215).toString(16),
                    name: 'Player_' + socket.id.slice(0, 4),
                    // Puedes añadir vidas, puntuación, etc.
                };

                // Opcional: Notificar a otros jugadores sobre el nuevo jugador
                socket.broadcast.emit('newPlayer', players[socket.id]);

                // Opcional: Enviar al cliente actual el estado inicial de todos (usado en game.js)
                socket.emit('currentPlayers', players);
            }


            // 2. Manejar movimiento de jugador (playerMovement)
            // Este evento es enviado por game.js en el cliente en cada frame
            socket.on('playerMovement', (data) => {
                if (players[socket.id]) {
                    // Actualizar datos del jugador en el servidor
                    players[socket.id].x = data.x;
                    players[socket.id].y = data.y;
                    players[socket.id].vx = data.vx;
                    players[socket.id].vy = data.vy;

                    // Emitir el movimiento a todos excepto al jugador actual
                    // Si tuvieras salas de partidas, aquí usarías io.to(sala).except(socket.id).emit(...)
                    socket.broadcast.emit('playerMoved', players[socket.id]);
                }
            });

            socket.on('starCollected', (data) => {
                const jugador = players[socket.id];
                if (!jugador || typeof data?.index !== 'number') {
                    return;
                }
                const codigo = jugador.codigo;
                const estado = obtenerEstadoEstrellas(codigo);
                if (!estado || estado.has(data.index)) {
                    return;
                }
                estado.add(data.index);
                if (codigo) {
                    socket.to(codigo).emit('starCollected', { index: data.index });
                } else {
                    socket.broadcast.emit('starCollected', { index: data.index });
                }
            });

            socket.on('resetStars', () => {
                const jugador = players[socket.id];
                if (!jugador || !jugador.codigo) {
                    return;
                }
                partidaStars[jugador.codigo] = new Set();
                socket.to(jugador.codigo).emit('resetStars');
            });

            socket.on('playerJoinsGame', (datos) => {
                if (!datos || !players[socket.id]) {
                    return;
                }
                const seleccion = datos.skin;
                players[socket.id].email = datos.email;
                players[socket.id].codigo = datos.codigo;
                players[socket.id].skin = seleccion;
                if (seleccion && typeof seleccion === 'string' && seleccion.startsWith('#')) {
                    players[socket.id].color = seleccion;
                }

                // Reenviamos el estado actualizado para que los demás clientes carguen la skin correcta
                socket.broadcast.emit('newPlayer', players[socket.id]);

                const estadoEstrellas = obtenerEstadoEstrellas(datos.codigo);
                if (estadoEstrellas) {
                    socket.emit('currentStars', Array.from(estadoEstrellas));
                }
            });


            // 3. Manejar desconexión
            socket.on('disconnect', () => {
                console.log('user disconnected', socket.id);
                const codigo = players[socket.id]?.codigo;
                delete players[socket.id];
                limpiarEstadoEstrellasSiProcede(codigo);
                io.emit('playerDisconnected', socket.id);
                // ... (Tu lógica de remover la partida o notificar al rival)
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
            socket.on("iniciarJuego", function (datos) {
                let codigo = datos.codigo;
                console.log(`[SERVIDOR] Solicitud para iniciar partida: ${codigo}`);

                // 1. Verificar y cambiar estado de la partida (usando tu objeto sistema)
                let partida = srv.sistema.iniciarPartida(codigo);

                if (partida && partida.codigo) {
                    // 2. Notificar a TODOS los jugadores en la sala que el juego empieza
                    srv.io.sockets.in(codigo).emit('partidaIniciada', { "codigo": codigo });
                    console.log(`[SERVIDOR] Partida ${codigo} iniciada y notificada a la sala.`);

                    // Opcional: Actualizar la lista global de partidas si es necesario
                    // let lista = srv.sistema.obtenerPartidasDisponibles();
                    // srv.enviarGlobal(srv.io, "listaPartidas", lista);
                } else {
                    // Manejar error si la partida no existe o no se puede iniciar
                    console.error(`[SERVIDOR] Error al iniciar partida ${codigo}.`);
                }
            });


        });
    }
}
module.exports.ServidorWS = ServidorWS;