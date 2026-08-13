"use client"

import { useState, useEffect, useRef } from "react"
import { Container, Row, Col, Card, Form, Button, Badge, Dropdown, Alert } from "react-bootstrap"
import { useSelector, useDispatch } from "react-redux"
import { motion } from "framer-motion"
import { FiSend, FiHash, FiUsers, FiMessageCircle, FiMoreVertical } from "react-icons/fi"
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
    // messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
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
    <Container fluid style={{ padding: '24px', background: 'var(--color-bodyBg)', Height: '85vh' }}>
      <Row style={{ height: "calc(100vh - 100px)" }}>
        {/* Sidebar - Liste des canaux */}
        <Col md={3} style={{ height: "90%" }}>
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              height: "100%",
              background: 'var(--color-cardBg)',
              border: '1px solid var(--color-border)',
              borderRadius: '16px',
              overflow: 'hidden',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{
              padding: '20px',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              color: 'white'
            }}>
              <h6 style={{ margin: 0, fontWeight: '700', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FiMessageCircle size={20} /> Canaux de Discussion
              </h6>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {loading && !channels.length ? (
                <div className="text-center p-3">
                  <div className="spinner-border spinner-border-sm" role="status">
                    <span className="visually-hidden">Chargement...</span>
                  </div>
                </div>
              ) : channels.length === 0 ? (
                <Alert variant="info" className="m-3" style={{ borderRadius: '12px' }}>Aucun canal disponible</Alert>
              ) : (
                channels.map((channel) => {
                  const channelIcon = {
                    course: '📚',
                    section: '👥',
                    filiere: '🎓',
                    general: '💬'
                  }[channel.channel_type] || '💬'

                  return (
                    <motion.div
                      key={channel.id}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => handleChannelSelect(channel)}
                      style={{
                        padding: '12px 16px',
                        marginBottom: '4px',
                        borderRadius: '10px',
                        cursor: 'pointer',
                        background: activeChannel?.id === channel.id ? 'var(--color-primary)' : 'transparent',
                        color: activeChannel?.id === channel.id ? 'white' : 'var(--color-textPrimary)',
                        fontWeight: activeChannel?.id === channel.id ? '600' : '400',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div className="d-flex justify-content-between align-items-center">
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span>{channelIcon}</span> {channel.name}
                        </span>
                        {channel.participants_count > 0 && (
                          <Badge
                            bg={activeChannel?.id === channel.id ? 'light' : 'secondary'}
                            text={activeChannel?.id === channel.id ? 'dark' : 'white'}
                            style={{ borderRadius: '6px' }}
                          >
                            <FiUsers size={12} /> {channel.participants_count}
                          </Badge>
                        )}
                      </div>
                      {channel.latest_message && (
                        <small style={{
                          display: 'block',
                          marginTop: '4px',
                          opacity: 0.7,
                          fontSize: '0.75rem'
                        }}>
                          {channel.latest_message.sender_name}: {channel.latest_message.content}
                        </small>
                      )}
                    </motion.div>
                  )
                })
              )}
            </div>
          </motion.div>
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
                  <h6 className="mb-0" style={{ color: 'var(--color-primary)' }}>
                    {selectedChannelData?.name || "Canal"}
                  </h6>
                  <small className="text-muted">
                    <FiUsers size={12} /> {selectedChannelData?.participants_count || 0} participants
                    {selectedChannelData?.channel_type && (
                      <span className="ms-2">• {selectedChannelData.channel_type === 'course' ? 'Cours' : selectedChannelData.channel_type === 'section' ? 'Section' : selectedChannelData.channel_type === 'filiere' ? 'Filière' : 'Général'}</span>
                    )}
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
              <div style={{
                padding: '16px 24px',
                borderTop: '1px solid var(--color-border)',
                background: 'var(--color-bodyBg)'
              }}>
                <Form onSubmit={handleSendMessage}>
                  <div className="d-flex gap-2">
                    <Form.Control
                      type="text"
                      placeholder={`Écrire dans # ${selectedChannelData?.name || "canal"}...`}
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      disabled={loading}
                      style={{
                        borderRadius: '12px',
                        border: '1px solid var(--color-border)',
                        background: 'var(--color-cardBg)',
                        color: 'var(--color-textPrimary)',
                        padding: '12px 20px'
                      }}
                    />
                    <Button
                      type="submit"
                      disabled={!newMessage.trim() || loading}
                      style={{
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
                        border: 'none',
                        padding: '0 24px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontWeight: '600'
                      }}
                    >
                      <FiSend /> Envoyer
                    </Button>
                  </div>
                </Form>
              </div>
            </Card>
            // </motion.div>
          )}
        </Col>
      </Row>
    </Container>
  )
}

export default Chat
