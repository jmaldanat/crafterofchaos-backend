# Uso de curl para actualizar productos en lote

Puedes actualizar o insertar productos en tu API usando el endpoint PUT `/products` con curl y un archivo JSON.

## 1. Prepara tu archivo JSON

Crea un archivo llamado `productos.json` con el siguiente formato:

```json
[
  {
    "image": "https://m.media-amazon.com/images/I/81gCVPDAqXL._AC_UL1500_.jpg",
    "title": "Hot Wheels Mazda MX-5 Miata, HW Dream Garage 2/5 [Gris] 1/250",
    "price": "54500",
    "code": "MTL25020106677",
    "category": "Mattel",
    "tags": "Mazda,Miata,HotWheels,Garage,Gris,Diecast,Autos",
    "asin": "B0DS1L4QLJ"
  },
  {
    "image": "https://m.media-amazon.com/images/I/51zw3XSMZtL._AC_UL1500_.jpg",
    "title": "Hot Wheels Nissan Skyline 2000GT-R LBWK (púrpura) Tooned HW J-Imports 1/5",
    "price": "52800",
    "code": "MTL25020115977",
    "category": "Mattel",
    "tags": "Nissan,Skyline,HotWheels,LBWK,Púrpura,Diecast,Autos",
    "asin": "B0DPNPL84L"
  }
]
```

## 2. Ejecuta el comando curl

Abre tu terminal y ejecuta el siguiente comando (reemplaza `my-api-key-test` por tu API key real):

```powershell
curl -X PUT "http://localhost:8787/products" `
  -H "Content-Type: application/json" `
  -H "x-api-key: my-api-key-test" `
  -d "@productos.json"
```

## 3. ¿Qué sucede?

- Los productos del archivo se insertan o actualizan en la base de datos.
- Los tags se procesan y asocian a cada producto.
- Los productos que no estén en el archivo serán marcados como `disponible: false`.
- Recibirás un reporte con estadísticas de la operación.

## 4. Recomendaciones

- Asegúrate de que el servidor esté corriendo en el puerto correcto.
- El archivo JSON debe estar bien formado y contener los campos requeridos.
- La API key debe coincidir con la configurada en tu entorno.
