function ControlWeb() {
   
    this.mostrarAgregarUsuario = function() {
        // Construye el HTML del formulario como una cadena
        let cadena = '';
        cadena += '<div class="form-group" id="mAU">';
        cadena += '  <label for="nick">Name:</label>';
        cadena += '  <input type="text" class="form-control" id="nick" placeholder="Introduce tu nick">';
        cadena += '  <button id="btnAU" type="button" class="btn btn-primary mt-2">Entrar</button>';

        // cadena = cadena + '<button id="btnAU" type="submit" class="btn btn-primary">Submit</button>'; 
        cadena=cadena+'<div><a href="/auth/google"><img src="./cliente/img/web_light_rd_SI@1x.png" style="height:40px;"></a></div>';
        cadena += '</div>';

        // Inserta el formulario en el div con id 'au'
        $("#au").html(cadena);

        // Asocia el evento click al botón
        $("#btnAU").on("click", function() {
            let nick = $("#nick").val();
            rest.agregarUsuario(nick);
            // Elimina el formulario tras hacer click
            $("#mAU").remove();
        });
    };
    this.mostrarObtenerUsuarios = function() {
    let cadena = '';
    cadena += '<div class="form-group" id="mOU">';
    cadena += '  <button id="btnOU" type="button" class="btn btn-info mt-2">Mostrar usuarios</button>';
    cadena += '  <div id="listaUsuarios" class="mt-2"></div>';
    cadena += '</div>';
    $("#au").html(cadena);
    $("#btnOU").on("click", function() {
        rest.obtenerUsuarios();
        // Puedes modificar ClienteRest.obtenerUsuarios para que imprima en #listaUsuarios
    });
};
this.comprobarSesion=function(){ 
    // let nick=localStorage.getItem("nick"); 
    let nick = $.cookie("nick");
    if (nick){ 
        cw.mostrarMensaje("Bienvenido al sistema, "+nick); 

    } else{ 
        //cw.mostrarAgregarUsuario();
        cw.mostrarRegistro();
         } }

this.mostrarMensaje = function(msg) {
        // Elimina el formulario de agregar usuario si existe
        $("#mAU").remove(); 

        $("#registro").html("");
        // Inyecta el mensaje de bienvenida en el contenedor principal
        $("#au").html('<div id="bnv"><h3>' + msg + '</h3></div>');
    };
this.salir = function() {
        $.removeCookie("nick");
        // localStorage.removeItem("nick");
        location.reload();
        rest.cerrarSesion();
    };
// 2. Método para asociar el evento a los elementos estáticos del nav
    this.inicializarNav = function() {
        let cw = this;
        
        // Asocia la funcionalidad de salir al enlace con id="salirNav"
        $("#salir").on("click", function(e) {
            e.preventDefault(); // Evita que el enlace salte o recargue la página
            cw.salir();
        });

        // Opcional: Asocia la funcionalidad de iniciar sesión al enlace correspondiente
        // Si el enlace de Iniciar Sesión tiene id="iniciarSesionNav"
        $("#iniciarSesion").on("click", function(e) {
            e.preventDefault(); 
            cw.mostrarAgregarUsuario();
        });
    };

    this.mostrarRegistro=function(){
         $("#fmRegistro").remove();
          $("#registro").load("./cliente/registro.html",function(){
             $("#btnRegistro").on("click",function(e){
                 e.preventDefault(); 
                 let email=$("#email").val();
                 let pwd=$("#pwd").val();
                  if (email && pwd){
                     rest.registrarUsuario(email,pwd); 
                     console.log(email+" "+pwd);
                     } else {
                        cw.mostrarMensaje("Introduce email y contraseña.");
                     }
                    }); 
                });
             }
    this.limpiar = function(){
        $("#au").html(""); // Limpia el área de usuario (donde está el One Tap/Botón)
        $("#registro").html(""); // Limpia el área de registro/login
    // También puedes borrar el mensaje de bienvenida si existe
        $("#bnv").remove();
}
}