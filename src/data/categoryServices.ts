export interface ServiceOption {
  name: string;
  description: string;
}

export const categoryServicesMap: Record<string, ServiceOption[]> = {
  "Handyman": [
    { name: "Instalación de muebles", description: "Armado e instalación de muebles, estantes y gabinetes" },
    { name: "Colgar cuadros y TV", description: "Montaje seguro de cuadros, espejos y televisores" },
    { name: "Reparación de puertas", description: "Ajuste, reparación y cambio de puertas" },
    { name: "Instalación de repisas", description: "Colocación de repisas y estanterías" },
    { name: "Instalación de cortinas", description: "Montaje de barras y colocación de cortinas" },
    { name: "Otros servicios", description: "Describe el servicio que necesitas" }
  ],
  "Electricidad": [
    { name: "Instalación de enchufes", description: "Instalación y cambio de tomacorrientes" },
    { name: "Cambio de interruptores", description: "Reemplazo de interruptores y apagadores" },
    { name: "Instalación de lámparas", description: "Colocación de lámparas y luminarias" },
    { name: "Reparación de breakers", description: "Revisión y cambio de interruptores automáticos" },
    { name: "Instalación de ventiladores", description: "Montaje de ventiladores de techo" },
    { name: "Otros servicios", description: "Describe el servicio que necesitas" }
  ],
  "Fontanería": [
    { name: "Reparación de grifos", description: "Arreglo de llaves y grifos con fugas" },
    { name: "Destape de cañerías", description: "Limpieza y destape de tuberías obstruidas" },
    { name: "Reparación de inodoros", description: "Arreglo de fallas en sanitarios" },
    { name: "Instalación de regaderas", description: "Montaje de regaderas y duchas" },
    { name: "Reparación de fugas", description: "Detección y reparación de fugas de agua" },
    { name: "Otros servicios", description: "Describe el servicio que necesitas" }
  ],
  "Auto y Lavado": [
    { name: "Lavado básico", description: "Lavado exterior del vehículo" },
    { name: "Lavado premium", description: "Lavado completo exterior e interior" },
    { name: "Pulido y encerado", description: "Pulido y protección de pintura" },
    { name: "Lavado de tapicería", description: "Limpieza profunda de asientos y tapiz" },
    { name: "Cambio de batería", description: "Reemplazo de batería de vehículo" },
    { name: "Otros servicios", description: "Describe el servicio que necesitas" }
  ],
  "Medusa Energy": [
    { name: "Instalación de cargadores eléctricos", description: "Instalación de estaciones de carga para vehículos eléctricos" },
    { name: "Paneles solares", description: "Instalación de sistemas de energía solar" },
    { name: "Otros servicios", description: "Describe el servicio que necesitas" }
  ]
};
