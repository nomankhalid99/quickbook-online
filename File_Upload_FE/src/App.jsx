import React from 'react'
import { BrowserRouter,Routes,Route } from 'react-router-dom'
import InvoiceView from './pages/InvoiceView'
import Home from './pages/Home'
import Auth from './pages/Auth'

const App = () => {
  return (
   <>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Auth />} />
        <Route path="/upload" element={<Home />} />
        <Route path="/invoice" element={<InvoiceView />} />
      </Routes>
    </BrowserRouter>
   </>
  )
}

export default App