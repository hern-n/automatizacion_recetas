# Automatización de Recetas

Node.js script for automating the upload of recipe images to Supabase Storage and inserting recipe data into a Supabase database.

## Stack

| Component | Technology |
|-----------|-----------|
| Runtime | Node.js |
| Client | Supabase JS SDK |
| Storage | Supabase Storage (bucket: `imagenes-recetas`) |
| Database | Supabase (PostgreSQL) |
| Package Manager | pnpm |

## Features

- **Image Upload**: Uploads recipe images to Supabase Storage with automatic folder naming
- **Database Insertion**: Creates recipe records in the `recetas` table with all metadata
- **Folder Name Formatting**: Converts recipe titles to lowercase, removes accents, replaces spaces with underscores
- **MIME Type Detection**: Automatically detects image types (jpg, png, webp, gif)
- **Upsert Support**: Can overwrite existing images

## Usage

### Setup

```bash
pnpm install
```

Create a `.env` file:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your_service_role_key
```

### Run

Edit the recipe data in `up.js` (around line 116) with your recipe details, then:

```bash
node up.js
```

### Recipe Data Format

```javascript
const receta = {
    titulo: 'Tortilla Española',
    tiempo_preparacion: '30 minutos',
    raciones: '4 personas',
    ingredientes: ['Huevos', 'Patatas', 'Cebolla', 'Aceite', 'Sal'],
    pasos: ['Paso 1...', 'Paso 2...'],
    categoria: 'Plato principal',
    imagenes: ['./images/foto1.jpg', './images/foto2.jpg'],
    video: 'https://youtube.com/watch?v=...',
    utensilios: { 'Espátula': 'https://...' }
};
```

### Image Folder Structure

Images are stored in Supabase Storage as:
```
imagenes-recetas/{nombre_receta_formateado}/{archivo_original}
```

Example: `imagenes-recetas/tortilla_espanola/foto1.jpg`

## Project Structure

```
automatizacion_recetas/
├── up.js                # Main automation script
├── images/              # Local recipe images
├── .env                 # Supabase credentials
├── package.json
└── pnpm-lock.yaml
```

## License

MIT
