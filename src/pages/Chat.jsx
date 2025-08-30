"use client"

import { useState, useEffect, useRef } from "react"
import { Container, Row, Col, Card, Form, Button, Badge, Dropdown, Alert } from "react-bootstrap"
import { useSelector } from "react-redux"

const Chat = () => {
  const { user } = useSelector((state) => state.auth)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [selectedChannel, setSelectedChannel] = useState("comptabilite-generale")
  const [onlineUsers, setOnlineUsers] = useState([])
  const messagesEndRef = useRef(null)

  const channels = [
    { id: "comptabilite-generale", name: "Comptabilité Générale", participants: 45 },
    { id: "economie", name: "Économie", participants: 38 },
    { id: "mathematiques-financieres", name: "Mathématiques Financières", participants: 32 },
    { id: "droit-commercial", name: "Droit Commercial", participants: 28 },
    { id: "general", name: "Discussion Générale", participants: 67 },
  ]

  // Mock messages
  useEffect(() => {
    const mockMessages = [
      {
        id: 1,
        user: "Prof. Martin Dubois",
        role: "titulaire",
        message: "Bonjour à tous ! N'oubliez pas que le TP de demain portera sur les écritures comptables.",
        timestamp: new Date(Date.now() - 3600000),
        channel: "comptabilite-generale",
      },
      {
        id: 2,
        user: "Marie Kouassi",
        role: "etudiant",
        message: "Professeur, pouvez-vous nous rappeler les documents à apporter ?",
        timestamp: new Date(Date.now() - 3000000),
        channel: "comptabilite-generale",
      },
      {
        id: 3,
        user: "Assistant IA",
        role: "ia",
        message:
          "Pour le TP de comptabilité, vous devez apporter : calculatrice, plan comptable, et vos notes de cours. 📚",
        timestamp: new Date(Date.now() - 2400000),
        channel: "comptabilite-generale",
      },
      {
        id: 4,
        user: "Jean Koffi",
        role: "etudiant",
        message: "Merci ! Est-ce que quelqu'un peut partager les exercices d'entraînement ?",
        timestamp: new Date(Date.now() - 1800000),
        channel: "comptabilite-generale",
      },
      {
        id: 5,
        user: "Dr. Adjoua Yao",
        role: "chef_departement",
        message: 'Les exercices sont disponibles sur la plateforme. Section "Ressources" > "TP/TD".',
        timestamp: new Date(Date.now() - 900000),
        channel: "comptabilite-generale",
      },
    ]
    setMessages(mockMessages.filter((msg) => msg.channel === selectedChannel))
  }, [selectedChannel])

  // Mock online users
  useEffect(() => {
    setOnlineUsers([
      { name: "Prof. Martin Dubois", role: "titulaire", status: "online" },
      { name: "Dr. Adjoua Yao", role: "chef_departement", status: "online" },
      { name: "Assistant IA", role: "ia", status: "online" },
      { name: "Marie Kouassi", role: "etudiant", status: "online" },
      { name: "Jean Koffi", role: "etudiant", status: "away" },
      { name: "Fatou Traoré", role: "etudiant", status: "online" },
    ])
  }, [])

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = (e) => {
    e.preventDefault()
    if (newMessage.trim()) {
      const message = {
        id: Date.now(),
        user: user?.name || "Utilisateur",
        role: user?.role || "etudiant",
        message: newMessage,
        timestamp: new Date(),
        channel: selectedChannel,
      }
      setMessages([...messages, message])
      setNewMessage("")
    }
  }

  const getRoleBadge = (role) => {
    const roleConfig = {
      titulaire: { variant: "primary", text: "Titulaire" },
      chef_departement: { variant: "success", text: "Chef Dép." },
      ia: { variant: "info", text: "IA" },
      etudiant: { variant: "secondary", text: "Étudiant" },
      assistant: { variant: "warning", text: "Assistant" },
    }
    const config = roleConfig[role] || { variant: "secondary", text: "Utilisateur" }
    return (
      <Badge bg={config.variant} className="ms-2">
        {config.text}
      </Badge>
    )
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString("fr-FR", {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const getStatusIcon = (status) => {
    return status === "online" ? "🟢" : status === "away" ? "🟡" : "🔴"
  }

  return (
    <Container fluid className="mt-4">
      <Row>
        {/* Sidebar - Channels */}
        <Col md={3}>
          <Card className="shadow">
            <Card.Header>
              <h6 className="mb-0">Canaux de Discussion</h6>
            </Card.Header>
            <Card.Body className="p-0">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className={`p-3 border-bottom cursor-pointer ${selectedChannel === channel.id ? "bg-primary text-white" : ""}`}
                  onClick={() => setSelectedChannel(channel.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="d-flex justify-content-between">
                    <span># {channel.name}</span>
                    <Badge
                      bg={selectedChannel === channel.id ? "light" : "primary"}
                      text={selectedChannel === channel.id ? "dark" : "white"}
                    >
                      {channel.participants}
                    </Badge>
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>

          {/* Online Users */}
          <Card className="shadow mt-3">
            <Card.Header>
              <h6 className="mb-0">En Ligne ({onlineUsers.length})</h6>
            </Card.Header>
            <Card.Body>
              {onlineUsers.map((user, index) => (
                <div key={index} className="d-flex align-items-center mb-2">
                  <span className="me-2">{getStatusIcon(user.status)}</span>
                  <div className="flex-grow-1">
                    <small className="d-block">{user.name}</small>
                    {getRoleBadge(user.role)}
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>

        {/* Main Chat */}
        <Col md={9}>
          <Card className="shadow" style={{ height: "70vh" }}>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <div>
                <h5 className="mb-0"># {channels.find((c) => c.id === selectedChannel)?.name}</h5>
                <small className="text-muted">
                  {channels.find((c) => c.id === selectedChannel)?.participants} participants
                </small>
              </div>
              <Dropdown>
                <Dropdown.Toggle variant="outline-secondary" size="sm">
                  Options
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item>📌 Messages épinglés</Dropdown.Item>
                  <Dropdown.Item>🔍 Rechercher</Dropdown.Item>
                  <Dropdown.Item>📁 Fichiers partagés</Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item>⚙️ Paramètres du canal</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Card.Header>

            {/* Messages */}
            <Card.Body className="overflow-auto" style={{ maxHeight: "50vh" }}>
              {messages.length === 0 ? (
                <Alert variant="info" className="text-center">
                  Aucun message dans ce canal. Soyez le premier à écrire ! 👋
                </Alert>
              ) : (
                messages.map((message) => (
                  <div key={message.id} className="mb-3">
                    <div className="d-flex align-items-start">
                      <div className="flex-grow-1">
                        <div className="d-flex align-items-center mb-1">
                          <strong className="me-2">{message.user}</strong>
                          {getRoleBadge(message.role)}
                          <small className="text-muted ms-2">{formatTime(message.timestamp)}</small>
                        </div>
                        <div className="message-content">{message.message}</div>
                      </div>
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </Card.Body>

            {/* Message Input */}
            <Card.Footer>
              <Form onSubmit={handleSendMessage}>
                <div className="d-flex">
                  <Form.Control
                    type="text"
                    placeholder={`Écrire dans # ${channels.find((c) => c.id === selectedChannel)?.name}...`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="me-2"
                  />
                  <Button type="submit" variant="primary" disabled={!newMessage.trim()}>
                    Envoyer
                  </Button>
                </div>
              </Form>
              <small className="text-muted mt-1 d-block">💡 Utilisez @nom pour mentionner quelqu'un</small>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Chat
