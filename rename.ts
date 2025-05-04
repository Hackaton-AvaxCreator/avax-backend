const fs = require('fs').promises;
const path = require('path');

async function renameJsToTsRecursive(directoryPath) {
    try {
        // Leer todos los archivos y directorios
        const items = await fs.readdir(directoryPath, { withFileTypes: true });
        let renamedCount = 0;

        for (const item of items) {
            const fullPath = path.join(directoryPath, item.name);

            if (item.isDirectory()) {
                // Si es un directorio, llamada recursiva
                renamedCount += await renameJsToTsRecursive(fullPath);
            } else if (item.isFile() && item.name.endsWith('.js')) {
                // Si es un archivo .js, renombrarlo
                const newPath = path.join(directoryPath, item.name.replace('.js', '.ts'));
                await fs.rename(fullPath, newPath);
                console.log(`Renombrado: ${fullPath} -> ${newPath}`);
                renamedCount++;
            }
        }

        return renamedCount;
    } catch (error) {
        console.error(`Error al procesar ${directoryPath}:`, error);
        return 0;
    }
}

// Función principal
async function main() {
    // Ruta de la carpeta src (ajusta según tu estructura)
    const srcPath = path.join(__dirname, 'src');

    try {
        console.log('Iniciando proceso de renombrado recursivo...');
        const totalRenamed = await renameJsToTsRecursive(srcPath);
        console.log(`\n¡Proceso completado! Se renombraron ${totalRenamed} archivos en total.`);
    } catch (error) {
        console.error('Error general:', error);
    }
}

// Ejecutar el script
main();