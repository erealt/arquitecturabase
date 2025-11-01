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
                     } }); }
}
 module.exports.CAD=CAD;