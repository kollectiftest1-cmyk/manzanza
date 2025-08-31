import { Container, Row, Col, Button, Card } from "react-bootstrap"
import { LinkContainer } from "react-router-bootstrap"
import { useSelector } from "react-redux"

const Home = () => {
  const { isAuthenticated } = useSelector((state) => state.auth)

  return (
    <>
      {/* Hero Section */}
      <section className="hero-section gradient-bg">
        <Container>
          <Row className="align-items-center min-vh-100">
            <Col lg={6} className="hero-content">
              <h1 className="hero-title">Simplifiez la gestion de votre université avec ISIPA</h1>
              <p className="hero-subtitle">
                Une application tout-en-un qui est rapide, intuitive et complète pour la gestion académique et
                administrative.
              </p>
              <div className="d-flex gap-3 flex-wrap">
                {!isAuthenticated ? (
                  <>
                    <LinkContainer to="/login">
                      <Button size="lg" className="btn-primary-custom">
                        Commencer maintenant
                      </Button>
                    </LinkContainer>
                    <Button size="lg" variant="outline-light" className="btn-outline-custom">
                      Demander une démo
                    </Button>
                  </>
                ) : (
                  <LinkContainer to="/dashboard">
                    <Button size="lg" className="btn-primary-custom">
                      Accéder au tableau de bord
                    </Button>
                  </LinkContainer>
                )}
              </div>
            </Col>
            <Col lg={6} className="text-center">
              <div className="hero-image">
                <img src="/modern-university-dashboard-interface.png" alt="Interface ISIPA" className="img-fluid rounded shadow-lg" />
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Services Section */}
      <section className="py-5">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="display-5 fw-bold text-primary mb-3">
                ISIPA offre une gamme complète de services pour les gestionnaires d'université, enseignants, parents et
                étudiants.
              </h2>
            </Col>
          </Row>

          <Row>
            <Col md={4} className="mb-4">
              <Card className="card-custom h-100 text-center">
                <Card.Body className="p-4">
                  <div className="mb-4">
                    <img src="/administrator-working-on-laptop.png" alt="Administrateur" className="img-fluid rounded mb-3" />
                  </div>
                  <Card.Title className="h4 mb-3">Administrateur et directeurs</Card.Title>
                  <Card.Text className="text-muted mb-4">
                    Simplifiez votre vie avec la gestion numérique de votre établissement - tous vos rapports
                    administratifs en un seul clic.
                  </Card.Text>
                  <Button className="btn-primary-custom">Explorer Schoolap →</Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4} className="mb-4">
              <Card className="card-custom h-100 text-center">
                <Card.Body className="p-4">
                  <div className="mb-4">
                    <img src="/teacher-in-classroom-with-students.png" alt="Éducateur" className="img-fluid rounded mb-3" />
                  </div>
                  <Card.Title className="h4 mb-3">Éducateur</Card.Title>
                  <Card.Text className="text-muted mb-4">
                    Adoptez une gestion moderne pour vos classes et étudiants. Publiez et partagez du contenu éducatif,
                    économisant temps et énergie.
                  </Card.Text>
                  <Button className="btn-primary-custom">Essayer avec Schoolap →</Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={4} className="mb-4">
              <Card className="card-custom h-100 text-center">
                <Card.Body className="p-4">
                  <div className="mb-4">
                    <img
                      src="/students-learning-together-with-laptops.png"
                      alt="Apprenants et parents"
                      className="img-fluid rounded mb-3"
                    />
                  </div>
                  <Card.Title className="h4 mb-3">Apprenants et parents</Card.Title>
                  <Card.Text className="text-muted mb-4">
                    Suivez les performances des apprenants en temps réel et utilisez l'activité électronique pour
                    améliorer leur parcours académique.
                  </Card.Text>
                  <Button className="btn-primary-custom">Découvrir Schoolap →</Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="py-5 gradient-bg">
        <Container>
          <Row className="align-items-center">
            <Col lg={6} className="text-white">
              <h2 className="display-5 fw-bold mb-4">
                Accédez à votre compte de n'importe où, avec ou sans connectivité Internet.
              </h2>
              <p className="lead mb-4">
                Découvrez ISIPA, une application qui fonctionne parfaitement sur ordinateurs, tablettes ou téléphones,
                offrant une expérience utilisateur optimale en ligne et hors ligne.
              </p>
              <div className="d-flex gap-3">
                <img src="/app-store-badge.png" alt="App Store" />
                <img src="/google-play-badge.png" alt="Google Play" />
              </div>
            </Col>
            <Col lg={6} className="text-center">
              <img src="/responsive-devices-showing-university-app.png" alt="Appareils responsifs" className="img-fluid" />
            </Col>
          </Row>
        </Container>
      </section>
    </>
  )
}

export default Home
