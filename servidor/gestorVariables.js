const {SecretManagerServiceClient} = require('@google-cloud/secret-manager');

// Secret Manager client
const client = new SecretManagerServiceClient();

// Generic secret accessor. Expects the secret short name (e.g. 'CLAVECORREO' or 'CORREO')
async function accessSecret(secretShortName) {
    const projectId = '953223894653';
    if (!projectId) {
        throw new Error('ID de proyecto GCP no configurado. Establece la variable de entorno GCP_PROJECT_ID o GOOGLE_CLOUD_PROJECT.');
    }
    const name = `projects/${projectId}/secrets/${secretShortName}/versions/1`;
    const [version] = await client.accessSecretVersion({ name });
    const datos = version.payload && version.payload.data ? version.payload.data.toString('utf8') : '';
    return datos;
}

async function accessCLAVECORREO(){
    return await accessSecret('CLAVECORREO');
}

async function accessCORREO(){
    return await accessSecret('CORREO');
}

// Nuevo accessor para la secreta que contiene el 'user' (correo de autenticación)
async function accessUSER(){
    return await accessSecret('USER');
}

// Callback-style API (keeps compatibility with given example)
module.exports.obtenerOptions = async function(callback){
    const options = { user: '', pass: '' };
    try{
        options.user = await accessUSER();
    }catch(e){
        console.error('No se encontró la secreta USER (o falló su lectura), intentando CORREO:', e && e.message ? e.message : e);
        try{ options.user = await accessCORREO(); }catch(e2){ console.error('Error leyendo el secreto CORREO:', e2.message || e2); }
    }
    try{ options.pass = await accessCLAVECORREO(); }catch(e){ console.error('Error leyendo el secreto CLAVECORREO:', e.message || e); }
    callback(options);
};

// Promise-style API for convenience
module.exports.obtenerOptionsAsync = async function(){
    const options = { user: '', pass: '' };
    // Preferir la nueva secreta 'USER' si existe; si falla, fallback a 'CORREO' para compatibilidad
    options.user = await accessUSER().catch(async (e)=>{
        console.error('No se encontró la secreta USER (o falló su lectura), intentando CORREO:', e && e.message ? e.message : e);
        return await accessCORREO().catch(e2=>{ console.error('Error leyendo CORREO', e2); return ''; });
    });
    options.pass = await accessCLAVECORREO().catch(e=>{ console.error('Error leyendo CLAVECORREO', e); return ''; });
    return options;
};

// export lower-level helper for tests/debugging
module.exports._accessSecret = accessSecret;