"use client"

import { useState } from "react"
import { Container, Row, Col, Card, Form, Button, Badge, Table, InputGroup, Pagination } from "react-bootstrap"
import { useSelector } from "react-redux"

const Library = () => {
  const { user } = useSelector((state) => state.auth)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10



  const [books] = useState([
    {
      id: 1,
      title: "Comptabilité Générale - Principes Fondamentaux",
      author: "Jean-Claude Scheid",
      category: "comptabilite",
      type: "physique",
      isbn: "978-2-10-074567-8",
      available: true,
      borrowable: true,
      location: "Section A - Étagère 12",
      description: "Manuel complet de comptabilité générale pour étudiants en finance",
      cover: "https://covers.openlibrary.org/b/id/12509492-L.jpg",
    },
    {
      id: 2,
      title: "Économie Politique Moderne",
      author: "Paul Samuelson",
      category: "economie",
      type: "numerique",
      downloadable: true,
      available: true,
      location: "PDF en ligne",
      description: "Théories économiques contemporaines et applications pratiques",
      cover: "https://covers.openlibrary.org/b/id/12509492-L.jpg",
    },
    {
      id: 3,
      title: "Mémoire de Master en Finance",
      author: "Pierre Devolder",
      category: "memoire",
      type: "numerique",
      downloadable: false,
      available: true,
      location: "Consultation en ligne uniquement",
      description: "Analyse des marchés financiers émergents",
      cover: "https://covers.openlibrary.org/b/id/12509492-L.jpg",
    },
    {
      id: 4,
      title: "Cours Audio - Droit Commercial",
      author: "Michel Germain",
      category: "droit",
      type: "audio",
      downloadable: true,
      available: true,
      location: "MP3 en ligne",
      description: "Cours audio sur les bases du droit commercial",
      cover: "https://covers.openlibrary.org/b/id/12509492-L.jpg",
    },
    {
      id: 5,
      title: "Projet Fin d'Études - Analyse Financière",
      author: "Hubert de La Bruslerie",
      category: "projet",
      type: "physique",
      borrowable: false,
      available: false,
      location: "Archive Section C",
      description: "Étude de cas sur l’évaluation d’entreprise",
      cover: "https://covers.openlibrary.org/b/id/12509492-L.jpg",
    },
  ])
  const [borrowedBooks] = useState([
    {
      id: 1,
      title: "Comptabilité Générale - Principes Fondamentaux",
      borrowDate: "2024-01-15",
      returnDate: "2024-02-15",
      status: "en_cours",
    },
    {
      id: 3,
      title: "Mathématiques Financières Appliquées",
      borrowDate: "2024-01-10",
      returnDate: "2024-02-10",
      status: "retourne",
    },
  ])

  const categories = [
    { value: "all", label: "Toutes les catégories" },
    { value: "comptabilite", label: "Comptabilité" },
    { value: "economie", label: "Économie" },
    { value: "mathematiques", label: "Mathématiques" },
    { value: "droit", label: "Droit" },
    { value: "finance", label: "Finance" },
  ]

  const filteredBooks = books.filter((book) => {
    const matchesSearch =
      book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      book.author.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = selectedCategory === "all" || book.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const totalPages = Math.ceil(filteredBooks.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const currentBooks = filteredBooks.slice(startIndex, startIndex + itemsPerPage)

  const handleBorrow = (bookId) => {
    alert(`Demande d'emprunt envoyée pour le livre ID: ${bookId}`)
  }

  const getCategoryBadge = (category) => {
    const categoryConfig = {
      comptabilite: { variant: "primary", text: "Comptabilité" },
      economie: { variant: "success", text: "Économie" },
      mathematiques: { variant: "info", text: "Mathématiques" },
      droit: { variant: "warning", text: "Droit" },
      finance: { variant: "danger", text: "Finance" },
    }
    const config = categoryConfig[category] || { variant: "secondary", text: "Autre" }
    return <Badge bg={config.variant}>{config.text}</Badge>
  }

  return (
    <Container fluid className="mt-4">
      <Row className="mb-4 dashboard-card">
        <Col>
          <h2>Bibliothèque DASH</h2>
          <p className="text-muted">Catalogue des ressources académiques et gestion des emprunts</p>
        </Col>
      </Row>

      {/* Statistics */}
      <Row className="mb-4">
        <Col md={3}>
          <Card className="shadow text-center">
            <Card.Body>
              <h3 className="text-primary">{books.length}</h3>
              <p className="mb-0">Livres Disponibles</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow text-center">
            <Card.Body>
              <h3 className="text-success">{borrowedBooks.filter((b) => b.status === "en_cours").length}</h3>
              <p className="mb-0">Emprunts Actifs</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow text-center">
            <Card.Body>
              <h3 className="text-info">5</h3>
              <p className="mb-0">Catégories</p>
            </Card.Body>
          </Card>
        </Col>
        <Col md={3}>
          <Card className="shadow text-center">
            <Card.Body>
              <h3 className="text-warning">24/7</h3>
              <p className="mb-0">Accès Numérique</p>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        {/* Search and Filters */}
        <Col md={12} style={{marginBottom:20}}>
          <Card className="shadow">
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Catalogue des Livres</h5>
              <Badge bg="info">{filteredBooks.length} résultat(s)</Badge>
            </Card.Header>
            <Card.Body>
              {/* Search Bar */}
              <Row className="mb-3">
                <Col md={8}>
                  <InputGroup>
                    <Form.Control
                      type="text"
                      placeholder="Rechercher par titre ou auteur..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Button variant="outline-primary">🔍 Rechercher</Button>
                  </InputGroup>
                </Col>
                <Col md={4}>
                  <Form.Select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                    ))}
                  </Form.Select>
                </Col>
              </Row>

              {/* Books Table */}
              <Row xs={1} sm={2} md={3} lg={4} className="g-4" style={{display:"flex",flexWrap:"wrap",marginLeft:20,gap:20}}>
      {currentBooks.map((book) => (
        // <Col key={book.id}  width="100px">
          <Card className="h-75 shadow-sm" style={{width:200}} key={book.id} onClick={() => handleBorrow(book.id)}>
            <Card.Img
              variant="top"
              src={book.cover || "/placeholder-book.png"} // mets une image par défaut si pas de cover
              style={{ width: "100%", borderRadius:10,marginTop:10,alignSelf:"center",marginBottom:10}}
            />
            <Card.Body style={{margin:0,padding:0,paddingBottom:10}}>
              <Card.Title className="d-flex justify-content-between align-items-start fs-6">
                <span>{book.title}</span>
                {/* <Badge bg={book.available ? "success" : "danger"}>
                  {book.available ? "Disponible" : "Emprunté"}
                </Badge> */}
              </Card.Title>
              <Card.Text style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                <small className="text-muted">{book.author}</small>
                {/* <br /> */}
                <small>{getCategoryBadge(book.category)}</small>
                {/* {getCategoryBadge(book.category)} */}
              </Card.Text>
              {/* <Card.Text className="text-truncate" style={{ maxHeight: "40px" }}>
                <small>{book.description}</small>
              </Card.Text> */}
            </Card.Body>
            {/* <Card.Footer className="d-flex justify-content-between align-items-center">
              <small className="text-muted">
                <code>{book.isbn}</code> <br /> {book.location}
              </small>
              <Button
                variant={book.available ? "primary" : "secondary"}
                size="sm"
                disabled={!book.available}
                onClick={() => handleBorrow(book.id)}
              >
                {book.available ? "Emprunter" : "Indisponible"}
              </Button>
            </Card.Footer> */}
          </Card>
        // </Col>
      ))}
    </Row>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="d-flex justify-content-center">
                  <Pagination>
                    <Pagination.Prev disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} />
                    {[...Array(totalPages)].map((_, index) => (
                      <Pagination.Item
                        key={index + 1}
                        active={index + 1 === currentPage}
                        onClick={() => setCurrentPage(index + 1)}
                      >
                        {index + 1}
                      </Pagination.Item>
                    ))}
                    <Pagination.Next
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage(currentPage + 1)}
                    />
                  </Pagination>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* My Borrowings */}
        <Col md={4}>
          <Card className="shadow">
            <Card.Header>
              <h6 className="mb-0">Mes Emprunts</h6>
            </Card.Header>
            <Card.Body>
              {borrowedBooks.length === 0 ? (
                <p className="text-muted text-center">Aucun emprunt en cours</p>
              ) : (
                borrowedBooks.map((book) => (
                  <div key={book.id} className="border-bottom pb-2 mb-2">
                    <h6 className="mb-1">{book.title}</h6>
                    <small className="text-muted">
                      Emprunté le: {new Date(book.borrowDate).toLocaleDateString("fr-FR")}
                    </small>
                    <br />
                    <small className="text-muted">
                      À retourner le: {new Date(book.returnDate).toLocaleDateString("fr-FR")}
                    </small>
                    <br />
                    <Badge bg={book.status === "en_cours" ? "warning" : "success"}>
                      {book.status === "en_cours" ? "En cours" : "Retourné"}
                    </Badge>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>

          <Card className="shadow mt-3">
            <Card.Header>
              <h6 className="mb-0">Ressources Numériques</h6>
            </Card.Header>
            <Card.Body>
              <div className="d-grid gap-2">
                <Button variant="outline-primary" size="sm">
                  📚 E-Books
                </Button>
                <Button variant="outline-success" size="sm">
                  📄 Articles Académiques
                </Button>
                <Button variant="outline-info" size="sm">
                  🎥 Vidéos Éducatives
                </Button>
                <Button variant="outline-warning" size="sm">
                  📊 Bases de Données
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Library
