import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { Anfitriao } from './pages/Anfitriao'
import { Chat } from './pages/Chat'
import { Home } from './pages/Home'
import { Photos } from './pages/Photos'
import { Songs } from './pages/Songs'

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="musicas" element={<Songs />} />
          <Route path="conversa" element={<Chat />} />
          <Route path="fotos" element={<Photos />} />
          <Route path="anfitriao" element={<Anfitriao />} />
          <Route path="tocar" element={<Navigate to="/anfitriao" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
