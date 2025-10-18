import { useState, useRef, useEffect } from 'react';
import { Send, Check, CheckCheck, Clock, User, Building2, X } from 'lucide-react';
import './ChatComponent.css';
import { getAuth } from 'firebase/auth';

const ChatComponent = ({ plannerId, vendorId, eventId, currentUser, otherUser, closeChat }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  function formatDate(date) {
    if (!date) return "";
    if (typeof date === 'object' && typeof date._seconds === 'number') {
      return new Date(date._seconds * 1000 + date._nanoseconds / 1e6).toLocaleString();
    }
    if (date instanceof Date) return date.toLocaleString();
    if (typeof date === "string") return new Date(date).toLocaleString
    return String(date);
  }

  const fetchMessages = async (eventId, plannerId, vendorId) => {
    try{
      const auth = getAuth();
      const user = auth.currentUser;
      const token = await user.getIdToken(true);

      const res = await fetch(`https://us-central1-planit-sdp.cloudfunctions.net/api/chats/${eventId}/${plannerId}/${vendorId}/messages`, {
        method: "GET",
        headers: { "Authorization": `Bearer ${token}` }
      });

      if (!res) throw new Error("Failed to fetch messages");
      const data = await res.json();
      return data.messages;
    }catch(err){
      console.error("Could not fetch messages");
      alert("Failed to fetch messages");
      return [];
    }
  };

  const sendMessage = async (eventId, plannerId, vendorId, content) => {

    try{
      const auth = getAuth();
      const user = auth.currentUser;
      const token = await user.getIdToken(true);

      const res = await fetch(`https://us-central1-planit-sdp.cloudfunctions.net/api/chats/${eventId}/${plannerId}/${vendorId}/messages`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(content)
      });

      if (!res) throw new Error("Failed to send message") ;
    }catch(err){
      console.error(err);
    }

  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    const mess = await fetchMessages(eventId, plannerId, vendorId);
    if (!mess) return alert("Failed to fetch messages");
    setMessages(mess);
  };

  useEffect(() => { scrollToBottom(); }, [messages]);
  useEffect(() => { loadMessages(); }, []);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const message = {
      senderId: currentUser.id,
      senderName: currentUser.name,
      senderType: currentUser.type,
      content: newMessage.trim(),
      timestamp: new Date(),
      status: 'sent'
    };

    await sendMessage(eventId, plannerId, vendorId, message);
    setMessages(prev => [...prev, message]);
    setNewMessage('');

    setTimeout(() => {
      setMessages(prev =>
        prev.map(msg => msg.id === message.id ? { ...msg, status: 'delivered' } : msg)
      );
    }, 1000);
  };

  const getMessageStatus = (status) => {
    switch (status) {
      case 'sent': return <Check className="chat-message-status" size={14} />;
      case 'delivered': return <CheckCheck className="chat-message-status" size={14} />;
      case 'read': return <CheckCheck className="chat-message-status chat-message-status-read" size={14} />;
      default: return <Clock className="chat-message-status" size={14} />;
    }
  };

  return (
    <section className='chat-container-overlay'>
      <section data-testid="chat-component" className="chat-container" role="main" aria-label="Chat conversation">
        <header data-testid="chat-header" className="chat-header">
          <section className="chat-participants">
            <section className="chat-participant">
              {currentUser.type === 'vendor' ? <Building2 size={20} /> : <User size={20} />}
              <span data-testid ="curr-name">{currentUser.name}</span>
              <span className="chat-participant-type">({currentUser.type})</span>
            </section>
            <span className="chat-divider">↔</span>
            <section className="chat-participant">
              {otherUser.type === 'vendor' ? <Building2 size={20} /> : <User size={20} />}
              <span data-testid="other-name">{otherUser.name}</span>
              <span className="chat-participant-type">({otherUser.type})</span>
            </section>
          </section>
          <section className="chat-service-context">
            <button data-testid="close-chat"onClick={() => closeChat()}>
              <X />
            </button>
          </section>
        </header>

        <main className="chat-messages-container" role="log" aria-label="Chat messages">
          <section className="chat-messages-list">
            {messages.map((message) => {
              const isCurrentUser = message.senderName === currentUser.name;
              console.log(isCurrentUser);
              return (
                <article
                  key={message.id}
                  className={`chat-message ${isCurrentUser ? 'chat-message-sent' : 'chat-message-received'}`}
                  aria-label={`Message from ${message.senderName}`}
                >
                  <section className={`chat-message-content ${isCurrentUser ? 'chat-message-content-sent' : 'chat-message-content-received'}`}>
                    <section className="chat-message-header">
                      <span className="chat-sender-name">{message.senderName}</span>
                      <span className="chat-sender-type">({message.senderType})</span>
                      <time className="chat-message-time" dateTime={formatDate(message.createdAt)}>
                        {formatDate(message.createdAt)}
                      </time>
                    </section>
                    <section className="chat-message-text">{message.content}</section>
                    {isCurrentUser && (
                      <section className="chat-message-status-container">
                        {getMessageStatus(message.status)}
                      </section>
                    )}
                  </section>
                </article>
              );
            })}

            {isTyping && (
              <section className="chat-typing-indicator" aria-label={`${otherUser.name} is typing`}>
                <section className="chat-typing-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </section>
                <span className="chat-typing-text">{otherUser.name} is typing...</span>
              </section>
            )}

            <div ref={messagesEndRef} />
          </section>
        </main>

        <footer className="chat-message-input-container">
          <form onSubmit={handleSendMessage} className="chat-message-form">
            <textarea
              data-testid="message-input-area"
              value={newMessage}
              onChange={e => setNewMessage(e.target.value)}
              placeholder={`Message ${otherUser.name}...`}
              className="chat-message-input"
              rows={1}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSendMessage(e); }}
              aria-label="Type your message"
            />
            <button
              data-testid="send-button"
              type="submit"
              className="chat-send-button"
              disabled={!newMessage.trim()}
              aria-label="Send message"
            >
              <Send size={20} />
            </button>
          </form>
        </footer>
      </section>
    </section>
  );
};

export default ChatComponent;