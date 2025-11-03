const mongo=require("mongodb").MongoClient;
const ObjectId=require("mongodb").ObjectId;
function CAD(){

this.usuarios;

this.conectar=async function(callback){ 
    let cad=this; 
    let client= new mongo("mongodb+srv://ert:estelitta7RT@cluster0.lavnf0l.mongodb.net/?appName=Cluster0");
     await client.connect();
      const database=client.db("sistema"); 
      cad.usuarios=database.collection("usuarios");
      callback(database);
 } 
 this.buscarOCrearUsuario=function(usr,callback){
     buscarOCrear(this.usuarios,usr,callback); } 
     function buscarOCrear(coleccion,criterio,callback) 
     { 
        coleccion.findOneAndUpdate(criterio, {$set: criterio},
             {upsert: true,returnDocument:"after",projection:{email:1}}, function(err,doc) { 
                if (err) { throw err; }
                 else {
                     console.log("Elemento actualizado");
                     console.log(doc.value.email);
                      callback({email:doc.value.email});
                     } });
                     }
    this.buscarUsuario = function (obj, callback) {
        buscar(this.usuarios, obj, callback);
    }
    this.insertarUsuario = function (usuario, callback) {
        insertar(this.usuarios, usuario, callback);
    }
    function buscar(coleccion, criterio, callback) {
        coleccion.find(criterio).toArray(function (error, usuarios) {
            if (usuarios.length == 0) {
                callback(undefined);
            }
            else {
                callback(usuarios[0]);
            }
        });
    }

    function insertar(coleccion, elemento, callback) {
        coleccion.insertOne(elemento, function (err, result) {
            if (err) {
                console.log("error");
            }
            else {
                console.log("Nuevo elemento creado");
                callback(elemento);
            }
        });
    }

}
 module.exports.CAD=CAD;