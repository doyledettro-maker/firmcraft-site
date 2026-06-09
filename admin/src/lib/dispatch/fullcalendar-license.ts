// FullCalendar's resource-timeline view is a Premium plugin. For development we
// use the Creative-Commons non-commercial key, which unlocks the view and
// suppresses the upgrade popup (it shows a small CC notice instead). Drop the
// purchased $590 key into NEXT_PUBLIC_FULLCALENDAR_LICENSE_KEY for production.
export const FULLCALENDAR_LICENSE_KEY =
  process.env.NEXT_PUBLIC_FULLCALENDAR_LICENSE_KEY || 'CC-Attribution-NonCommercial-NoDerivatives'
