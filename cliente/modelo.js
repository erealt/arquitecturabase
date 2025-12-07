// Modelo ligero para pruebas en navegador (cliente/test-modelo.html)
function Sistema(test){
    // Si se llama con true, activamos el modo test (memoria)
    this.test = !!test;
    this.usuarios = {};
    this.partidas = {};

    // Registrar usuario (acepta objeto con email, nick opcional)
    this.registrarUsuario = function(obj, callback){
        if (!obj) return callback({ email: -1 });
        const nick = obj.nick || obj.email;
        if (this.usuarios[nick]){
            // ya existe
            return callback({ email: -1 });
        }
        // Guardar usuario mínimo
        this.usuarios[nick] = { email: obj.email, nick: nick, nombre: obj.nombre || '', password: obj.password || '' };
        return callback({ email: obj.email });
    };

    this.agregarUsuario = function(usuario){
        // Si se pasa una instancia Usuario o un nick
        let nick = typeof usuario === 'string' ? usuario : (usuario.nick || usuario.email);
        if (!nick) return { nick: -1 };
        if (!this.usuarios[nick]){
            const userObj = { nick: nick, email: (usuario && usuario.email) || nick };
            // Guardar por nick y por email para facilitar búsquedas
            this.usuarios[nick] = userObj;
            if (userObj.email) this.usuarios[userObj.email] = userObj;
            return { nick: nick };
        }
        return { nick: -1 };
    };

    this.usuarioGoogle = function(usr, callback){
        // Si existe por email, devolver, si no, crear
        for (let k in this.usuarios){ if (this.usuarios[k].email === usr.email) return callback(this.usuarios[k]); }
        const nick = usr.email;
        this.usuarios[nick] = { email: usr.email, nick: nick };
        return callback(this.usuarios[nick]);
    };

    this.obtenerUsuario = function(){ return this.usuarios; };

    this.usuarioActivo = function(nick){ return { activo: this.usuarios.hasOwnProperty(nick) }; };

    this.eliminarUsuario = function(nick){ delete this.usuarios[nick]; };

    this.numeroUsuarios = function(){ return Object.keys(this.usuarios).length; };

    this.loginUsuario = function(obj, callback){
        // Simple: buscar por email
        for (let k in this.usuarios){ if (this.usuarios[k].email === obj.email) return callback(this.usuarios[k]); }
        return callback({ email: -1 });
    };

    this.confirmarUsuario = function(obj, callback){ callback({ email: -1 }); };

    this.crearPartida = function(email){
        let usr = this.usuarios[email];
        if (usr){
        let codigo = this.obtenerCodigo(); 
        let partida = new Partida(codigo);
        partida.jugadores.push(email);
        this.partidas[codigo] = partida;
        return codigo;
    }
    return -1;
};
    this.obtenerCodigo = function(){
        let codigo = (Math.random() * 999999).toFixed(0);
        while (this.partidas[codigo]) {
            codigo = (Math.random() * 999999).toFixed(0);
        }
        
        return codigo.toString();
    };
   // En servidor/modelo.js (Dentro de function Sistema())

this.unirAPartida=function(email,codigo){
    // 1. obtener el usuario cuyo email es “email”
    let usr = this.usuarios[email]; 
    
    // 2. obtener la partida cuyo código es “codigo”
    let partida = this.partidas[codigo]; 
    
    // 3. si existen el usuario y la partida, entonces
    if (usr && partida){
        // Comprobar si el usuario ya está en la partida
        if (partida.jugadores.includes(email)) {
            console.log("El usuario " + email + " ya está en la partida " + codigo);
            return partida;
        }
        
        // Comprobar si hay espacio
        if (partida.jugadores.length < partida.maxJug) {
            // Asignar al usuario a la partida
            partida.jugadores.push(email); 
            console.log("Usuario " + email + " unido a partida " + codigo);
            return partida; // Devolver la partida actualizada
        } else {
            // en caso contrario, mostrar un mensaje (Partida llena)
            console.log("Partida " + codigo + " está llena. No se pudo unir.");
            return -2; // Indicador de Partida Llena
        }
    }
    
    // en caso contrario, mostrar un mensaje (Usuario o código inválido)
    console.log("No se pudo unir a la partida: usuario o código inválido.");
    return -1; // Indicador de error genérico
};


this.obtenerPartidasDisponibles=function(){ 
    let lista=[]; 
    
    for(var codigo in this.partidas){ 
        let partida = this.partidas[codigo];
        
        // 1. Comprobar si la partida está disponible (tiene menos de maxJug)
        if (partida.jugadores.length < partida.maxJug) {
            
            // 2. Obtener el email del creador de la partida (el primer jugador)
            let emailCreador = partida.jugadores[0];
            
            // 3. Obtener el código de la partida
            let codigoPartida = partida.codigo;
            
            // 4. Crear un objeto JSON con esos dos datos
            let partidaJSON = {
                codigo: codigoPartida,
                creador: emailCreador
            };
            
            // 5. Meter el objeto JSON en el array lista
            lista.push(partidaJSON);
        } 
    } 
    return lista; 
};

}


function Usuario(o){
    if (typeof o === 'string'){
        this.nick = o;
        this.email = o;
    } else if (o && typeof o === 'object'){
        this.nick = o.nick || o.email;
        this.email = o.email || '';
        this.nombre = o.nombre || '';
    }
}
function Partida(codigo){
     this.codigo = codigo;
      this.jugadores = [];
       this.maxJug = 2; 
    }

// Export helpers for debug when running in node (optional)
if (typeof module !== 'undefined' && module.exports){
    module.exports = { Sistema: Sistema, Usuario: Usuario };
}


