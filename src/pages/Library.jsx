"use client"

import { useState, useEffect, useCallback } from "react"
import { Container, Row, Col, Card, Form, Button, Badge, InputGroup, Pagination, Spinner, Alert, Modal } from "react-bootstrap"
import { useSelector, useDispatch } from "react-redux"
import { fetchBooks, fetchMyBorrowings, borrowBook, returnBook, createBook } from "../store/slices/librarySlice"
import debounce from "lodash.debounce"
import { Link } from "react-router-dom" // Import Link

const Library = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { books: booksData, myBorrowings, loading, error } = useSelector((state) => state.library)
  
  const [filters, setFilters] = useState({ search: '', category: 'all' })
  const [currentPage, setCurrentPage] = useState(1)
  const [showAddModal, setShowAddModal] = useState(false) // Renamed for clarity
  const [showViewModal, setShowViewModal] = useState(false) // New state for view modal
  const [selectedBook, setSelectedBook] = useState(null) // New state for selected book
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    isbn: '',
    description: '',
    category: 'autre',
    book_type: 'physique',
    publisher: '',
    publication_year: '',
    pages: '',
    language: 'Français',
    location: '',
    quantity: 1,
    file: null,
    cover_image: null,
    downloadable: false,
    borrowable: true,
    is_available: true,
    is_active: true,
  })

  const fetchLibraryData = useCallback(debounce(async (page, currentFilters) => {
    const params = {
      page,
      search: currentFilters.search,
      category: currentFilters.category === 'all' ? '' : currentFilters.category,
    }
    dispatch(fetchBooks(params))
  }, 300), [dispatch])

  useEffect(() => {
    fetchLibraryData(currentPage, filters)
  }, [currentPage, filters, fetchLibraryData])

  useEffect(() => {
    if (user?.role === "etudiant") {
      dispatch(fetchMyBorrowings())
    }
  }, [dispatch, user])

  const handleFilterChange = (e) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value }))
    setCurrentPage(1)
  }

  const handleBorrow = async (bookId) => {
    try {
      await dispatch(borrowBook(bookId)).unwrap()
      alert("Demande d'emprunt envoyée avec succès!")
    } catch (err) {
      alert("Erreur lors de l'emprunt: " + (err.detail || err.message || "Une erreur est survenue."))
    }
  }

  const handleReturn = async (loanId) => {
    try {
      await dispatch(returnBook(loanId)).unwrap()
      alert("Livre retourné avec succès!")
    } catch (err) {
      alert("Erreur lors du retour: " + (err.detail || err.message || "Une erreur est survenue."))
    }
  }

  const handleShowAddModal = () => setShowAddModal(true) // Renamed
  const handleCloseAddModal = () => { // Renamed
    setShowAddModal(false)
    setNewBook({
      title: '', author: '', isbn: '', description: '', category: 'autre', book_type: 'physique',
      publisher: '', publication_year: '', pages: '', language: 'Français', location: '', quantity: 1,
      file: null, cover_image: null, downloadable: false, borrowable: true, is_available: true, is_active: true,
    })
  }

  // New functions for view modal
  const handleViewBook = (book) => {
    setSelectedBook(book)
    setShowViewModal(true)
  }

  const handleCloseViewModal = () => {
    setShowViewModal(false)
    setSelectedBook(null)
  }

  const handleNewBookChange = (e) => {
    const { name, value, type, checked, files } = e.target
    if (type === 'file') {
      setNewBook(prev => ({ ...prev, [name]: files[0] }))
    } else if (type === 'checkbox') {
      setNewBook(prev => ({ ...prev, [name]: checked }))
    } else {
      setNewBook(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleCreateBook = async (e) => {
    e.preventDefault()
    const formData = new FormData()
    
    for (const key in newBook) {
      const value = newBook[key]
      // Only append if value is not empty string, null, or undefined
      if (value !== '' && value !== null && value !== undefined) {
        if (key === 'file' || key === 'cover_image') {
          // Append only if it's an actual File object
          if (value instanceof File) {
            formData.append(key, value)
          }
        } else if (key === 'quantity' || key === 'publication_year' || key === 'pages') {
          // Convert to integer, but only if not empty string AND is a valid number
          const parsedValue = parseInt(value, 10);
          if (!isNaN(parsedValue)) {
            formData.append(key, parsedValue);
          }
        } else if (typeof value === 'boolean') {
          // Convert boolean to string 'true' or 'false'
          formData.append(key, value ? 'true' : 'false')
        } else {
          formData.append(key, value)
        }
      }
    }

    // --- Début du log pour le débogage ---
    console.log("Contenu de FormData envoyé au backend:");
    for (let [key, value] of formData.entries()) {
        console.log(`${key}: ${value}`);
    }
    // --- Fin du log pour le débogage ---

    try {
      await dispatch(createBook(formData)).unwrap()
      handleCloseAddModal()
      fetchLibraryData(1, { search: '', category: 'all' }) // Refresh list
    } catch (err) {
      alert("Erreur lors de la création du livre: " + (err.detail || err.message || "Vérifiez les champs."))
    }
  }

  const books = booksData?.results || []
  const totalPages = Math.ceil((booksData?.count || 0) / 10)

  const categories = [
    { value: "all", label: "Toutes les catégories" },
    { value: "comptabilite", label: "Comptabilité" },
    { value: "economie", label: "Économie" },
    { value: "mathematiques", label: "Mathématiques" },
    { value: "droit", label: "Droit" },
    { value: "finance", label: "Finance" },
    { value: "informatique", label: "Informatique" },
    { value: "memoire", label: "Mémoire" },
    { value: "projet", label: "Projet" },
    { value: "autre", label: "Autre" },
  ]

  const bookTypes = [
    { value: 'physique', label: 'Livre physique' },
    { value: 'numerique', label: 'Livre numérique' },
    { value: 'audio', label: 'Livre audio' },
    { value: 'memoire', label: 'Mémoire' },
    { value: 'projet', label: 'Projet' },
  ]

  const getCategoryBadge = (category) => {
    const config = categories.find(c => c.value === category) || { variant: "secondary", text: category }
    return <Badge bg="primary">{config.label}</Badge>
  }

  const canManageLibrary = user?.role === 'bibliothecaire' || user?.role === 'iadmin' ||  user?.role === 'sga';

  return (
    <Container fluid className="mt-4">
      <Row className="mb-4 dashboard-card">
        <Col>
          <h2>Bibliothèque</h2>
          <p className="text-muted">Catalogue des ressources académiques et gestion des emprunts</p>
        </Col>
      </Row>

      <Row>
        <Col md={user?.role === 'etudiant' ? 8 : 12}>
          <Card className="shadow">
            <Card.Header>
              <Row className="align-items-center">
                <Col md={4}>
                  <h5 className="mb-0">Catalogue ({booksData?.count || 0})</h5>
                </Col>
                <Col md={8} className="d-flex justify-content-end gap-2">
                  <InputGroup style={{ maxWidth: '250px' }}>
                    <Form.Control
                      type="search"
                      name="search"
                      placeholder="Rechercher..."
                      value={filters.search}
                      onChange={handleFilterChange}
                    />
                  </InputGroup>
                  <Form.Select name="category" value={filters.category} onChange={handleFilterChange} style={{ maxWidth: '180px' }}>
                    {categories.map((cat) => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </Form.Select>
                  {canManageLibrary && (
                    <Button variant="primary" onClick={handleShowAddModal}>
                      <i className="fas fa-plus me-2"></i>Ajouter
                    </Button>
                  )}
                </Col>
              </Row>
            </Card.Header>
            <Card.Body>
              {loading && books.length === 0 && <div className="text-center"><Spinner animation="border" /></div>}
              {error && <Alert variant="danger">{error.detail || "Erreur de chargement des livres."}</Alert>}
              
              <Row xs={1} sm={2} md={3} lg={4} className="g-4">
                {books.map((book) => (
                  <Col key={book.id}>
                    <Card className="h-100 shadow-sm" onClick={() => handleViewBook(book)} style={{ cursor: 'pointer' }}>
                      <Card.Img
                        variant="top"
                        src={book.cover_image || "https://via.placeholder.com/150x200?text=No+Cover"}
                        style={{ height: '200px', objectFit: 'cover' }}
                      />
                      <Card.Body>
                        <Card.Title as="h6" className="fw-bold">{book.title}</Card.Title>
                        <Card.Text className="text-muted small">{book.author}</Card.Text>
                        {getCategoryBadge(book.category)}
                      </Card.Body>
                      <Card.Footer className="d-flex justify-content-between align-items-center">
                        <Badge bg={book.available_quantity > 0 ? "success" : "danger"}>
                          {book.available_quantity > 0 ? `${book.available_quantity} dispo.` : "Indisponible"}
                        </Badge>
                        <div className="d-flex gap-2">
                          {user?.role === 'etudiant' && book.borrowable && book.available_quantity > 0 && (
                            <Button variant="primary" size="sm" onClick={(e) => { e.stopPropagation(); handleBorrow(book.id); }} disabled={loading}>
                              Emprunter
                            </Button>
                          )}
                          {['numerique', 'audio', 'memoire', 'projet'].includes(book.book_type) && book.file && (
                            <Link to={`/book-detail/${book.id}`} onClick={(e) => e.stopPropagation()}>
                              <Button variant="outline-info" size="sm">
                                <i className="fas fa-book-reader me-1"></i>Lire
                              </Button>
                            </Link>
                          )}
                        </div>
                      </Card.Footer>
                    </Card>
                  </Col>
                ))}
              </Row>
            </Card.Body>
            {totalPages > 1 && (
              <Card.Footer className="d-flex justify-content-center">
                <Pagination>
                  <Pagination.First onClick={() => setCurrentPage(1)} disabled={currentPage === 1} />
                  <Pagination.Prev onClick={() => setCurrentPage(p => p - 1)} disabled={!booksData?.previous} />
                  {[...Array(totalPages).keys()].map(page => (
                    <Pagination.Item key={page + 1} active={page + 1 === currentPage} onClick={() => setCurrentPage(page + 1)}>
                      {page + 1}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next onClick={() => setCurrentPage(p => p + 1)} disabled={!booksData?.next} />
                  <Pagination.Last onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} />
                </Pagination>
              </Card.Footer>
            )}
          </Card>
        </Col>

        {user?.role === 'etudiant' && (
          <Col md={4}>
            <Card className="shadow">
              <Card.Header><h6 className="mb-0">Mes Emprunts</h6></Card.Header>
              <Card.Body>
                {loading && myBorrowings.length === 0 && <div className="text-center"><Spinner size="sm" /></div>}
                {myBorrowings.length === 0 && !loading ? (
                  <p className="text-muted text-center">Aucun emprunt en cours.</p>
                ) : (
                  myBorrowings.map((loan) => (
                    <div key={loan.id} className="border-bottom pb-2 mb-2">
                      <h6 className="mb-1 small fw-bold">{loan.book_title}</h6>
                      <small className="text-muted d-block">Emprunté le: {new Date(loan.loan_date).toLocaleDateString("fr-FR")}</small>
                      <small className="text-muted d-block">À retourner le: {new Date(loan.due_date).toLocaleDateString("fr-FR")}</small>
                      <Badge bg={loan.status === 'active' ? 'warning' : 'success'}>
                        {loan.status === 'active' ? 'En cours' : 'Retourné'}
                      </Badge>
                      {loan.status === 'active' && (
                        <Button size="sm" variant="outline-success" className="float-end" onClick={() => handleReturn(loan.id)} disabled={loading}>
                          Retourner
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      {/* Add Book Modal */}
      <Modal show={showAddModal} onHide={handleCloseAddModal} size="lg">
        <Form onSubmit={handleCreateBook}>
          <Modal.Header closeButton>
            <Modal.Title>Ajouter une Ressource</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <Row>
              <Col md={8}><Form.Group className="mb-3"><Form.Label>Titre</Form.Label><Form.Control name="title" value={newBook.title} onChange={handleNewBookChange} required /></Form.Group></Col>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>Auteur</Form.Label><Form.Control name="author" value={newBook.author} onChange={handleNewBookChange} required /></Form.Group></Col>
            </Row>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Catégorie</Form.Label><Form.Select name="category" value={newBook.category} onChange={handleNewBookChange}>{categories.filter(c => c.value !== 'all').map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</Form.Select></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Type</Form.Label><Form.Select name="book_type" value={newBook.book_type} onChange={handleNewBookChange}>{bookTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}</Form.Select></Form.Group></Col>
            </Row>
            <Form.Group className="mb-3"><Form.Label>Description</Form.Label><Form.Control as="textarea" rows={3} name="description" value={newBook.description} onChange={handleNewBookChange} /></Form.Group>
            <Form.Group className="mb-3"><Form.Label>Langue</Form.Label><Form.Control name="language" value={newBook.language} onChange={handleNewBookChange} required /></Form.Group>
            
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>ISBN (Optionnel)</Form.Label><Form.Control name="isbn" value={newBook.isbn} onChange={handleNewBookChange} /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Label>Éditeur (Optionnel)</Form.Label><Form.Control name="publisher" value={newBook.publisher} onChange={handleNewBookChange} /></Form.Group></Col>
            </Row>
            <Row>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>Année de publication (Optionnel)</Form.Label><Form.Control type="number" name="publication_year" value={newBook.publication_year} onChange={handleNewBookChange} /></Form.Group></Col>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>Pages (Optionnel)</Form.Label><Form.Control type="number" name="pages" value={newBook.pages} onChange={handleNewBookChange} /></Form.Group></Col>
              <Col md={4}><Form.Group className="mb-3"><Form.Label>Emplacement (Optionnel)</Form.Label><Form.Control name="location" value={newBook.location} onChange={handleNewBookChange} /></Form.Group></Col>
            </Row>

            {newBook.book_type === 'physique' && (
              <Form.Group className="mb-3"><Form.Label>Quantité</Form.Label><Form.Control type="number" name="quantity" value={newBook.quantity} onChange={handleNewBookChange} min="1" /></Form.Group>
            )}
            {['numerique', 'audio', 'memoire', 'projet'].includes(newBook.book_type) && (
              <>
                <Form.Group className="mb-3"><Form.Label>Fichier (Optionnel)</Form.Label><Form.Control type="file" name="file" onChange={handleNewBookChange} /></Form.Group>
                <Form.Group className="mb-3"><Form.Check type="checkbox" label="Téléchargeable" name="downloadable" checked={newBook.downloadable} onChange={handleNewBookChange} /></Form.Group>
              </>
            )}
            <Form.Group className="mb-3"><Form.Label>Image de couverture (Optionnel)</Form.Label><Form.Control type="file" name="cover_image" onChange={handleNewBookChange} /></Form.Group>
            <Row>
              <Col md={6}><Form.Group className="mb-3"><Form.Check type="checkbox" label="Empruntable" name="borrowable" checked={newBook.borrowable} onChange={handleNewBookChange} /></Form.Group></Col>
              <Col md={6}><Form.Group className="mb-3"><Form.Check type="checkbox" label="Actif" name="is_active" checked={newBook.is_active} onChange={handleNewBookChange} /></Form.Group></Col>
            </Row>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseAddModal}>Annuler</Button>
            <Button variant="primary" type="submit" disabled={loading}>
              {loading ? <Spinner as="span" size="sm" /> : "Ajouter"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>

      {/* View Book Modal */}
      <Modal show={showViewModal} onHide={handleCloseViewModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{selectedBook?.title}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedBook && (
            <Row>
              <Col md={4}>
                <img
                  src={selectedBook.cover_image || "https://via.placeholder.com/150x200?text=No+Cover"}
                  alt={selectedBook.title}
                  className="img-fluid rounded mb-3"
                />
              </Col>
              <Col md={8}>
                <p><strong>Auteur:</strong> {selectedBook.author}</p>
                <p><strong>Catégorie:</strong> {getCategoryBadge(selectedBook.category)}</p>
                <p><strong>Type:</strong> {bookTypes.find(t => t.value === selectedBook.book_type)?.label || selectedBook.book_type}</p>
                <p><strong>Description:</strong> {selectedBook.description || "N/A"}</p>
                <p><strong>Langue:</strong> {selectedBook.language}</p>
                {selectedBook.isbn && <p><strong>ISBN:</strong> {selectedBook.isbn}</p>}
                {selectedBook.publisher && <p><strong>Éditeur:</strong> {selectedBook.publisher}</p>}
                {selectedBook.publication_year && <p><strong>Année de publication:</strong> {selectedBook.publication_year}</p>}
                {selectedBook.pages && <p><strong>Pages:</strong> {selectedBook.pages}</p>}
                {selectedBook.location && <p><strong>Emplacement:</strong> {selectedBook.location}</p>}
                {selectedBook.book_type === 'physique' && <p><strong>Quantité disponible:</strong> {selectedBook.available_quantity}</p>}
                {selectedBook.file && selectedBook.downloadable && (
                  <p>
                    <strong>Fichier:</strong> <a href={selectedBook.file} target="_blank" rel="noopener noreferrer">Télécharger</a>
                  </p>
                )}
                <p><strong>Empruntable:</strong> {selectedBook.borrowable ? 'Oui' : 'Non'}</p>
                <p><strong>Actif:</strong> {selectedBook.is_active ? 'Oui' : 'Non'}</p>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          {user?.role === 'etudiant' && selectedBook?.borrowable && selectedBook?.available_quantity > 0 && (
            <Button variant="primary" onClick={() => handleBorrow(selectedBook.id)} disabled={loading}>
              Emprunter
            </Button>
          )}
          {['numerique', 'audio', 'memoire', 'projet'].includes(selectedBook?.book_type) && selectedBook?.file && (
            <Link to={`/book-detail/${selectedBook.id}`} onClick={() => handleCloseViewModal()}>
              <Button variant="outline-info">
                <i className="fas fa-book-reader me-1"></i>Lire
              </Button>
            </Link>
          )}
          <Button variant="secondary" onClick={handleCloseViewModal}>Fermer</Button>
        </Modal.Footer>
      </Modal>
    </Container>
  )
}

export default Library
