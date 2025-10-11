const modelo = require("./modelo.js");

describe('El sistema', function() { 
  let sistema;
  beforeEach(function() {
    sistema = new modelo.Sistema();
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