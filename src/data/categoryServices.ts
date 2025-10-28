export interface ServiceOption {
  name: string;
  description: string;
}

export const categoryServicesMap: Record<string, ServiceOption[]> = {
  "Handyman": [
    { name: "Instalación de muebles", description: "Armado e instalación de muebles, estantes y gabinetes" },
    { name: "Colgar cuadros y TV", description: "Montaje seguro de cuadros, espejos y televisores" },
    { name: "Reparación de puertas", description: "Ajuste, reparación y cambio de puertas" },
    { name: "Reparación de ventanas", description: "Arreglo de ventanas, cambio de vidrios y ajustes" },
    { name: "Instalación de repisas", description: "Colocación de repisas y estanterías" },
    { name: "Instalación de cortinas", description: "Montaje de barras y colocación de cortinas" },
    { name: "Reparación de cerraduras", description: "Cambio y reparación de chapas y cerraduras" },
    { name: "Mantenimiento general", description: "Reparaciones menores del hogar" },
    { name: "Pintura menor", description: "Retoques y pintura de paredes y espacios pequeños" },
    { name: "Sellado de grietas", description: "Sellado de grietas en paredes y techos" }
  ],
  "Electricidad": [
    { name: "Instalación de enchufes", description: "Instalación y cambio de tomacorrientes" },
    { name: "Cambio de interruptores", description: "Reemplazo de interruptores y apagadores" },
    { name: "Instalación de lámparas", description: "Colocación de lámparas y luminarias" },
    { name: "Reparación de breakers", description: "Revisión y cambio de interruptores automáticos" },
    { name: "Cableado eléctrico", description: "Instalación y reparación de cableado" },
    { name: "Instalación de ventiladores", description: "Montaje de ventiladores de techo" },
    { name: "Cambio de tablero eléctrico", description: "Actualización de tableros y paneles eléctricos" },
    { name: "Instalación de timbres", description: "Colocación de timbres y sistemas de llamada" },
    { name: "Revisión eléctrica general", description: "Inspección completa del sistema eléctrico" },
    { name: "Instalación de reflectores", description: "Montaje de reflectores y luces exteriores" }
  ],
  "Plomería": [
    { name: "Reparación de grifos", description: "Arreglo de llaves y grifos con fugas" },
    { name: "Destape de cañerías", description: "Limpieza y destape de tuberías obstruidas" },
    { name: "Instalación de lavamanos", description: "Colocación de lavabos y accesorios" },
    { name: "Reparación de inodoros", description: "Arreglo de fallas en sanitarios" },
    { name: "Cambio de tuberías", description: "Reemplazo de tubería dañada o vieja" },
    { name: "Instalación de regaderas", description: "Montaje de regaderas y duchas" },
    { name: "Reparación de fugas", description: "Detección y reparación de fugas de agua" },
    { name: "Mantenimiento de tanques", description: "Limpieza y reparación de tinacos y tanques" },
    { name: "Instalación de lavadoras", description: "Conexión hidráulica de lavadoras" },
    { name: "Limpieza de drenajes", description: "Mantenimiento y limpieza de drenajes" }
  ],
  "Auto y lavado": [
    { name: "Lavado básico", description: "Lavado exterior del vehículo" },
    { name: "Lavado premium", description: "Lavado completo exterior e interior" },
    { name: "Pulido y encerado", description: "Pulido y protección de pintura" },
    { name: "Limpieza de motor", description: "Lavado y desengrase del motor" },
    { name: "Lavado de tapicería", description: "Limpieza profunda de asientos y tapiz" },
    { name: "Limpieza profunda interior", description: "Detallado completo del interior" },
    { name: "Detallado completo", description: "Servicio de detallado premium completo" },
    { name: "Lavado de llantas", description: "Limpieza y abrillantado de llantas" },
    { name: "Eliminación de olores", description: "Sanitización y eliminación de malos olores" },
    { name: "Lavado express", description: "Lavado rápido exterior" }
  ]
};
