# Utilizamos la imagen oficial de oven/bun como imagen base
FROM oven/bun:latest

# Establecemos el directorio de trabajo en el contenedor
WORKDIR /app

# Copiamos los archivos de nuestro proyecto al contenedor
COPY . .

# add zip command
RUN apt-get update && apt-get install -y zip
# Instalamos las dependencias de nuestro proyecto usando bun
RUN bun pm cache rm --all
RUN bun install

# Expone el puerto en el que tu aplicación estará escuchando
EXPOSE 3010

# El comando para iniciar tu aplicación
CMD ["bun", "start"]