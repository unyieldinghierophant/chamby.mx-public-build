

## Update "¿Cómo funciona?" to reflect new flow

### What changes
Replace the 4 current steps with 5 new steps that match the actual booking lifecycle:

| Step | Title | Description | Icon |
|------|-------|-------------|------|
| 1 | Busca tu servicio | Describe lo que necesitas y nuestra IA encuentra el servicio ideal para ti | MagnifyingGlass |
| 2 | Agenda tu visita | Elige fecha, sube fotos y agenda una visita de diagnóstico con un profesional | CalendarCheck |
| 3 | Recibe tu cotización | El profesional evalúa el trabajo y te envía una cotización detallada | Receipt |
| 4 | Se realiza el trabajo | Una vez aprobada la cotización, el profesional completa el servicio | Wrench |
| 5 | Paga y listo | Paga de forma segura por la plataforma y califica al profesional | CheckCircle |

### File: `src/components/HowItWorks.tsx`

1. Replace the `steps` array with the 5 new steps above
2. Update icon imports from `@phosphor-icons/react` accordingly
3. Change grid from `lg:grid-cols-4` to `lg:grid-cols-5`
4. Update header subtitle to match the new flow description
5. Keep the CTA section at the bottom as-is

