import React from 'react'
import { Link } from 'react-router-dom'

const Home: React.FC = () => {
  return (
    <div>
      {/* Hero Section */}
      <section className="hero-section bg-primary text-white py-5">
        <div className="container">
          <div className="row align-items-center">
            <div className="col-lg-6">
              <h1 className="display-4 fw-bold mb-4">
                Líneas de Profundización en Ingeniería de Sistemas
              </h1>
              <p className="lead mb-4">
                Descubre las diferentes áreas de especialización y elige tu camino 
                en el mundo de la ingeniería de sistemas.
              </p>
              <Link to="/lineas" className="btn btn-light btn-lg me-3">
                Ver Líneas
              </Link>
              <Link to="/register" className="btn btn-outline-light btn-lg">
                Registrarse
              </Link>
            </div>
            <div className="col-lg-6">
              <img 
                src="/api/placeholder/600/400" 
                alt="Ingeniería de Sistemas" 
                className="img-fluid rounded"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-5">
        <div className="container">
          <div className="row text-center mb-5">
            <div className="col">
              <h2>¿Por qué elegir una línea de profundización?</h2>
              <p className="lead">Especialízate en lo que más te apasiona</p>
            </div>
          </div>
          <div className="row">
            <div className="col-md-4 mb-4">
              <div className="card h-100">
                <div className="card-body text-center">
                  <i className="bi bi-code-slash display-4 text-primary mb-3"></i>
                  <h5 className="card-title">Desarrollo de Software</h5>
                  <p className="card-text">
                    Aprende las mejores prácticas en desarrollo de software, 
                    arquitecturas modernas y metodologías ágiles.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="card h-100">
                <div className="card-body text-center">
                  <i className="bi bi-shield-lock display-4 text-primary mb-3"></i>
                  <h5 className="card-title">Ciberseguridad</h5>
                  <p className="card-text">
                    Especialízate en proteger sistemas y datos contra amenazas 
                    cibernéticas y vulnerabilidades.
                  </p>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="card h-100">
                <div className="card-body text-center">
                  <i className="bi bi-graph-up display-4 text-primary mb-3"></i>
                  <h5 className="card-title">Ciencia de Datos</h5>
                  <p className="card-text">
                    Domina el análisis de datos, machine learning y toma de 
                    decisiones basada en datos.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home