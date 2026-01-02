const mongo=require("mongodb").MongoClient;
const ObjectId=require("mongodb").ObjectId;
function CAD(){

this.usuarios;
this.rankings;

this.conectar=async function(callback){ 
    let cad=this; 
    let client= new mongo(process.env.connectionString);
     await client.connect();
      const database=client.db("sistema"); 
    cad.usuarios=database.collection("usuarios");
    cad.rankings=database.collection("rankingParejas");
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
    this.insertarResultadoPareja = function (registro, callback) {
        if (!this.rankings) {
            if (callback) {
                callback(null);
            }
            return;
        }
        insertar(this.rankings, registro, callback);
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
    this.obtenerTopParejas = function (limite, callback) {
        if (!this.rankings) {
            if (callback) {
                callback([]);
            }
            return;
        }
        const max = typeof limite === "number" && limite > 0 ? limite : 5;
        this.rankings.find({}).sort({ tiempo: 1, fecha: 1 }).limit(max).toArray(function (err, docs) {
            if (err) {
                console.log("error");
                if (callback) {
                    callback([]);
                }
            } else if (callback) {
                callback(docs);
            }
        });
    }
    this.actualizarUsuario=function(obj,callback){
         actualizar(this.usuarios,obj,callback); }
        function actualizar(coleccion,obj,callback){ 
            coleccion.findOneAndUpdate({_id:ObjectId(obj._id)}, {$set: obj},
             {upsert: false,returnDocument:"after",projection:{email:1}}, function(err,doc) 
             { if (err) { 
                throw err; 
            }else {
                 console.log("Elemento actualizado"); 
                 callback({email:doc.value.email});
                 } }); 
                }

}
 module.exports.CAD=CAD;