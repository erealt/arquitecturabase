function ClienteWS() {
   this.socket = undefined;
   //this.email=undefined;
   this.codigo = undefined;

   this.ini = function () {
      this.socket = io.connect();

      this.socket.on("partidaCreada", function (datos) {
         console.log(datos.codigo);
         ws.codigo = datos.codigo;
         if (typeof cw !== 'undefined' && cw.mostrarEsperandoRival) {
            //cw.mostrarMensaje("Se ha creado la partida con código: " + datos.codigo, 'info');
            cw.mostrarEsperandoRival();
         }
      });
      this.socket.on("unidoAPartida", function (datos) {
         if (datos.codigo != -1 && datos.codigo != -2) {
            console.log("Unido a partida: " + datos.codigo);
            ws.codigo = datos.codigo; // Almacenar el código
            // if (typeof cw !== 'undefined' && cw.mostrarEsperandoInicio) {
            //    cw.mostrarEsperandoInicio(ws.codigo);
            // }

         } else {
            console.error("Error al unirse a partida:", datos.codigo === -2 ? "Partida llena" : "Código inválido");
         }
      });
      this.socket.on("listaPartidas", function (lista) {
         console.log("Lista de partidas actualizada:");
         console.log(lista);
         if (typeof cw !== 'undefined' && cw.mostrarListaPartidas) {
            cw.mostrarListaPartidas(lista);
         }
      });
      this.socket.on("partidaLista", function (datos) {
         console.log(`¡Partida Lista! Código: ${datos.codigo}. Jugadores: ${datos.jugadores.join(', ')}`);
         ws.codigo = datos.codigo;

         // Identificar mi email (ws.email) y el del rival
         let miEmail = ws.email;
         // El email del rival es el otro email en la lista de jugadores
         let rivalEmail = datos.jugadores.find(email => email !== miEmail);

         let esCreador = datos.jugadores[0] === miEmail;
         console.log(`DIAGNÓSTICO P1 - Mi Email: ${miEmail}`);
         console.log(`DIAGNÓSTICO P1 - Es Creador: ${esCreador}`);
         console.log(`DIAGNÓSTICO P1 - Rival Email: ${rivalEmail}`);
         if (typeof cw === 'undefined' || !cw.mostrarPartidaLista) {
            console.error("CRÍTICO: El controlador 'cw' o el método 'mostrarPartidaLista' no están disponibles.");
            return; // Detiene la ejecución si no puede mostrar la pantalla
         }


         if (esCreador) {
            cw.mostrarPartidaLista(ws.codigo, rivalEmail);
         } else {
            // El Rival (P2) ya está en 'mostrarEsperandoInicio' (desde unidoAPartida).
            // No necesita hacer nada más con esta señal, a menos que quieras actualizar un mensaje.
            console.log("Rival: Partida lista confirmada. Esperando al Creador para iniciar.");
         }

      });
      this.socket.on("partidaIniciada", function (datos) {
         console.log(`[CLIENTE] Partida ${datos.codigo} iniciada. Cambiando a vista de juego.`);
         // Llama al nuevo método de la interfaz
         if (typeof cw !== 'undefined' && cw.mostrarPantallaJuego) {
            cw.mostrarPantallaJuego(datos.codigo,datos.jugadores);
         }
      });

      // this.socket.on("jugadorUnido", function (emailRival) {
      //    console.log(`¡Rival encontrado! ${emailRival} se ha unido.`);

      //    if (typeof cw !== 'undefined' && cw.mostrarPartidaLista) {
      //       cw.mostrarPartidaLista(ws.codigo, emailRival);
      //    } else {
      //       console.error("Error: cw.mostrarPartidaLista no está definido o es inaccesible.");
      //       }
      //    }
      // );


   }
   this.ini();

   this.lanzarServidor = function () {
      let ws = this;

   };

   this.crearPartida = function () {
      this.socket.emit("crearPartida", { "email": this.email });
   }
   this.unirAPartida = function (codigo) {
      this.socket.emit("unirAPartida", { "email": this.email, "codigo": codigo });
   }
   this.obtenerListaPartidas = function () {
      this.socket.emit("obtenerListaPartidas");
   }
   this.identificarUsuario = function (email) {
      this.socket.emit("identificar", { email: email });

   }
   this.iniciarJuego = function () {
      if (this.codigo) {
         console.log(`Cliente WS: Solicitando iniciar partida ${this.codigo}`);
         // Emite el evento con el código de la partida actual
         this.socket.emit("iniciarJuego", { "codigo": this.codigo });
      } else {
         console.error("No hay código de partida para iniciar.");
      }
   }


}