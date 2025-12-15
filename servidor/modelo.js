const datos = require("./cad.js");
const correo = require("./emails.js");
const bcrypt = require('bcrypt');
function Sistema(test) {
    this.cad = new datos.CAD();
    if (!test.test) {
        this.cad.conectar(function (db) {
            console.log("Conectado a Mongo Atlas");
        });
    }
    this.usuarios = {};

    this.partidas = {};
    this.usuariosPorEmail = {};


    this.registrarUsuario = function (obj, callback) {
        let modelo = this;
        if (!obj.nick) {
            obj.nick = obj.email;
        }
        this.cad.buscarUsuario({ "email": obj.email }, async function (usr) {
            if (!usr) { //el usuario no existe, luego lo puedo registrar 
                const hash = await bcrypt.hash(obj.password, 10); // Genera el hash de forma asíncrona
                obj.password = hash;
                obj.key = Date.now().toString();
                obj.confirmada = false;

                modelo.cad.insertarUsuario(obj, function (res) {
                    // Indexar usuario por email en memoria
                    if (res && res.email) {
                        modelo.usuariosPorEmail[res.email] = res;
                    }
                    callback(res);
                });
                correo.enviarEmail(obj.email, obj.key, "Confirmar cuenta");
            } else {
                callback({ "email": -1 });
            }
        });
    }

    //  this.agregarUsuario=function(nick){ 
    //    let res={"nick":-1};
    //     if (!this.usuarios[nick]){
    //          this.usuarios[nick]=new Usuario(nick);
    //           res.nick=nick; 
    //         } else{
    //              console.log("el nick "+nick+" está en uso"); 
    //             }
    //     return res;
    // }
    this.agregarUsuario = function (datos) { // Renombramos a 'datos' para ser genérico
        let clave;
        let res = { "nick": -1 };

        // 1. Determinar la clave de usuario (email si es objeto, o el string si es solo nick)
        if (typeof datos === 'string') {
            clave = datos; // Soporte para el formato antiguo: sistema.agregarUsuario('ana')
        } else if (datos && typeof datos === 'object' && datos.email) {
            clave = datos.email; // CLAVE: Usar el email como identificador único
        } else {
            return res; // Devuelve error si no hay datos válidos
        }

        // 2. Comprobar si la clave ya está en uso
        if (!this.usuarios[clave]) {
            // Crear la instancia de Usuario con los datos completos
            this.usuarios[clave] = new Usuario(datos);
            res.nick = clave; // Devolver la clave utilizada
        } else {
            // Usamos la clave correcta en el log
            console.log("el nick " + clave + " está en uso");
        }
        return res;
    }
    this.usuarioGoogle = function (usr, callback) {
        let self = this;
        this.cad.buscarOCrearUsuario(usr, function (obj) {
            if (obj && obj.email && obj.email !== -1) {
                self.agregarUsuario(obj);
            }
            callback(obj);
        });
    }
    this.obtenerUsuario = function () {
        return this.usuarios;
    }
    this.usuarioActivo = function (nick) {
        return { activo: this.usuarios.hasOwnProperty(nick) };
    }
    this.eliminarUsuario = function (nick) {
        delete this.usuarios[nick];
    }
    this.numeroUsuarios = function () {
        return Object.keys(this.usuarios).length;
    }
    this.loginUsuario = function (obj, callback) {
        let self = this;
        this.cad.buscarUsuario({ "email": obj.email, "confirmada": true }, function (usr) {
            if (usr) {
                // Compara la contraseña que llega (texto plano) con el hash guardado (usr.password)
                bcrypt.compare(obj.password, usr.password, function (err, result) {
                    if (result) {
                        // Las contraseñas coinciden
                        self.agregarUsuario(usr);
                        callback(usr);
                    } else {
                        // Las contraseñas NO coinciden
                        callback({ "email": -1 });
                    }
                });
            } else {
                // Usuario no encontrado o no confirmado
                callback({ "email": -1 });
            }
        });
    }

    this.confirmarUsuario = function (obj, callback) {
        let modelo = this; this.cad.buscarUsuario({ "email": obj.email, "confirmada": false, "key": obj.key }, function (usr) {
            if (usr) {
                usr.confirmada = true; modelo.cad.actualizarUsuario(usr, function (res) {
                    callback({ "email": res.email }); //callback(res)
                })
            } else {
                callback({ "email": -1 });
            }
        })
    };

    this.crearPartida = function (email) {
        let usr = this.usuarios[email];
        if (usr) {
            let codigo = this.obtenerCodigo();
            let partida = new Partida(codigo);
            partida.jugadores.push(email);
            this.partidas[codigo] = partida;
            return codigo;
        }
        return -1;
    };
    this.obtenerCodigo = function () {
        let codigo = (Math.random() * 999999).toFixed(0);
        while (this.partidas[codigo]) {
            codigo = (Math.random() * 999999).toFixed(0);
        }

        return codigo.toString();
    };


    this.unirAPartida = function (email, codigo) {
        // 1. obtener el usuario cuyo email es “email”
        let usr = this.usuarios[email];

        // 2. obtener la partida cuyo código es “codigo”
        let partida = this.partidas[codigo];

        // 3. si existen el usuario y la partida, entonces
        if (usr && partida) {
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


    this.obtenerPartidasDisponibles = function () {
        let lista = [];

        for (var codigo in this.partidas) {
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
    this.iniciarPartida = function (codigo) {
    // 1. Buscar la partida
    let partida = this.partidas[codigo]; 

    if (partida) {
        // 2. Verificar estado (Opcional, pero recomendado)
        // if (partida.estado === "Lista") { ... } 
        
        // 3. Cambiar el estado
        partida.estado = "EnJuego";
        console.log(`Sistema: Partida ${codigo} cambiada a estado 'EnJuego'.`);
        
        // 4. Devolver la partida
        return partida;
    } else {
        console.error(`Sistema: No se encontró la partida con código ${codigo}.`);
        return -1; // O maneja el error según tu convención
    }
};
}
function Usuario(o) {
    if (typeof o === 'string') {
        this.nick = o;
        this.email = o;
    } else if (o && typeof o === 'object') {
        this.nick = o.nick || o.email;
        this.email = o.email || '';
        this.nombre = o.nombre || '';
    }
}
function Partida(codigo) {
    this.codigo = codigo;
    this.jugadores = [];
    this.maxJug = 2;
    
}

module.exports = {
    Sistema: Sistema,
    Usuario: Usuario
};


