export interface ServiceOption {
  name: string;
  description: string;
}

export const categoryServicesMap: Record<string, ServiceOption[]> = {
  "Handyman": [
    { name: "Armado de Muebles", description: "Armado e instalación de muebles, estantes y gabinetes" },
    { name: "Montaje de TV", description: "Montaje seguro de cuadros, espejos y televisores" },
    { name: "Reparación de Puertas", description: "Ajuste, reparación y cambio de puertas" },
    { name: "Repisas y Estantes", description: "Colocación de repisas y estanterías" },
    { name: "Otros Servicios", description: "Describe el servicio que necesitas" }
  ],
  "Electricidad": [
    { name: "Instalación de Enchufes", description: "Instalación y cambio de tomacorrientes" },
    { name: "Interruptores", description: "Reemplazo de interruptores y apagadores" },
    { name: "Lámparas y Luces", description: "Colocación de lámparas y luminarias" },
    { name: "Ventiladores de Techo", description: "Montaje de ventiladores de techo" },
    { name: "Otros Servicios", description: "Describe el servicio que necesitas" }
  ],
  "Fontanería": [
    { name: "Reparación de Grifos", description: "Arreglo de llaves y grifos con fugas" },
    { name: "Destape de Cañerías", description: "Limpieza y destape de tuberías obstruidas" },
    { name: "Reparación de WC", description: "Arreglo de fallas en sanitarios" },
    { name: "Instalación de Regaderas", description: "Montaje de regaderas y duchas" },
    { name: "Otros Servicios", description: "Describe el servicio que necesitas" }
  ],
  "Auto y Lavado": [
    { name: "Lavado Básico", description: "Lavado exterior del vehículo" },
    { name: "Lavado Premium", description: "Lavado completo exterior e interior" },
    { name: "Pulido y Encerado", description: "Pulido y protección de pintura" },
    { name: "Limpieza de Tapicería", description: "Limpieza profunda de asientos y tapiz" },
    { name: "Otros Servicios", description: "Describe el servicio que necesitas" }
  ],
  "Limpieza": [
    { name: "Limpieza General", description: "Limpieza completa de hogar u oficina" },
    { name: "Limpieza Profunda", description: "Limpieza a detalle de espacios" },
    { name: "Limpieza de Cocina", description: "Desengrase y limpieza de cocina" },
    { name: "Limpieza de Baños", description: "Sanitización de baños" },
    { name: "Retiro de Escombro y Basura", description: "Retiro de escombro, basura, chatarra y desechos de casa u obra" },
    { name: "Otros Servicios", description: "Describe el servicio que necesitas" }
  ],
  "Jardinería": [
    { name: "Corte de Césped", description: "Corte y mantenimiento de pasto" },
    { name: "Poda de Árboles", description: "Poda y recorte de árboles y arbustos" },
    { name: "Diseño de Jardín", description: "Diseño y plantación de jardines" },
    { name: "Sistema de Riego", description: "Instalación de sistemas de riego" },
    { name: "Otros Servicios", description: "Describe el servicio que necesitas" }
  ]
};
