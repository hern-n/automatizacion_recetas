const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configura tus claves
const SUPABASE_URL = 'https://pxglljjronhffzppedqt.supabase.co';
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InB4Z2xsampyb25oZmZ6cHBlZHF0Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0OTIxNTg4NSwiZXhwIjoyMDY0NzkxODg1fQ.EjVlGO4oOfFbzz2hhJjGV-7RGzy-tkrm4f6CcPJEl-E"
const STORAGE_BUCKET = 'imagenes-recetas';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

function formatearNombreCarpeta(nombre) {
    let nombreFormateado = nombre.toLowerCase();
    nombreFormateado = nombreFormateado.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    nombreFormateado = nombreFormateado.replace(/ñ/g, "n");
    nombreFormateado = nombreFormateado.replace(/\s+/g, "_");
    nombreFormateado = nombreFormateado.replace(/[^a-z0-9_]/g, "");
    return nombreFormateado;
}

async function subirImagen(nombreReceta, filePath) {
    const fileExt = path.extname(filePath);
    const fileName = path.basename(filePath, fileExt);
    const fileBuffer = fs.readFileSync(filePath);

    // Detectar mime type básico con extensión
    const mimeType = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.webp': 'image/webp',
        '.gif': 'image/gif'
    }[fileExt.toLowerCase()] || 'application/octet-stream';

    const nombreCarpeta = formatearNombreCarpeta(nombreReceta);
    const filePathInBucket = `${nombreCarpeta}/${fileName}${fileExt}`;

    const { error } = await supabase.storage
        .from(STORAGE_BUCKET)
        .upload(filePathInBucket, fileBuffer, {
            contentType: mimeType,
            upsert: true,
        });

    if (error) {
        throw new Error(`❌ Error subiendo imagen ${filePath}: ${error.message}`);
    }

    const { data } = supabase.storage
        .from(STORAGE_BUCKET)
        .getPublicUrl(filePathInBucket);

    return data.publicUrl;
}

async function insertarRecetaEnBD(receta, urlsImagenes) {
    // Obtener el id máximo actual
    const { data: maxIdData, error: maxIdError } = await supabase
        .from('recetas')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)
        .single();

    if (maxIdError && maxIdError.code !== 'PGRST116') { 
        // Ignorar error si no hay filas
        throw new Error(`❌ Error obteniendo máximo id: ${maxIdError.message}`);
    }

    const nuevoId = maxIdData ? maxIdData.id + 1 : 1;

    const { error } = await supabase
        .from('recetas')
        .insert([
            {
                id: nuevoId,
                titulo: receta.titulo,
                tiempo_preparacion: receta.tiempo_preparacion || null,
                raciones: receta.raciones || null,
                ingredientes: receta.ingredientes || null,
                pasos: receta.pasos || null,
                categoria: receta.categoria || null,
                fotos: urlsImagenes || null,
                video: receta.video || null,
                utensilios: receta.utensilios || null
            }
        ]);

    if (error) {
        throw new Error(`❌ Error insertando receta en la base de datos: ${error.message}`);
    }

    console.log(`✅ Receta "${receta.titulo}" insertada con éxito con id ${nuevoId}.`);
}

async function procesarReceta(receta) {
    const imagenesSubidas = [];

    for (const imagenPathRelativo of receta.imagenes) {
        const rutaImagen = path.resolve(imagenPathRelativo);

        if (!fs.existsSync(rutaImagen)) {
            console.warn(`⚠️ Imagen no encontrada: ${rutaImagen}, se omitirá.`);
            continue;
        }

        const url = await subirImagen(receta.titulo, rutaImagen);
        imagenesSubidas.push(url);
    }

    await insertarRecetaEnBD(receta, imagenesSubidas);
}

// 🧪 Aquí defines tu receta
const receta = {
    titulo: 'Tortilla Española',
    tiempo_preparacion: '30 minutos',
    raciones: '4 personas',
    ingredientes: ['Huevos', 'Patatas', 'Cebolla', 'Aceite de oliva', 'Sal'],
    pasos: [
        'Pelar y cortar las patatas.',
        'Freír las patatas y la cebolla.',
        'Batir los huevos y mezclar todo.',
        'Cuajar en una sartén por ambos lados.'
    ],
    categoria: 'Plato principal',
    imagenes: ['./images/tortilla1.webp', './images/tortilla2.jpg'],
    video: 'https://www.youtube.com/watch?v=abcd1234',
    utensilios: {
        'Espátula': 'https://example.com',
        'Bol': 'https://example.com'
    }
};

// Ejecutar
procesarReceta(receta)
    .then(() => console.log('🎉 Receta procesada completamente.'))
    .catch(err => console.error(err.message));
