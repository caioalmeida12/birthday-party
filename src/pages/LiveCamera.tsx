import { Navigate } from 'react-router-dom'

/** Rota antiga do QR / deep link — foto unificada em /fotos. */
export function LiveCamera() {
  return <Navigate to="/fotos" replace />
}
