function ClienteWS() {
   this.socket = undefined;
   //this.email=undefined;
   this.codigo = undefined;

   this.ini = function () {
      this.socket = io.connect();

      this.socket.on("partidaCreada", function (datos) {
         console.log(datos.codigo);
         ws.codigo = datos.codigo;
         if (typeof cw !== 'undefined' && cw.mostrarMensaje) {
            //cw.mostrarMensaje("Se ha creado la partida con código: " + datos.codigo, 'info');
            cw.mostrarEsperandoRival();
         }
      });
      this.socket.on("unidoAPartida", function (datos) {
         if (datos.codigo != -1 && datos.codigo != -2) {
            console.log("Unido a partida: " + datos.codigo);
            ws.codigo = datos.codigo; // Almacenar el código
            // cw mostrar juego o sala de espera
            //cw.mostrarMensaje(`Te has unido a la partida ${datos.codigo}`);
            cw.mostrarEsperandoRival();
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
      this.socket.on("jugadorUnido", function (emailRival) {
         console.log(`¡Rival encontrado! ${emailRival} se ha unido.`);

         if (typeof cw !== 'undefined' && cw.mostrarMensaje) {
            cw.mostrarMensaje(`¡Rival encontrado! Partida ${ws.codigo} lista.`);
            // Aquí llamarías a cw.iniciarJuego()
         }else {
            cw.mostrarEsperandoRival();
         }
      });



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


}