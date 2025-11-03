const nodemailer = require('nodemailer');
 const url="http://localhost:3000/"; 
 //const url="tu-url-de-despliegue"; 
 const transporter = nodemailer.createTransport({
     service: 'gmail', 
     auth: { 
        user: 'estelaretin10@gmail.com',
         pass: 'rkfl nfcn csle whvo' 
        } 
    });
     //send();
    module.exports.enviarEmail=async function(direccion, key,men) { 
        const result = await transporter.sendMail({
             from: 'estelaretin10@gmail.com',
              to: direccion, subject: men, 
              text: 'Pulsa aquí para confirmar cuenta',
               html: '<p>Bienvenido a Sistema</p><p><a href="'+url+'confirmarUsuario/'+direccion+'/'+key+'">Pulsa aquí para confirmar cuenta</a></p>' 
            }); 
        }
