function ClienteRest(){
    this.agregarUsuario=function(nick){ 
        var cli=this; 
        $.getJSON("/agregarUsuario/"+nick,function(data){
             let msg="El nick "+nick+" está ocupado";
              if (data.nick!=-1){
                 console.log("Usuario "+nick+" ha sido registrado");
                  msg="Bienvenido al sistema, "+nick; localStorage.setItem("nick",nick); 
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
}