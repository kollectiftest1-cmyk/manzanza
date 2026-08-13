"use client"

import { useState, useEffect } from "react"
import { Container, Row, Col, Card, Button, Spinner, Alert, Badge, Breadcrumb, ListGroup, ProgressBar } from "react-bootstrap"
import { useParams, Link } from "react-router-dom"
import { useDispatch, useSelector } from "react-redux"
import { fetchBookById, borrowBook, returnBook } from "../store/slices/librarySlice"
import axios from "axios"
import { motion } from "framer-motion"
import { FiBook, FiBookOpen, FiDownload, FiX, FiChevronLeft, FiChevronRight, FiPlay, FiVideo, FiArrowLeft, FiCalendar, FiMapPin, FiTag, FiFileText, FiUser, FiGlobe } from "react-icons/fi"

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
}

const BookDetail = () => {
  const { id } = useParams()
  const dispatch = useDispatch()
  const { currentBook: book, loading, error } = useSelector((state) => state.library)
  const { user } = useSelector((state) => state.auth)

  const [showReader, setShowReader] = useState(false)
  const [bookContent, setBookContent] = useState("")
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const CHARS_PER_PAGE = 1500

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
    return (
      <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
        <div className="text-center" style={{ paddingTop: '100px' }}>
          <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
        </div>
      </Container>
    )
  }

  if (error) {
    return (
      <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
        <Alert variant="danger" style={{ background: 'var(--color-cardBg)', border: '1px solid #dc3545', color: 'var(--color-text)' }}>
          {error.detail || "Impossible de charger les détails du livre."}
        </Alert>
      </Container>
    )
  }

  if (!book) {
    return (
      <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
        <Alert variant="warning" style={{ background: 'var(--color-cardBg)', border: '1px solid #ffc107', color: 'var(--color-text)' }}>
          Livre non trouvé.
        </Alert>
      </Container>
    )
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
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', minHeight: '100vh' }}>
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Breadcrumb */}
        <motion.div variants={itemVariants} style={{ marginBottom: '20px' }}>
          <Breadcrumb style={{ background: 'transparent', padding: '0' }}>
            <Breadcrumb.Item as={Link} to="/library" style={{ color: 'var(--color-primary)' }}>
              <FiArrowLeft style={{ marginRight: '8px' }} />
              Bibliothèque
            </Breadcrumb.Item>
            <Breadcrumb.Item active style={{ color: 'var(--color-text)' }}>{book.title}</Breadcrumb.Item>
          </Breadcrumb>
        </motion.div>

        {!showReader ? (
          <Row>
            {/* Left Column - Book Cover & Actions */}
            <Col lg={4}>
              <motion.div variants={itemVariants}>
                <div style={{
                  background: 'var(--color-cardBg)',
                  borderRadius: '16px',
                  padding: '24px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  border: '1px solid var(--color-border)',
                  textAlign: 'center',
                  position: 'sticky',
                  top: '24px'
                }}>
                  <div style={{
                    borderRadius: '12px',
                    overflow: 'hidden',
                    marginBottom: '24px',
                    boxShadow: '0 8px 16px rgba(0,0,0,0.15)'
                  }}>
                    <img
                      src={book.cover_image || "https://via.placeholder.com/200x300?text=No+Cover"}
                      alt={`Couverture de ${book.title}`}
                      style={{ width: '100%', height: 'auto', maxHeight: '400px', objectFit: 'cover' }}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {isStudent && isBorrowable && isAvailable && !userLoan && (
                      <Button
                        onClick={() => handleBorrow(book.id)}
                        disabled={loading}
                        style={{
                          background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)',
                          border: 'none',
                          padding: '12px',
                          borderRadius: '10px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px',
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <FiBook size={18} />
                        Emprunter
                      </Button>
                    )}
                    {isStudent && userLoan && (
                      <Button
                        variant="success"
                        onClick={() => handleReturn(userLoan.id)}
                        disabled={loading}
                        style={{
                          padding: '12px',
                          borderRadius: '10px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '8px'
                        }}
                      >
                        <FiArrowLeft size={18} />
                        Retourner
                      </Button>
                    )}
                    {isDigital && book.file && (
                      <>
                        {isTextBook && (
                          <Button
                            variant="outline-primary"
                            onClick={() => setShowReader(true)}
                            style={{
                              padding: '12px',
                              borderRadius: '10px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              borderColor: 'var(--color-primary)',
                              color: 'var(--color-primary)'
                            }}
                          >
                            <FiBookOpen size={18} />
                            Lire
                          </Button>
                        )}
                        {book.book_type === 'audio' && (
                          <Button
                            variant="outline-primary"
                            onClick={() => setShowReader(true)}
                            style={{
                              padding: '12px',
                              borderRadius: '10px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              borderColor: 'var(--color-primary)',
                              color: 'var(--color-primary)'
                            }}
                          >
                            <FiPlay size={18} />
                            Écouter
                          </Button>
                        )}
                        {book.book_type === 'video' && (
                          <Button
                            variant="outline-primary"
                            onClick={() => setShowReader(true)}
                            style={{
                              padding: '12px',
                              borderRadius: '10px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              borderColor: 'var(--color-primary)',
                              color: 'var(--color-primary)'
                            }}
                          >
                            <FiVideo size={18} />
                            Regarder
                          </Button>
                        )}
                        {book.downloadable && (
                          <Button
                            variant="outline-secondary"
                            href={book.file}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              padding: '12px',
                              borderRadius: '10px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px'
                            }}
                          >
                            <FiDownload size={18} />
                            Télécharger
                          </Button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            </Col>

            {/* Right Column - Book Details */}
            <Col lg={8}>
              <motion.div variants={itemVariants}>
                <div style={{
                  background: 'var(--color-cardBg)',
                  borderRadius: '16px',
                  padding: '32px',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                  border: '1px solid var(--color-border)'
                }}>
                  <h1 style={{
                    fontSize: '2rem',
                    fontWeight: '700',
                    background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    marginBottom: '12px'
                  }}>
                    {book.title}
                  </h1>

                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '1.1rem',
                    color: 'var(--color-textSecondary)',
                    marginBottom: '24px'
                  }}>
                    <FiUser size={20} />
                    {book.author}
                  </div>

                  <p style={{
                    color: 'var(--color-textSecondary)',
                    fontSize: '1rem',
                    lineHeight: '1.6',
                    marginBottom: '32px',
                    padding: '16px',
                    background: 'var(--color-bodyBg)',
                    borderRadius: '8px',
                    borderLeft: '4px solid var(--color-primary)'
                  }}>
                    {book.description || "Aucune description disponible."}
                  </p>

                  <div style={{ display: 'grid', gap: '16px' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: 'var(--color-bodyBg)',
                      borderRadius: '8px'
                    }}>
                      <FiTag size={20} style={{ color: 'var(--color-primary)' }} />
                      <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>Catégorie:</span>
                      {getCategoryBadge(book.category)}
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: 'var(--color-bodyBg)',
                      borderRadius: '8px'
                    }}>
                      <FiFileText size={20} style={{ color: 'var(--color-primary)' }} />
                      <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>Type:</span>
                      <Badge bg="info">{book.book_type}</Badge>
                    </div>

                    {book.isbn && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: 'var(--color-bodyBg)',
                        borderRadius: '8px'
                      }}>
                        <FiBook size={20} style={{ color: 'var(--color-primary)' }} />
                        <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>ISBN:</span>
                        <span style={{ color: 'var(--color-textSecondary)' }}>{book.isbn}</span>
                      </div>
                    )}

                    {book.publisher && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: 'var(--color-bodyBg)',
                        borderRadius: '8px'
                      }}>
                        <FiFileText size={20} style={{ color: 'var(--color-primary)' }} />
                        <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>Éditeur:</span>
                        <span style={{ color: 'var(--color-textSecondary)' }}>{book.publisher}</span>
                      </div>
                    )}

                    {book.publication_year && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: 'var(--color-bodyBg)',
                        borderRadius: '8px'
                      }}>
                        <FiCalendar size={20} style={{ color: 'var(--color-primary)' }} />
                        <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>Année de publication:</span>
                        <span style={{ color: 'var(--color-textSecondary)' }}>{book.publication_year}</span>
                      </div>
                    )}

                    {book.pages && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: 'var(--color-bodyBg)',
                        borderRadius: '8px'
                      }}>
                        <FiFileText size={20} style={{ color: 'var(--color-primary)' }} />
                        <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>Pages:</span>
                        <span style={{ color: 'var(--color-textSecondary)' }}>{book.pages}</span>
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: 'var(--color-bodyBg)',
                      borderRadius: '8px'
                    }}>
                      <FiGlobe size={20} style={{ color: 'var(--color-primary)' }} />
                      <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>Langue:</span>
                      <span style={{ color: 'var(--color-textSecondary)' }}>{book.language}</span>
                    </div>

                    {book.location && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: 'var(--color-bodyBg)',
                        borderRadius: '8px'
                      }}>
                        <FiMapPin size={20} style={{ color: 'var(--color-primary)' }} />
                        <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>Emplacement:</span>
                        <span style={{ color: 'var(--color-textSecondary)' }}>{book.location}</span>
                      </div>
                    )}

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: 'var(--color-bodyBg)',
                      borderRadius: '8px'
                    }}>
                      <FiBook size={20} style={{ color: 'var(--color-primary)' }} />
                      <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>Disponibilité:</span>
                      <Badge bg={isAvailable ? "success" : "danger"}>
                        {isAvailable ? `${book.available_quantity} disponible(s)` : "Indisponible"}
                      </Badge>
                    </div>

                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      padding: '12px',
                      background: 'var(--color-bodyBg)',
                      borderRadius: '8px'
                    }}>
                      <FiBookOpen size={20} style={{ color: 'var(--color-primary)' }} />
                      <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>Empruntable:</span>
                      <Badge bg={isBorrowable ? "success" : "danger"}>
                        {isBorrowable ? "Oui" : "Non"}
                      </Badge>
                    </div>

                    {isDigital && (
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: 'var(--color-bodyBg)',
                        borderRadius: '8px'
                      }}>
                        <FiDownload size={20} style={{ color: 'var(--color-primary)' }} />
                        <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>Téléchargeable:</span>
                        <Badge bg={book.downloadable ? "success" : "danger"}>
                          {book.downloadable ? "Oui" : "Non"}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            </Col>
          </Row>
        ) : (
          // Reader Component
          <motion.div variants={itemVariants}>
            <div style={{
              background: 'var(--color-cardBg)',
              borderRadius: '16px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              border: '1px solid var(--color-border)',
              overflow: 'hidden'
            }}>
              <div style={{
                background: 'linear-gradient(135deg, var(--color-primary) 0%, #667eea 100%)',
                padding: '20px 24px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <h5 style={{ margin: 0, color: 'white', fontWeight: '600' }}>
                  <FiBookOpen style={{ marginRight: '8px' }} />
                  Lecture: {book.title}
                </h5>
                <Button
                  variant="light"
                  size="sm"
                  onClick={() => setShowReader(false)}
                  style={{
                    borderRadius: '8px',
                    fontWeight: '600',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px'
                  }}
                >
                  <FiX size={18} />
                  Fermer
                </Button>
              </div>

              <div style={{ padding: '32px' }}>
                {book.book_type === 'audio' && (
                  <div className="text-center">
                    <audio controls src={book.file} className="w-100" style={{ borderRadius: '8px' }}>
                      Votre navigateur ne supporte pas l'élément audio.
                    </audio>
                  </div>
                )}

                {book.book_type === 'video' && (
                  <div className="text-center">
                    <video controls src={book.file} className="w-100" style={{ maxWidth: '800px', borderRadius: '12px' }}>
                      Votre navigateur ne supporte pas l'élément vidéo.
                    </video>
                  </div>
                )}

                {isTextBook && (
                  <div>
                    {bookContent ? (
                      <>
                        <div style={{
                          minHeight: '400px',
                          padding: '24px',
                          background: 'var(--color-bodyBg)',
                          borderRadius: '12px',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text)',
                          lineHeight: '1.8',
                          fontSize: '1rem',
                          overflowY: 'auto',
                          maxHeight: '600px'
                        }}>
                          {currentTextPage.split('\n').map((paragraph, index) => (
                            <p key={index} style={{ marginBottom: '16px' }}>{paragraph}</p>
                          ))}
                        </div>

                        <div style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          marginTop: '24px',
                          padding: '16px',
                          background: 'var(--color-bodyBg)',
                          borderRadius: '12px'
                        }}>
                          <Button
                            variant="outline-primary"
                            onClick={handlePrevPage}
                            disabled={currentPage === 1}
                            style={{
                              borderRadius: '8px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '10px 20px'
                            }}
                          >
                            <FiChevronLeft size={18} />
                            Précédent
                          </Button>
                          <span style={{ fontWeight: '600', color: 'var(--color-text)' }}>
                            Page {currentPage} / {totalPages}
                          </span>
                          <Button
                            variant="outline-primary"
                            onClick={handleNextPage}
                            disabled={currentPage === totalPages}
                            style={{
                              borderRadius: '8px',
                              fontWeight: '600',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '10px 20px'
                            }}
                          >
                            Suivant
                            <FiChevronRight size={18} />
                          </Button>
                        </div>

                        <div style={{ marginTop: '16px' }}>
                          <ProgressBar
                            now={readingProgress}
                            label={`${Math.round(readingProgress)}%`}
                            style={{ height: '12px', borderRadius: '6px' }}
                          />
                        </div>
                      </>
                    ) : (
                      <div className="text-center" style={{ paddingTop: '100px' }}>
                        <Spinner animation="border" style={{ color: 'var(--color-primary)' }} />
                        <p style={{ marginTop: '16px', color: 'var(--color-textSecondary)' }}>Chargement du contenu...</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </Container>
  )
}

export default BookDetail
