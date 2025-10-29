import React, { useState, useEffect } from 'react';
import { messageService } from '../services/messageService';
import { Mail, Send, MessageCircle, ArrowLeft } from 'lucide-react';
import '../styles/Messagerie.css';

const Messagerie = ({ userId }) => {
  const getStoredUserId = () => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      return user.id;
    } catch {
      return null;
    }
  };
  
  const currentUserId = userId || getStoredUserId();
  
  const [view, setView] = useState('conversations');
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedContact, setSelectedContact] = useState(null);
  const [showCompose, setShowCompose] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newMessage, setNewMessage] = useState({ destinataire_id: '', sujet: '', contenu: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (currentUserId) {
      loadConversations();
      loadUsers();
      loadUnreadCount();
    }
  }, [currentUserId]);

  const loadConversations = async () => {
    try {
      const result = await messageService.getConversations(currentUserId);
      if (result.success) setConversations(result.data);
    } catch (error) {
      console.error('Erreur chargement conversations:', error);
    }
  };

  const loadConversation = async (contactId, contactNom) => {
    try {
      const result = await messageService.getConversation(currentUserId, contactId);
      if (result.success) {
        setMessages(result.data);
        setSelectedContact({ id: contactId, nom: contactNom });
        setView('discussion');
      }
    } catch (error) {
      console.error('Erreur chargement conversation:', error);
    }
  };

  const loadUsers = async () => {
    try {
      const result = await messageService.getUsers(currentUserId);
      if (result.success) setUsers(result.data);
    } catch (error) {
      console.error('Erreur chargement utilisateurs:', error);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const result = await messageService.getUnreadCount(currentUserId);
      if (result.success) setUnreadCount(result.count);
    } catch (error) {
      console.error('Erreur comptage messages:', error);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!currentUserId) {
      alert('Erreur: Utilisateur non identifié');
      return;
    }
    setLoading(true);
    try {
      await messageService.sendMessage({
        expediteur_id: currentUserId,
        ...newMessage
      });
      setNewMessage({ destinataire_id: '', sujet: '', contenu: '' });
      setShowCompose(false);
      loadConversations();
      if (selectedContact) loadConversation(selectedContact.id, selectedContact.nom);
    } catch (error) {
      console.error('Erreur envoi:', error);
      alert('Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickReply = async (e) => {
    e.preventDefault();
    if (!newMessage.contenu.trim()) return;
    if (!currentUserId) {
      alert('Erreur: Utilisateur non identifié');
      return;
    }
    setLoading(true);
    try {
      await messageService.sendMessage({
        expediteur_id: currentUserId,
        destinataire_id: selectedContact.id,
        sujet: 'Re: Discussion',
        contenu: newMessage.contenu
      });
      setNewMessage({ destinataire_id: '', sujet: '', contenu: '' });
      loadConversation(selectedContact.id, selectedContact.nom);
    } catch (error) {
      console.error('Erreur envoi:', error);
      alert('Erreur lors de l\'envoi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="messagerie-container">
      <div className="messagerie-header">
        <h2>
          <Mail /> Messagerie {unreadCount > 0 && <span className="badge">{unreadCount}</span>}
        </h2>
        <button onClick={() => setShowCompose(!showCompose)} className="btn-primary">
          <Send /> Nouveau message
        </button>
      </div>

      {showCompose && (
        <form onSubmit={handleSend} className="compose-form">
          <select value={newMessage.destinataire_id} onChange={(e) => setNewMessage({...newMessage, destinataire_id: e.target.value})} required>
            <option value="">Sélectionner un destinataire</option>
            {users.map(user => (
              <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
            ))}
          </select>
          <input type="text" placeholder="Sujet" value={newMessage.sujet} onChange={(e) => setNewMessage({...newMessage, sujet: e.target.value})} required />
          <textarea placeholder="Message" rows="4" value={newMessage.contenu} onChange={(e) => setNewMessage({...newMessage, contenu: e.target.value})} required />
          <div className="form-actions">
            <button type="submit" disabled={loading}>Envoyer</button>
            <button type="button" onClick={() => setShowCompose(false)}>Annuler</button>
          </div>
        </form>
      )}

      {view === 'conversations' && (
        <div className="conversations-list">
          {conversations.length === 0 ? (
            <div className="empty-state">
              <MessageCircle size={48} />
              <h3>Aucune conversation</h3>
              <p>Cliquez sur "Nouveau message" pour démarrer une conversation</p>
            </div>
          ) : (
            conversations.map(conv => (
              <div key={conv.contact_id} className="conversation-item" onClick={() => loadConversation(conv.contact_id, conv.contact_nom)}>
                <div className="conversation-header">
                  <MessageCircle size={20} />
                  <strong>{conv.contact_nom}</strong>
                  {conv.non_lus > 0 && <span className="badge">{conv.non_lus}</span>}
                </div>
                <p className="conversation-date">{new Date(conv.derniere_date).toLocaleString()}</p>
              </div>
            ))
          )}
        </div>
      )}

      {view === 'discussion' && selectedContact && (
        <div className="discussion-view">
          <div className="discussion-header">
            <button onClick={() => { setView('conversations'); setSelectedContact(null); }}>
              <ArrowLeft /> Retour
            </button>
            <h3>{selectedContact.nom}</h3>
          </div>
          <div className="messages-list">
            {messages.length === 0 ? (
              <div className="empty-state">
                <MessageCircle size={48} />
                <p>Aucun message dans cette conversation</p>
                <p>Envoyez le premier message ci-dessous</p>
              </div>
            ) : (
              messages.map(msg => (
                <div key={msg.id} className={`message-bubble ${String(msg.expediteur) === String(currentUserId) ? 'sent' : 'received'}`}>
                  <div className="message-content">
                    {msg.sujet && <strong>{msg.sujet}</strong>}
                    <p>{msg.contenu}</p>
                  </div>
                  <span className="message-time">{new Date(msg.created_at).toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
          <form onSubmit={handleQuickReply} className="quick-reply">
            <input type="text" placeholder="Votre message..." value={newMessage.contenu} onChange={(e) => setNewMessage({...newMessage, contenu: e.target.value})} required />
            <button type="submit" disabled={loading}><Send size={18} /></button>
          </form>
        </div>
      )}
    </div>
  );
};

export default Messagerie;
