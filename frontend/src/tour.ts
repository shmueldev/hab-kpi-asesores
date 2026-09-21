export const TOUR_KEY = 'kpi_tour_done'

export function resetTour() {
  localStorage.removeItem(TOUR_KEY)
}
