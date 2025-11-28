"use client"

import { useState, useEffect, useRef } from "react"
import { Container, Row, Col, Card, Form, Button, Badge, Dropdown, Alert } from "react-bootstrap"
import { useSelector, useDispatch } from "react-redux"
import { fetchChannels, fetchMessages, sendMessage, setActiveChannel } from "../store/slices/chatSlice"

const Chat = () => {
  const dispatch = useDispatch()
  const { user } = useSelector((state) => state.auth)
  const { channels, activeChannel, messages, loading, error } = useSelector((state) => state.chat)

  const [newMessage, setNewMessage] = useState("")
  const messagesEndRef = useRef(null)

  // Charger les canaux au montage
  useEffect(() => {
    dispatch(fetchChannels())
  }, [dispatch])

  // Charger les messages quand un canal est sélectionné
  useEffect(() => {
    if (activeChannel) {
      dispatch(fetchMessages(activeChannel.id))
    }
  }, [activeChannel, dispatch])

  // Auto-scroll vers le bas
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async (e) => {
    e.preventDefault()
    if (newMessage.trim() && activeChannel) {
      try {
        await dispatch(sendMessage({ channelId: activeChannel.id, content: newMessage.trim() })).unwrap()
        setNewMessage("")
      } catch (error) {
        console.error("Erreur lors de l'envoi:", error)
      }
    }
  }

  const handleChannelSelect = (channel) => {
    dispatch(setActiveChannel(channel))
  }

  const getRoleBadge = (role) => {
    const roleConfig = {
      enseignant: { variant: "primary", text: "Enseignant" },
      chef_departement: { variant: "success", text: "Chef Dép." },
      etudiant: { variant: "secondary", text: "Étudiant" },
      assistant: { variant: "info", text: "Assistant" },
    }
    const config = roleConfig[role] || { variant: "dark", text: "Utilisateur" }
    return (
      <Badge bg={config.variant} className="ms-2">
        {config.text}
      </Badge>
    )
  }

  const formatTime = (timestamp) => {
    const date = new Date(timestamp)
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  }

  const selectedChannelData = channels.find((c) => c.id === activeChannel?.id)

  return (
    <Container fluid className="mt-3">
      <Row style={{ height: "90vh" }}>
        {/* Sidebar - Liste des canaux */}
        <Col md={3} style={{ height: "100%" }}>
          <Card className="shadow-sm border-0 rounded-3" style={{ height: "100%", overflowY: "scroll" }}>
            <Card.Header className="bg-primary text-white rounded-top-3">
              <h6 className="mb-0">Canaux de Discussion</h6>
            </Card.Header>
            <Card.Body className="p-0">
              {loading && !channels.length ? (
                <div className="text-center p-3">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Chargement...</span>
                  </div>
                </div>
              ) : channels.length === 0 ? (
                <Alert variant="info" className="m-3">Aucun canal disponible</Alert>
              ) : (
                channels.map((channel) => (
                  <div
                    key={channel.id}
                    className={`p-3 border-bottom ${
                      activeChannel?.id === channel.id ? "bg-light text-primary fw-bold" : "text-dark"
                    }`}
                    onClick={() => handleChannelSelect(channel)}
                    style={{ cursor: "pointer" }}
                  >
                    <div className="d-flex justify-content-between">
                      <span># {channel.name}</span>
                      {channel.member_count && <Badge bg="secondary">{channel.member_count}</Badge>}
                    </div>
                    {channel.description && (
                      <small className="text-muted d-block mt-1">{channel.description}</small>
                    )}
                  </div>
                ))
              )}
            </Card.Body>
          </Card>
        </Col>

        {/* Zone de chat */}
        <Col md={9}>
          {!activeChannel ? (
            <Card className="shadow-sm border-0 rounded-3" style={{ height: "75vh" }}>
              <Card.Body className="d-flex align-items-center justify-content-center">
                <div className="text-center">
                  <i className="fas fa-comments fa-3x text-muted mb-3"></i>
                  <h5 className="text-muted">Sélectionnez un canal pour commencer</h5>
                </div>
              </Card.Body>
            </Card>
          ) : (
            <Card className="shadow-sm border-0 rounded-3" style={{ height: "75vh" }}>
              <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="mb-0 text-primary"># {selectedChannelData?.name || "Canal"}</h6>
                  <small className="text-muted">
                    {selectedChannelData?.member_count || 0} participants
                  </small>
                </div>
                <Dropdown>
                  <Dropdown.Toggle variant="light" size="sm">
                    ⚙️
                  </Dropdown.Toggle>
                  <Dropdown.Menu>
                    <Dropdown.Item>📌 Messages épinglés</Dropdown.Item>
                    <Dropdown.Item>🔍 Rechercher</Dropdown.Item>
                    <Dropdown.Item>📁 Fichiers partagés</Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Card.Header>

              {/* Messages */}
              <Card.Body className="overflow-auto px-3" style={{ maxHeight: "60vh" }}>
                {error && (
                  <Alert variant="danger" dismissible>
                    {error}
                  </Alert>
                )}
                {loading && !messages.length ? (
                  <div className="text-center">
                    <div className="spinner-border" role="status">
                      <span className="visually-hidden">Chargement...</span>
                    </div>
                  </div>
                ) : messages.length === 0 ? (
                  <Alert variant="info" className="text-center">
                    Aucun message. Soyez le premier à écrire 👋
                  </Alert>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`d-flex mb-3 ${
                        msg.sender?.id === user?.id ? "justify-content-end" : "justify-content-start"
                      }`}
                    >
                      <div
                        className={`p-2 rounded-3 shadow-sm ${
                          msg.sender?.id === user?.id ? "bg-primary text-white" : "bg-light text-dark"
                        }`}
                        style={{ maxWidth: "70%" }}
                      >
                        <div className="d-flex align-items-center mb-1">
                          <small className="fw-bold">
                            {msg.sender?.first_name} {msg.sender?.last_name}
                          </small>
                          {msg.sender?.role && getRoleBadge(msg.sender.role)}
                          <small className="ms-2 text-muted">{formatTime(msg.created_at)}</small>
                        </div>
                        <div>{msg.content}</div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </Card.Body>

              {/* Input */}
              <Card.Footer className="bg-light">
                <Form onSubmit={handleSendMessage}>
                  <div className="d-flex">
                    <Form.Control
                      type="text"
                      placeholder={`Écrire dans # ${selectedChannelData?.name || "canal"}...`}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      className="me-2 rounded-pill"
                      disabled={loading}
                    />
                    <Button
                      type="submit"
                      variant="primary"
                      className="rounded-pill px-4"
                      disabled={!newMessage.trim() || loading}
                    >
                      Envoyer
                    </Button>
                  </div>
                </Form>
              </Card.Footer>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  )
}

export default Chat
