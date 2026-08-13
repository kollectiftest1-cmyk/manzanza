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
    { id: "genedddral", name: "Discussion Générale", participants: 67 },
    { id: "genefral", name: "Discussion Générale", participants: 67 },
    { id: "genedzral", name: "Discussion Générale", participants: 67 },
  ]

  // Messages mock
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

  // Users mock
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
        user: user?.name || "Moi",
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
    }
    const config = roleConfig[role] || { variant: "dark", text: "Utilisateur" }
    return (
      <Badge bg={config.variant} className="ms-2">
        {config.text}
      </Badge>
    )
  }

  const formatTime = (date) => {
    return date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
  }

  const getStatusIcon = (status) => (status === "online" ? "🟢" : status === "away" ? "🟡" : "🔴")

  return (
    <Container fluid className="mt-3">
      <Row style={{height: "90vh"}}>
        {/* Sidebar */}
        <Col md={3} style={{height: "100%"}}>
          <Card className="shadow-sm border-0 rounded-3" style={{height: "55%", overflowY: "scroll"}}>
            <Card.Header className="bg-primary text-white rounded-top-3">
              <h6 className="mb-0">Canaux</h6>
            </Card.Header>
            <Card.Body className="p-0">
              {channels.map((channel) => (
                <div
                  key={channel.id}
                  className={`p-3 border-bottom ${
                    selectedChannel === channel.id ? "bg-light text-primary fw-bold" : "text-dark"
                  }`}
                  onClick={() => setSelectedChannel(channel.id)}
                  style={{ cursor: "pointer" }}
                >
                  <div className="d-flex justify-content-between">
                    <span># {channel.name}</span>
                    <Badge bg="secondary">{channel.participants}</Badge>
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>

          <Card className="shadow-sm border-0 mt-3 rounded-3 " style={{height: "45%"}}>
            <Card.Header className="bg-light rounded-top-3">
              <h6 className="mb-0">En ligne ({onlineUsers.length})</h6>
            </Card.Header>
            <Card.Body>
              {onlineUsers.map((u, i) => (
                <div key={i} className="d-flex align-items-center mb-2">
                  <span className="me-2">{getStatusIcon(u.status)}</span>
                  <div className="flex-grow-1">
                    <small className="fw-bold">{u.name}</small>
                    {getRoleBadge(u.role)}
                  </div>
                </div>
              ))}
            </Card.Body>
          </Card>
        </Col>

        {/* Chat */}
        <Col md={9}>
          <Card className="shadow-sm border-0 rounded-3" style={{ height: "75vh" }}>
            <Card.Header className="bg-white border-bottom d-flex justify-content-between align-items-center">
              <div>
                <h6 className="mb-0 text-primary"># {channels.find((c) => c.id === selectedChannel)?.name}</h6>
                <small className="text-muted">
                  {channels.find((c) => c.id === selectedChannel)?.participants} participants
                </small>
              </div>
              <Dropdown>
                <Dropdown.Toggle variant="light" size="sm">⚙️</Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item>📌 Messages épinglés</Dropdown.Item>
                  <Dropdown.Item>🔍 Rechercher</Dropdown.Item>
                  <Dropdown.Item>📁 Fichiers partagés</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Card.Header>

            {/* Messages */}
            <Card.Body className="overflow-auto px-3" style={{ maxHeight: "60vh" }}>
              {messages.length === 0 ? (
                <Alert variant="info" className="text-center">Aucun message. Soyez le premier 👋</Alert>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`d-flex mb-3 ${msg.user === (user?.name || "Moi") ? "justify-content-end" : "justify-content-start"}`}
                  >
                    <div
                      className={`p-2 rounded-3 shadow-sm ${
                        msg.user === (user?.name || "Moi")
                          ? "bg-primary text-white"
                          : "bg-light text-dark"
                      }`}
                      style={{ maxWidth: "70%" }}
                    >
                      <div className="d-flex align-items-center mb-1">
                        <small className="fw-bold">{msg.user}</small>
                        {getRoleBadge(msg.role)}
                        <small className="ms-2 text-muted">{formatTime(msg.timestamp)}</small>
                      </div>
                      <div>{msg.message}</div>
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
                    placeholder={`Écrire dans # ${channels.find((c) => c.id === selectedChannel)?.name}...`}
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="me-2 rounded-pill"
                  />
                  <Button type="submit" variant="primary" className="rounded-pill px-4" disabled={!newMessage.trim()}>
                    Envoyer
                  </Button>
                </div>
              </Form>
            </Card.Footer>
          </Card>
        </Col>
      </Row>
    </Container>
  )
}

export default Chat
