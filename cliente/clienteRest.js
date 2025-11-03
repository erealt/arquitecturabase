function ClienteRest(){


this.registrarUsuario=function(email,password){
    var cli=this;
    $.ajax({
        type:'POST',
        url:'/registrarUsuario',
        data: JSON.stringify({"email":email,"password":password}),
        success:function(data){
            if (data.nick!=-1){
                //  Mensaje de registro realizado
                console.log("Usuario "+data.nick+" ha sido registrado");
                // $.cookie("nick",data.nick);
                cw.limpiar();
                // cw.mostrarMensaje("Bienvenido al sistema, "+data.nick + ". Confirma tu cuenta en el email.");
                cw.mostrarMensaje("¡Registro exitoso! Por favor, inicia sesión a continuación.");
                // Ahora que está registrado, le mostramos el login
                cw.mostrarLogin(); //  Usamos el método que vamos a implementar
            } else{
                //  Mensaje en caso de nick/email ocupado
                console.log("El nick está ocupado");
                cw.mostrarMensaje("El email ya está registrado.");
            }
        },
        error:function(xhr, textStatus, errorThrown){
            console.log("Status: " + textStatus);
            console.log("Error: " + errorThrown);
            cw.mostrarMensaje("Error al intentar registrar el usuario."); //  Mensaje de error
        },
        contentType:'application/json'
    });
}
    this.agregarUsuario=function(nick){ 
        var cli=this; 
        $.getJSON("/agregarUsuario/"+nick,function(data){
             let msg="El nick "+nick+" está ocupado";
              if (data.nick!=-1){
                 console.log("Usuario "+nick+" ha sido registrado");
                  msg="Bienvenido al sistema, "+nick; 
                //   localStorage.setItem("nick",nick); 
                    $.cookie("nick", nick);
                } else{ console.log("El nick ya está ocupado"); 

                } cw.mostrarMensaje(msg); }); }

    // this.agregarUsuario2=function(nick){
    //     $.ajax({
    //         type: 'GET',
    //         url: '/agregarUsuario/' + nick,
    //         success: function(data){
    //             if (data.nick != -1){
    //                 console.log("Usuario " + nick + " ha sido registrado");
    //             } else{
    //                 console.log("El nick ya está ocupado");
    //             }
    //         },
    //         error: function(xhr, textStatus, errorThrown){
    //             console.log("Status: " + textStatus);
    //             console.log("Error: " + errorThrown);
    //         },
    //         contentType: 'application/json'
    //     });
    // };

    // Obtener todos los usuarios
    this.obtenerUsuarios = function(){
        $.ajax({
            type: 'GET',
            url: '/obtenerUsuarios',
            success: function(data){
                console.log("Usuarios:", data);
            },
            error: function(xhr, textStatus, errorThrown){
                console.log("Status: " + textStatus);
                console.log("Error: " + errorThrown);
            },
            contentType: 'application/json'
        });
    };

    // Obtener el número de usuarios
    this.numeroUsuarios = function(){
        $.ajax({
            type: 'GET',
            url: '/numeroUsuarios',
            success: function(data){
                console.log("Número de usuarios:", data);
            },
            error: function(xhr, textStatus, errorThrown){
                console.log("Status: " + textStatus);
                console.log("Error: " + errorThrown);
            },
            contentType: 'application/json'
        });
    };

    // Comprobar si un usuario está activo
    this.usuarioActivo = function(nick){
        $.ajax({
            type: 'GET',
            url: '/usuarioActivo/' + nick,
            success: function(data){
                console.log("Usuario activo:", data);
            },
            error: function(xhr, textStatus, errorThrown){
                console.log("Status: " + textStatus);
                console.log("Error: " + errorThrown);
            },
            contentType: 'application/json'
        });
    };

    // Eliminar un usuario
    this.eliminarUsuario = function(nick){
        $.ajax({
            type: 'GET',
            url: '/eliminarUsuario/' + nick,
            success: function(data){
                console.log("Eliminar usuario:", data);
            },
            error: function(xhr, textStatus, errorThrown){
                console.log("Status: " + textStatus);
                console.log("Error: " + errorThrown);
            },
            contentType: 'application/json'
        });
    };
    this.registrarUsuario=function(email,password){
         $.ajax({
             type:'POST',
              url:'/registrarUsuario',
               data: JSON.stringify({"email":email,"password":password}),
                success:function(data){ 
                    if (data.nick!=-1){ 
                        console.log("Usuario "+data.nick+" ha sido registrado");
                         $.cookie("nick",data.nick);
                          cw.limpiar();
                        //    cw.mostrarMensaje("Bienvenido al sistema, "+data.nick); 
                        cw.mostrarMensaje("¡Registro exitoso! Por favor, inicia sesión a continuación.");
                           cw.mostrarLogin(); 
                           } 
                           else{ 
                            console.log("El nick está ocupado");
                            

                        } 
                    }, 
                    error:function(xhr, textStatus, errorThrown){ 
                        console.log("Status: " + textStatus);
                         console.log("Error: " + errorThrown); 
                        },
                         contentType:'application/json' 
                        });
                     }
   this.loginUsuario=function(email, password) {
    $.ajax({
        type: 'POST',
        url:'/loginUsuario', // 🎯 Endpoint que debes implementar en index.js
        data: JSON.stringify({"email": email, "password": password}),
        success: function(data) {
            if (data.nick!=-1){
                console.log("Usuario "+data.nick+" ha iniciado sesión");
                $.cookie("nick", data.nick);
                cw.limpiar();
                cw.mostrarMensaje ("Bienvenido al sistema, "+data.nick);
            } else{
                console.log("No se pudo iniciar sesión");
                cw.mostrarMensaje("Credenciales incorrectas o cuenta no confirmada."); 
                cw.mostrarLogin(); // Volver a mostrar el login si falla
            }
        },
        error:function(xhr, textStatus, errorThrown) {
            console.log("Status: " + textStatus);
            console.log("Error: " + errorThrown);
            cw.mostrarMensaje("Error de conexión con el servidor.");
        },
        contentType: 'application/json'
    });
} 

}