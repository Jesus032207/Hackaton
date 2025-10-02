import React from 'react'
import { useAuth } from '../context/AuthContext'

const Dashboard: React.FC = () => {
  const { user } = useAuth()

  return (
    <div className="container py-5">
      <div className="row">
        <div className="col-12">
          <h1>Dashboard</h1>
          <div className="card mt-4">
            <div className="card-body">
              <h5 className="card-title">Bienvenido, {user?.username}</h5>
              <p className="card-text">
                Rol: <span className="badge bg-primary">{user?.role}</span>
              </p>
              <p>
                Esta es tu área personal donde podrás gestionar tus líneas de profundización.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard