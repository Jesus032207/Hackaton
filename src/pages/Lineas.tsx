import React, { useState, useEffect } from 'react'
import { lineasAPI } from '../services/api'

interface Linea {
  _id: string
  nombre: string
  descripcion: string
  coordinador: string
  estado: string
}

const Lineas: React.FC = () => {
  const [lineas, setLineas] = useState<Linea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchLineas = async () => {
      try {
        const response = await lineasAPI.get('/lineas')
        setLineas(response.data)
      } catch (err: any) {
        setError('Error al cargar las líneas de profundización')
      } finally {
        setLoading(false)
      }
    }

    fetchLineas()
  }, [])

  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Cargando...</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <h1 className="text-center mb-5">Líneas de Profundización</h1>
          
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}

          <div className="row">
            {lineas.map((linea) => (
              <div key={linea._id} className="col-md-6 col-lg-4 mb-4">
                <div className="card h-100">
                  <div className="card-body">
                    <h5 className="card-title">{linea.nombre}</h5>
                    <p className="card-text">{linea.descripcion}</p>
                    <div className="mt-auto">
                      <p className="mb-1">
                        <strong>Coordinador:</strong> {linea.coordinador}
                      </p>
                      <span className={`badge ${
                        linea.estado === 'activa' ? 'bg-success' : 'bg-secondary'
                      }`}>
                        {linea.estado}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {lineas.length === 0 && !error && (
            <div className="text-center">
              <p>No hay líneas de profundización disponibles.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Lineas