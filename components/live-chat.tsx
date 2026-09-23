'use client'

import { useState, useEffect } from 'react'

export default function LiveChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [chatMessages, setChatMessages] = useState<Array<{ role: 'user' | 'agent'; text: string }>>([
    { role: 'agent', text: '¡Hola! ¿En qué podemos ayudarte hoy?' }
  ])

  // Solo mostrar en producción si está configurado
  const chatEnabled = process.env.NEXT_PUBLIC_CHAT_ENABLED === 'true'

  useEffect(() => {
    if (!chatEnabled) return

    // Aquí puedes integrar servicios como:
    // - Intercom
    // - Tawk.to
    // - Crisp
    // - Zendesk Chat
    // Por ahora, implementaremos un chat básico local
  }, [chatEnabled])

  if (!chatEnabled) return null

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (!message.trim()) return

    setChatMessages([...chatMessages, { role: 'user', text: message }])
    setMessage('')

    // Simular respuesta del agente
    setTimeout(() => {
      setChatMessages(prev => [...prev, { 
        role: 'agent', 
        text: 'Gracias por tu mensaje. Un agente te responderá pronto.' 
      }])
    }, 1000)
  }

  return (
    <>
      {/* Botón flotante */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 bg-primary text-primary-foreground p-4 rounded-full shadow-lg hover:scale-110 transition-transform"
        aria-label="Abrir chat"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
          </svg>
        )}
      </button>

      {/* Ventana de chat */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-80 max-w-[calc(100vw-3rem)] bg-card border border-border rounded-lg shadow-xl">
          <div className="bg-primary text-primary-foreground p-4 rounded-t-lg">
            <h3 className="font-semibold">Chat de Soporte</h3>
            <p className="text-sm opacity-90">Tornilleria Jehova Jireh</p>
          </div>

          <div className="h-80 overflow-y-auto p-4 space-y-3">
            {chatMessages.map((msg, index) => (
              <div
                key={index}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    msg.role === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
            <div className="flex gap-2">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Escribe tu mensaje..."
                className="flex-1 px-3 py-2 border border-input rounded-lg bg-background text-sm outline-none focus:ring-2 focus:ring-primary"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
              >
                Enviar
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  )
}
