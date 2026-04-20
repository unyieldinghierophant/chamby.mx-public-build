export interface ServiceOption {
  name: string;
  description: string;
}

export const categoryServicesMap: Record<string, ServiceOption[]> = {
  "Handyman": [
    { name: "Armado de Muebles", description: "Armado e instalación de muebles, estantes y gabinetes" },
    { name: "Montaje de TV", description: "Montaje seguro de cuadros, espejos y televisores" },
    { name: "Instalaciones del hogar (TV, repisas, cortinas)", description: "Instalación de televisores, repisas, cortinas y persianas" },
    { name: "Reparación de Puertas", description: "Ajuste, reparación y cambio de puertas" },
    { name: "Repisas y Estantes", description: "Colocación de repisas y estanterías" },
    { name: "Reparaciones menores", description: "Pequeñas reparaciones y arreglos del hogar" },
    { name: "Mantenimiento general del hogar", description: "Mantenimiento preventivo y correctivo del hogar" },
    { name: "Otros Servicios", description: "Describe el servicio que necesitas" }
  ],
  "Electricidad": [
    { name: "Reparaciones eléctricas", description: "Diagnóstico y reparación de fallas eléctricas" },
    { name: "Instalación de Enchufes", description: "Instalación y cambio de tomacorrientes" },
    { name: "Interruptores", description: "Reemplazo de interruptores y apagadores" },
    { name: "Lámparas y Luces", description: "Colocación de lámparas y luminarias" },
    { name: "Ventiladores de Techo", description: "Montaje de ventiladores de techo" },
    { name: "Revisión de sistema eléctrico (centro de carga)", description: "Inspección y diagnóstico del tablero eléctrico" },
    { name: "Otros Servicios", description: "Describe el servicio que necesitas" }
  ],
  "Fontanería": [
    { name: "Reparación de fugas", description: "Localización y reparación de fugas de agua" },
    { name: "Reparación de Grifos", description: "Arreglo de llaves y grifos con fugas" },
    { name: "Destape de Cañerías", description: "Limpieza y destape de tuberías obstruidas" },
    { name: "Reparación de WC", description: "Arreglo de fallas en sanitarios" },
    { name: "Instalación de Regaderas", description: "Montaje de regaderas y duchas" },
    { name: "Reparación de boiler", description: "Servicio y reparación de calentadores de agua" },
    { name: "Reparación de sistemas de agua (bombas, tinacos)", description: "Mantenimiento y reparación de bombas y tinacos" },
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
    { name: "Poda de plantas y árboles", description: "Poda y recorte de plantas, árboles y arbustos" },
    { name: "Limpieza de jardín", description: "Limpieza y retiro de maleza, hojas y residuos" },
    { name: "Mantenimiento de áreas verdes", description: "Cuidado integral y mantenimiento de jardines y áreas verdes" },
    { name: "Diseño de Jardín", description: "Diseño y plantación de jardines" },
    { name: "Sistema de Riego", description: "Instalación de sistemas de riego" },
    { name: "Otros Servicios", description: "Describe el servicio que necesitas" }
  ],
  "Pintura": [
    { name: "Pintura interior", description: "Pintura de interiores: cuartos, salas, cocinas" },
    { name: "Pintura exterior", description: "Pintura de fachadas y exteriores" },
    { name: "Impermeabilización de techos", description: "Aplicación de impermeabilizante en azoteas y techos" },
    { name: "Reparación de humedad y filtraciones", description: "Reparación de manchas de humedad y filtraciones" },
    { name: "Otros Servicios", description: "Describe el servicio que necesitas" }
  ],
  "Electrodomésticos": [
    { name: "Mantenimiento e instalación de Aire Acondicionado", description: "Servicio, instalación y mantenimiento de aires acondicionados" },
    { name: "Reparación de licuadoras", description: "Diagnóstico y reparación de licuadoras y electrodomésticos de cocina" },
    { name: "Instalación de electrodomésticos", description: "Instalación de lavadoras, secadoras, estufas y más" },
    { name: "Reparación de lavadoras y secadoras", description: "Diagnóstico y reparación de lavadoras y secadoras" },
    { name: "Reparación de microondas", description: "Diagnóstico y reparación de microondas" },
    { name: "Otros Servicios", description: "Describe el servicio que necesitas" }
  ]
};
