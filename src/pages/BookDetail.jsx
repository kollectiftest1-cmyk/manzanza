"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge, Breadcrumb, ListGroup, ProgressBar } from "react-bootstrap" // Added ListGroup and ProgressBar
import { useParams, Link } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { fetchBookById, borrowBook, returnBook } from "../store/slices/librarySlice"
import axios from "axios" // For fetching text content

const BookDetail = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { currentBook: book, loading, error } = useSelector((state) => state.library)
  const { user } = useSelector((state) => state.auth)

  const [showReader, setShowReader] = useState(false)
  const [bookContent, setBookContent] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const CHARS_PER_PAGE = 1500 // Adjust as needed for readability

  useEffect(() => {
    dispatch(fetchBookById(id))
  }, [dispatch, id])

  useEffect(() => {
    if (showReader && book && ['numerique', 'memoire', 'projet'].includes(book.book_type) && book.file) {
      const fetchContent = async () => {
        try {
          const response = await axios.get(book.file)
          setBookContent(response.data)
          setTotalPages(Math.ceil(response.data.length / CHARS_PER_PAGE))
          setCurrentPage(1) // Reset to first page when content loads
        } catch (err) {
          console.error("Error fetching book content:", err)
          alert("Erreur lors du chargement du contenu du livre.")
          setShowReader(false)
        }
      }
      fetchContent()
    }
  }, [showReader, book])

  const handleBorrow = async (bookId) => {
    try {
      await dispatch(borrowBook(bookId)).unwrap()
      alert("Demande d'emprunt envoyée avec succès!")
      dispatch(fetchBookById(id)) // Refresh book details
    } catch (err) {
      alert("Erreur lors de l'emprunt: " + (err.detail || err.message || "Une erreur est survenue."))
    }
  }

  const handleReturn = async (loanId) => {
    try {
      await dispatch(returnBook(loanId)).unwrap()
      alert("Livre retourné avec succès!")
      dispatch(fetchBookById(id)) // Refresh book details
    } catch (err) {
      alert("Erreur lors du retour: " + (err.detail || err.message || "Une erreur est survenue."))
    }
  }

  const getCategoryBadge = (category) => {
    const categories = [
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
    const config = categories.find(c => c.value === category) || { label: category }
    return <Badge bg="primary">{config.label}</Badge>
  }

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages))
  }

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1))
  }

  if (loading) {
    return <Container className="py-4 text-center"><Spinner animation="border" variant="primary" /></Container>
  }

  if (error) {
    return <Container className="py-4"><Alert variant="danger">{error.detail || "Impossible de charger les détails du livre."}</Alert></Container>
  }

  if (!book) {
    return <Container className="py-4"><Alert variant="warning">Livre non trouvé.</Alert></Container>
  }

  const isStudent = user?.role === 'etudiant';
  const isAvailable = book.available_quantity > 0;
  const isBorrowable = book.borrowable;
  const isDigital = ['numerique', 'audio', 'memoire', 'projet'].includes(book.book_type);
  const isTextBook = ['numerique', 'memoire', 'projet'].includes(book.book_type);

  // Check if the user currently has this book on loan
  const userLoan = user?.book_loans?.find(loan => loan.book === book.id && loan.status === 'active');

  const currentTextPage = bookContent.substring(
    (currentPage - 1) * CHARS_PER_PAGE,
    currentPage * CHARS_PER_PAGE
  )
  const readingProgress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;

  return (
    <Container fluid className="py-0">
      <Breadcrumb className="mt-3">
        <Breadcrumb.Item as={Link} to="/library">Bibliothèque</Breadcrumb.Item>
        <Breadcrumb.Item active>{book.title}</Breadcrumb.Item>
      </Breadcrumb>

      {!showReader ? (
        <Card className="shadow-sm mb-4">
          <Card.Body>
            <Row>
              <Col md={4} className="text-center">
                <img
                  src={book.cover_image || "https://via.placeholder.com/200x300?text=No+Cover"}
                  alt={`Couverture de ${book.title}`}
                  className="img-fluid rounded shadow-sm"
                  style={{ maxHeight: '300px', objectFit: 'cover' }}
                />
                <div className="mt-3">
                  {isStudent && isBorrowable && isAvailable && !userLoan && (
                    <Button variant="primary" className="w-100 mb-2" onClick={() => handleBorrow(book.id)} disabled={loading}>
                      <i className="fas fa-hand-sparkles me-2"></i>Emprunter
                    </Button>
                  )}
                  {isStudent && userLoan && (
                    <Button variant="success" className="w-100 mb-2" onClick={() => handleReturn(userLoan.id)} disabled={loading}>
                      <i className="fas fa-undo me-2"></i>Retourner
                    </Button>
                  )}
                  {isDigital && book.file && (
                    <>
                      {isTextBook || book.book_type === 'audio' || book.book_type === 'video' ? (
                        <Button variant="outline-primary" className="w-100 mb-2" onClick={() => setShowReader(true)}>
                          <i className="fas fa-book-reader me-2"></i>Lire
                        </Button>
                      ) : (
                        book.downloadable && (
                          <Button variant="outline-primary" className="w-100 mb-2" href={book.file} target="_blank" rel="noopener noreferrer">
                            <i className="fas fa-download me-2"></i>Télécharger
                          </Button>
                        )
                      )}
                    </>
                  )}
                </div>
              </Col>
              <Col md={8}>
                <h2 className="fw-bold text-primary">{book.title}</h2>
                <h4 className="text-muted">{book.author}</h4>
                <hr />
                <p className="text-muted">{book.description || "Aucune description disponible."}</p>
                <ListGroup variant="flush" className="mt-3">
                  <ListGroup.Item><strong>Catégorie:</strong> {getCategoryBadge(book.category)}</ListGroup.Item>
                  <ListGroup.Item><strong>Type:</strong> <Badge bg="info">{book.book_type}</Badge></ListGroup.Item>
                  {book.isbn && <ListGroup.Item><strong>ISBN:</strong> {book.isbn}</ListGroup.Item>}
                  {book.publisher && <ListGroup.Item><strong>Éditeur:</strong> {book.publisher}</ListGroup.Item>}
                  {book.publication_year && <ListGroup.Item><strong>Année de publication:</strong> {book.publication_year}</ListGroup.Item>}
                  {book.pages && <ListGroup.Item><strong>Pages:</strong> {book.pages}</ListGroup.Item>}
                  <ListGroup.Item><strong>Langue:</strong> {book.language}</ListGroup.Item>
                  {book.location && <ListGroup.Item><strong>Emplacement:</strong> {book.location}</ListGroup.Item>}
                  <ListGroup.Item>
                    <strong>Disponibilité:</strong>
                    <Badge bg={isAvailable ? "success" : "danger"} className="ms-2">
                      {isAvailable ? `${book.available_quantity} disponible(s)` : "Indisponible"}
                    </Badge>
                  </ListGroup.Item>
                  <ListGroup.Item>
                    <strong>Empruntable:</strong>
                    <Badge bg={isBorrowable ? "success" : "danger"} className="ms-2">
                      {isBorrowable ? "Oui" : "Non"}
                    </Badge>
                  </ListGroup.Item>
                  {isDigital && <ListGroup.Item>
                    <strong>Téléchargeable:</strong>
                    <Badge bg={book.downloadable ? "success" : "danger"} className="ms-2">
                      {book.downloadable ? "Oui" : "Non"}
                    </Badge>
                  </ListGroup.Item>}
                </ListGroup>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      ) : (
        // Reader Component
        <Card className="shadow-sm mb-4">
          <Card.Header className="d-flex justify-content-between align-items-center">
            <h5>Lecture: {book.title}</h5>
            <Button variant="outline-secondary" size="sm" onClick={() => setShowReader(false)}>
              <i className="fas fa-times me-1"></i>Fermer le lecteur
            </Button>
          </Card.Header>
          <Card.Body>
            {book.book_type === 'audio' && (
              <div className="text-center">
                <audio controls src={book.file} className="w-100">
                  Votre navigateur ne supporte pas l'élément audio.
                </audio>
              </div>
            )}
            {book.book_type === 'video' && (
              <div className="text-center">
                <video controls src={book.file} className="w-100" style={{ maxWidth: '800px' }}>
                  Votre navigateur ne supporte pas l'élément vidéo.
                </video>
              </div>
            )}
            {isTextBook && (
              <div>
                {bookContent ? (
                  <>
                    <div className="book-content" style={{ minHeight: '300px', border: '1px solid #eee', padding: '15px', borderRadius: '5px', overflowY: 'auto' }}>
                      {currentTextPage.split('\n').map((paragraph, index) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-3">
                      <Button variant="outline-primary" onClick={handlePrevPage} disabled={currentPage === 1}>
                        Précédent
                      </Button>
                      <span>Page {currentPage} / {totalPages}</span>
                      <Button variant="outline-primary" onClick={handleNextPage} disabled={currentPage === totalPages}>
                        Suivant
                      </Button>
                    </div>
                    <ProgressBar now={readingProgress} label={`${Math.round(readingProgress)}%`} className="mt-3" />
                  </>
                ) : (
                  <div className="text-center"><Spinner animation="border" /> Chargement du contenu...</div>
                )}
              </div>
            )}
          </Card.Body>
        </Card>
      )}
    </Container>
  )
}

export default BookDetail
