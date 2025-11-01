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
}
 module.exports.CAD=CAD;