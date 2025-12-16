function ControlWeb() {


    this.mostrarAgregarUsuario = function () {
        // Construye el HTML del formulario como una cadena
        let cadena = '';
        cadena += '<div class="form-group" id="mAU">';
        cadena += '  <label for="nick">Name:</label>';
        cadena += '  <input type="text" class="form-control" id="nick" placeholder="Introduce tu nick">';
        cadena += '  <button id="btnAU" type="button" class="btn btn-primary mt-2">Entrar</button>';

        // cadena = cadena + '<button id="btnAU" type="submit" class="btn btn-primary">Submit</button>'; 
        cadena = cadena + '<div><a href="/auth/google"><img src="./cliente/img/web_light_rd_SI@1x.png" style="height:40px;"></a></div>';
        cadena += '</div>';

        // Inserta el formulario en el div con id 'au'
        $("#au").html(cadena);

        // Asocia el evento click al botón
        $("#btnAU").on("click", function () {
            let nick = $("#nick").val();
            rest.agregarUsuario(nick);
            // Elimina el formulario tras hacer click
            $("#mAU").remove();
        });
    };
    this.mostrarObtenerUsuarios = function () {
        let cadena = '';
        cadena += '<div class="form-group" id="mOU">';
        cadena += '  <button id="btnOU" type="button" class="btn btn-info mt-2">Mostrar usuarios</button>';
        cadena += '  <div id="listaUsuarios" class="mt-2"></div>';
        cadena += '</div>';
        $("#au").html(cadena);
        $("#btnOU").on("click", function () {
            rest.obtenerUsuarios();
            // Puedes modificar ClienteRest.obtenerUsuarios para que imprima en #listaUsuarios
        });
    };
    this.comprobarSesion = function () {
        // let nick=localStorage.getItem("nick"); 
        let nick = $.cookie("nick");
        if (nick) {

            ws.email = nick;
            console.log("Email asignado a ws desde cookie:", ws.email);
            ws.identificarUsuario(ws.email);
            cw.mostrarMensaje("Bienvenido al sistema, " + nick);
            $("#iniciarSesion").hide();


        } else {
            //cw.mostrarAgregarUsuario();
            cw.mostrarLogin();
            $("#salir").hide();

        }
    }
    this.gestionarNav = function (loggeado) {
        if (loggeado) {
            $("#iniciarSesion").hide(); // Ocultar "Iniciar Sesion"
            $("#registroNav").hide(); // Ocultar "Registrarse"
            $("#salir").show(); // Mostrar "Salir"
        } else {
            $("#iniciarSesion").show(); // Mostrar "Iniciar Sesion"
            $("#registroNav").show(); // Mostrar "Registrarse"
            $("#salir").hide(); // Ocultar "Salir"
        }
    };

    this.mostrarMensaje = function (msg) {
        // Elimina el formulario de agregar usuario si existe
        $("#mAU").remove();

        $("#registro").html("");
        this.gestionarNav(true);
        // Inyecta el mensaje de bienvenida en el contenedor principal
        $("#au").html('<div id="bnv"><h3>' + msg + '</h3></div>');
        this.mostrarMenuPartidas();
    };
    this.mostrarModal = function (m) {
        // Quitar cualquier mensaje previo
        $('#msg').remove();
        // Log para depuración
        console.log('mostrarModal llamado con:', m);
        // Construir contenido y escribir en el body correcto
        const cadena = "<div class='modal-msg' id='msg'>" + (m || '') + "</div>";
        $('#miBody').html(cadena);
        // Mostrar modal
        $('#miModal').modal('show');
    };

    this.salir = function () {
        $.removeCookie("nick");
        // localStorage.removeItem("nick");
        location.reload();
        rest.cerrarSesion();
        this.gestionarNav(false);
    };
    // 2. Método para asociar el evento a los elementos estáticos del nav
    this.inicializarNav = function () {
        let cw = this;

        // Asocia la funcionalidad de salir al enlace con id="salirNav"
        $("#salir").on("click", function (e) {
            e.preventDefault(); // Evita que el enlace salte o recargue la página
            cw.salir();
        });
        $("#iniciarSesion").on("click", function (e) {
            e.preventDefault();
            cw.mostrarLogin();
        });
        $("#registroNav").on("click", function (e) {
            e.preventDefault();
            cw.mostrarRegistro();
        });
    };
    this.mostrarMensajeFormulario = function (msg, formularioSelector) {
        let $form = $(formularioSelector);
        // 1. Limpia mensajes de error anteriores dentro de este formulario
        $form.find(".alert").remove();

        if (msg) {
            // 2. Crea y adjunta el mensaje de error (usando estilo Bootstrap alert-danger)
            let mensajeHtml = '<div class="alert alert-danger error-msg-local mt-3" role="alert">' + msg + '</div>';
            // Lo adjuntamos al final del formulario
            $form.append(mensajeHtml);
        }
    };
    this.mostrarRegistro = function () {
        console.log('ControlWeb: mostrarRegistro llamado');
        $("#fmRegistro").remove();
        cw.limpiar(); // Limpia cualquier formulario anterior (registro o login)
        $("#registro").load("./cliente/registro.html", function () {
            const formSelector = "#fmRegistro";
            $("#btnRegistro").on("click", function (e) {
                e.preventDefault();
                let email = $("#email").val();
                let pwd = $("#pwd").val();
                if (email && pwd) {
                    rest.registrarUsuario(email, pwd);
                    console.log(email + " " + pwd);
                } else {
                    // cw.mostrarMensaje("Introduce email y contraseña.");
                    cw.mostrarMensajeFormulario("Introduce email y contraseña.", formSelector);
                }
            });
        });
        cw.mostrarBotonGoogle();
    }
    this.mostrarLogin = function () {
        console.log('ControlWeb: mostrarLogin llamado');
        cw.limpiar(); // Limpia cualquier formulario anterior (registro o login)

        // 1. Mostrar el formulario de Login Local en el contenedor #registro
        $("#registro").load("./cliente/login.html", function () {
            const formSelector = "#fmLogin";
            // a. Asignar evento al botón de Login
            $("#btnLogin").on("click", function (e) {
                e.preventDefault();
                let email = $("#emailL").val();
                let pwd = $("#pwdL").val();
                cw.mostrarMensajeFormulario("", formSelector);
                if (email && pwd) {
                    // Llamar al método de ClienteRest (pendiente de implementar o verificar)
                    rest.loginUsuario(email, pwd);
                } else {
                    cw.mostrarMensajeFormulario("Introduce email y contraseña.", formSelector);
                }
            });

            // b. Asignar evento al enlace de Registro
            $("#linkRegistro").on("click", function (e) {
                e.preventDefault();
                cw.mostrarRegistro(); // Cambia al formulario de registro
            });
            // 2. Mostrar el botón de Google OAuth/One Tap en el contenedor #au
            cw.mostrarBotonGoogle();
        });


    }
    this.mostrarBotonGoogle = function () {
        let cadena = '';
        cadena += '<div class="form-group" id="mAU">';
        cadena += '<h3>O Iniciar con Google</h3>';
        // Usamos solo el enlace de Google para simplificar
        cadena += '<div><a href="/auth/google"><img src="./cliente/img/web_light_rd_SI@1x.png" style="height:40px;"></a></div>';
        cadena += '</div>';

        $("#registro").append(cadena);
    };



    this.limpiar = function () {
        $("#au").html(""); // Limpia el área de usuario (donde está el One Tap/Botón)
        $("#registro").html(""); // Limpia el área de registro/login
        // También puedes borrar el mensaje de bienvenida si existe
        $("#bnv").remove();
    }
    // En cliente/controlWeb.js (dentro de function ControlWeb())

    // ... (métodos existentes)

    this.mostrarMenuPartidas = function () {
        cw.limpiar();
        this.gestionarNav(true);
        $("#au").html(`
        <div id="partidas-menu">
            <h2>Gestión de Partidas</h2>
            <div class="row">
                <div class="col-md-4 mb-3">
                    <button id="btnCrearPartida" class="btn btn-cta btn-lg btn-pill w-100">
                        Crear Partida y Esperar Rival
                    </button>
                </div>
                <div class="col-md-4 mb-3">
                    <button id="btnJugarSolo" class="btn btn-warning btn-lg btn-pill w-100">
                        Jugar Solo
                    </button>
                </div>
                <div class="col-md-4">
                    <div id="listaPartidasContainer">
                        <h4>Partidas Disponibles:</h4>
                        <div id="listaPartidas">
                            <p class="text-muted">No hay partidas abiertas.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `);

        // Asignar eventos
        $("#btnCrearPartida").on("click", function () {
            ws.crearPartida(); // Llama al método WS implementado
        });
        $("#btnJugarSolo").on("click", function () {
            ws.jugarSolo();
        });
    };

    this.mostrarEsperandoRival = function () {
        $("#registro").empty();
        $("#au").empty();

        $("#au").html(`
        <div class="text-center py-5">
            <h3>Partida creada con código: ${ws.codigo}</h3>
            <p class="lead">Esperando a que un rival se una...</p>
            <div class="spinner-border text-info" role="status">
                <span class="sr-only">Cargando...</span>
            </div>
            <button id="btnAbandonarPartida" class="btn btn-ghost btn-pill mt-4">Abandonar Partida</button>
        </div>
    `);

        // Evento para abandonar (pendiente de implementar en el modelo/WS)
        $("#btnAbandonarPartida").on("click", function () {

            cw.mostrarMenuPartidas();
        });
    };
    this.mostrarPartidaLista = function (codigo, emailRival) {
        // 1. Limpiar el contenedor principal (partidas-menu)
        $("#registro").empty();

        // 2. Mostrar solo el botón, y al pulsarlo mostrar el canvas directamente
        $("#au").html(`
        <div class="text-center py-5" id="partida-lista-view">
            <h3>¡PARTIDA LISTA! Código: ${codigo}</h3>
            <p class="lead">Rival encontrado: ${emailRival}</p>
            <button id="btnIniciarJuego" class="btn btn-cta btn-lg btn-pill mt-4">¡INICIAR JUEGO!</button>
        </div>
    `);

        $("#btnIniciarJuego").on("click", function () {
            console.log("Iniciando el juego...");
            // Mostrar el canvas del juego directamente
            cw.mostrarPantallaJuego(codigo, [ws.email, emailRival]);
            ws.iniciarJuego();
        });
    };

    this.mostrarListaPartidas = function (lista) {
        let html = '';

        if (lista.length === 0) {
            html = '<p class="text-muted">No hay partidas abiertas.</p>';
        } else {
            html = '<table class="table table-dark table-striped mt-3"><thead><tr><th>Código</th><th>Creador</th><th>Acción</th></tr></thead><tbody>';

            lista.forEach(function (partida) {
                html += `
                <tr>
                    <td>${partida.codigo}</td>
                    <td>${partida.creador}</td>
                    <td>
                        <button class="btn btn-sm btn-success btn-unirse" data-codigo="${partida.codigo}">
                            Unirse
                        </button>
                    </td>
                </tr>
            `;
            });
            html += '</tbody></table>';
        }

        $("#listaPartidas").html(html);

        // Asignar evento a los botones "Unirse"
        $(".btn-unirse").on("click", function () {
            const codigo = $(this).data("codigo");
            ws.unirAPartida(codigo);
        });
    };

    this.mostrarPantallaJuego = function (codigo, initialPlayers) {
        cw.limpiar();
        $("#menuNav").hide();
        $("#registro").empty();

        $("#au").load("/cliente/game/index.html", function (responseText, statusText, xhr) {
            if (statusText === "error") {
                console.error("Error al cargar cliente/game/index.html:", xhr.statusText);
                $("#au").html("<div class='alert alert-danger'>No se pudo cargar la interfaz del juego.</div>");
                return;
            }

            $.getScript("cliente/game/constants.js", function () {
                console.log("[CW] Constantes de juego cargadas.");

                $.getScript("cliente/game/game.js", function () {
                    console.log("[CW] Lógica del juego Jumpverse cargada.");

                    if (typeof StartGameManager !== 'undefined') {
                        console.log(`[CW] Iniciando juego Jumpverse para la partida ${codigo}.`);
                        StartGameManager(codigo, initialPlayers, ws.email);
                    } else {
                        console.error("ERROR CRÍTICO: StartGameManager no está definido en game.js.");
                    }
                }).fail(function (jqxhr, settings, exception) {
                    console.error("Error al cargar game.js:", exception);
                });
            }).fail(function (jqxhr, settings, exception) {
                console.error("Error al cargar constants.js:", exception);
            });
        });

        console.log(`[CW] Solicitando carga de contenedor de juego para ${codigo}.`);
    };


}