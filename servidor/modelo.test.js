const modelo = require("./modelo.js");

xdescribe('El sistema', function() { 
  let sistema;
  beforeEach(function() {
    sistema = new modelo.Sistema({test:true});
  });
    it('inicialmente no hay usuarios', function() {
       expect(sistema.numeroUsuarios()).toEqual(0); 
      }); 
      it('agregar usuario', function() {
        sistema.agregarUsuario('ana');
        expect(sistema.numeroUsuarios()).toEqual(1);
        expect(sistema.obtenerUsuario()['ana'].nick).toEqual('ana');
      });
      it('eliminar usuario', function() {
        sistema.agregarUsuario('ana');
        sistema.eliminarUsuario('ana');
        expect(sistema.numeroUsuarios()).toEqual(0);
        expect(sistema.obtenerUsuario()['ana']).toBeUndefined();
      });
      it('obtener usuarios', function() {
        sistema.agregarUsuario('ana');
        sistema.agregarUsuario('juan');
        var usuarios = sistema.obtenerUsuario();
        expect(Object.keys(usuarios)).toContain('ana');
        expect(Object.keys(usuarios)).toContain('juan');
      });
      it('usuario activo', function() {
  sistema.agregarUsuario('ana');
  expect(sistema.usuarioActivo('ana').activo).toBe(true);
  expect(sistema.usuarioActivo('juan').activo).toBe(false);
      });
    })

  describe("Pruebas de las partidas",function(){
      let sistema;
      let usr;
      let usr2;
      let usr3; 
      beforeEach(function(){ 
        // crear un nuevo sistema de pruebas para este bloque
        sistema = new modelo.Sistema({test:true});
        usr={"nick":"Pepe","email":"pepe@pepe.es"};
        usr2={"nick":"Pepa","email":"pepa@pepa.es"};
        usr3={"nick":"Pepo","email":"pepo@pepo.es"};
      
        sistema.agregarUsuario(usr);
        sistema.agregarUsuario(usr2);
        sistema.agregarUsuario(usr3);
          });
            it("Usuarios y partidas en el sistema",function(){
               expect(sistema.numeroUsuarios()).toEqual(3); 
               expect(sistema.obtenerPartidasDisponibles().length).toEqual(0);
               });
            it("Crear partida",function(){
                let codigo=sistema.crearPartida(usr.email);
                expect(codigo.length).toBeGreaterThan(0); 
                expect(sistema.obtenerPartidasDisponibles().length).toEqual(1); 
             }); 
            it("Unir a partida",function(){
                  // 1. Crear la partida
        let codigo = sistema.crearPartida(usr.email);
        
        // 2. Unir al segundo usuario
        let partida = sistema.unirAPartida(usr2.email, codigo);
        
        // 3. Comprobar que la unión fue exitosa
        expect(partida).toBeDefined();
        expect(partida.jugadores.length).toEqual(2);
        
        // 4. Comprobar que el usuario 3 no puede unirse (partida llena)
        let resultadoFallo = sistema.unirAPartida(usr3.email, codigo);
        expect(resultadoFallo).toEqual(-2);
                 });
          it("Un usuario no puede estar dos veces",function(){
            // 1. Crear la partida
        let codigo = sistema.crearPartida(usr.email);
        
        // 2. Intentar que el mismo usuario se una de nuevo
        sistema.unirAPartida(usr.email, codigo); // No debería tener efecto
        
        // 3. Comprobar que el número de jugadores sigue siendo 1
        expect(sistema.partidas[codigo].jugadores.length).toEqual(1);
        expect(sistema.partidas[codigo].jugadores).toContain(usr.email);
           }); 
          it("Obtener partidas",function(){ 
            let codigo1 = sistema.crearPartida(usr.email); // 1 jugador (disponible)
        let codigo2 = sistema.crearPartida(usr3.email); // 1 jugador (disponible)
        
        // 1. Comprobar que hay dos partidas disponibles inicialmente
        let disponibles = sistema.obtenerPartidasDisponibles();
        expect(disponibles.length).toEqual(2);
        
        // 2. Llenar la primera partida
        sistema.unirAPartida(usr2.email, codigo1); // 2 jugadores (llena)
        
        // 3. Comprobar que solo queda una partida disponible
        disponibles = sistema.obtenerPartidasDisponibles();
        expect(disponibles.length).toEqual(1);
        
        // 4. Verificar que la partida disponible es la correcta
        expect(disponibles[0].codigo).toEqual(codigo2);
                 })
                 });