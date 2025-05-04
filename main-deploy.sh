#!/bin/bash

echo "Commit the changes in the git repository"
git commit -am "new dev deploy"
git push

# deploying in caprover
echo "deploying api in caprover"

# escoge la app que quieres desplegar
apps=("hack-backend")
echo "Lista de apps:"

# Mostrar la lista de aplicaciones con números
for i in "${!apps[@]}"; do
    echo "$i) ${apps[$i]}"
done

# Leer el número de la aplicación
read -p "Elige una app de la lista (0-${#apps[@]}): " app_number

# Verifica si el número de la aplicación es válido
if ! [[ "$app_number" =~ ^[0-9]+$ ]] || [ "$app_number" -lt 0 ] || [ "$app_number" -ge "${#apps[@]}" ]; then
    echo "Número de app no válido. Por favor, elige un número de la lista."
    exit 1
fi

# Asignar la aplicación seleccionada
app=${apps[$app_number]}

read -p "Do you want to deploy develop or current branch? (d/c): " env

if [ $env = "d" ]; then
    caprover deploy -h https://captain.cap.c2developers.com/ -p Mvdqfm2025 -b develop -a $app
elif [ $env = "c" ]; then
    echo 'Deploying current branch'
    current_branch=$(git branch --show-current)
    caprover deploy -h https://captain.cap.c2developers.com/ -p Mvdqfm2025 -b $current_branch -a $app
else
    echo "Opción no válida. Por favor, elige 'd' o 'c'."
    exit 1
fi
