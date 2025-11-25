const nodemailer = require('nodemailer');
const url = process.env.BASE_URL || "http://localhost:3000";
const gv = require('./gestorVariables.js');

let transporter;
let fromAddress = process.env.EMAIL_USER || '';

async function initTransporter(){
    if (transporter) return transporter;
    try{
        // Prefer env vars for local development to avoid requiring GCP credentials
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS){
            fromAddress = process.env.EMAIL_USER;
            transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
            return transporter;
        }

        // If env vars are not set, try Secret Manager
        const opts = await gv.obtenerOptionsAsync();
        if (opts && opts.user && opts.pass){
            fromAddress = opts.user;
            transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: opts.user, pass: opts.pass } });
        } else {
            console.warn('No se encontraron credenciales de correo (Secret Manager o variables de entorno). Los emails fallarán hasta que se configuren.');
        }
    }catch(e){
        console.error('Error inicializando el transportador de correo:', e);
        // If Secret Manager failed, try env vars as last resort
        if (process.env.EMAIL_USER && process.env.EMAIL_PASS){
            fromAddress = process.env.EMAIL_USER;
            transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS } });
        }
    }
    return transporter;
}
// gv.obtenerOptions(function(opts){
//     fromAddress = opts.user;
//     transporter = nodemailer.createTransport({ 
//         service: 'gmail',
//          auth: opts 
//         });
// });

module.exports.enviarEmail = async function(direccion, key, men) {
    await initTransporter();
    if (!transporter) throw new Error('Transportador de correo no configurado');
    const result = await transporter.sendMail({
        from: fromAddress || 'no-reply@example.com',
        to: direccion,
        subject: men,
       text: 'Pulsa aquí para confirmar cuenta',
               html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ccc; border-radius: 5px; max-width: 600px; margin: auto;">
                    <h2 style="color: #333;">Bienvenido al Sistema</h2>
                    <p style="font-size: 16px;">¡Gracias por registrarte! Para activar tu cuenta, por favor, haz clic en el botón de abajo:</p>
                    <table width="100%" cellspacing="0" cellpadding="0">
                        <tr>
                            <td align="center" style="padding: 20px 0;">
                                <a href="${url}/confirmarUsuario/${direccion}/${key}" target="_blank"
                                   style="display: inline-block; padding: 12px 24px; font-size: 16px; color: #ffffff; background-color: #007bff; border-radius: 5px; text-decoration: none;">
                                   Pulsa aquí para confirmar cuenta
                                </a>
                            </td>
                        </tr>
                    </table>
                    <p style="font-size: 14px; color: #777;">Si tienes problemas, copia y pega el siguiente enlace en tu navegador:</p>
                    <p style="font-size: 12px; color: #999; word-break: break-all;">${url}confirmarUsuario/${direccion}/${key}</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-size: 12px; color: #aaa;">Si no te registraste en Sistema, ignora este mensaje.</p>
                </div>
               `
            }); 
    return result;
};