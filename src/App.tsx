import React, { useState, useEffect } from 'react';
import { DatabaseState, Apartment, EmailAlert, ViewingEvent, UploadedFile, ChatMessage } from './types';
import Header from './components/Header';
import AnalyticsGrid from './components/AnalyticsGrid';
import ZurcherMap from './components/ZurcherMap';
import ApartmentList from './components/ApartmentList';
import EmailFeed from './components/EmailFeed';
import DossierManager from './components/DossierManager';
import CoPilotChat from './components/CoPilotChat';
import { AnimatePresence, motion } from 'motion/react';
import { Sparkles, HelpCircle, CheckCircle2, RefreshCw, Calendar, Mail, FileText, Compass, MessageSquare, Globe, Link, Zap, Key } from 'lucide-react';

export default function App() {
  const [database, setDatabase] = useState<DatabaseState | null>(null);
  const [selectedApartmentId, setSelectedApartmentId] = useState<string | undefined>(undefined);
  const [activeLeftTab, setActiveLeftTab] = useState<'apartments' | 'inbox'>('apartments');
  const [activeRightTab, setActiveRightTab] = useState<'chat' | 'dossier'>('chat');
  
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isChatting, setIsChatting] = useState<boolean>(false);
  const [isImportingDoc, setIsImportingDoc] = useState<boolean>(false);
  const [isCreatingDoc, setIsCreatingDoc] = useState<boolean>(false);
  const [oauthConnected, setOauthConnected] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isOauthModalOpen, setIsOauthModalOpen] = useState<boolean>(false);
  const [customClientId, setCustomClientId] = useState<string>(() => localStorage.getItem('google_client_id') || '');
  const [manualTokenInput, setManualTokenInput] = useState<string>('');
  const [isArchivingInProgress, setIsArchivingInProgress] = useState<boolean>(false);

  // Web-Scrobbler Scraping credentials and states
  const [isScrapingModalOpen, setIsScrapingModalOpen] = useState<boolean>(false);
  const [isSavingScraping, setIsSavingScraping] = useState<boolean>(false);
  const [isScrapingLinkMap, setIsScrapingLinkMap] = useState<Record<string, boolean>>({});
  const [modalScrapingToken, setModalScrapingToken] = useState<string>('');
  const [modalQuotaMax, setModalQuotaMax] = useState<number>(1000);
  const [modalQuotaUsed, setModalQuotaUsed] = useState<number>(58);

  // Status Notification states
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'info' | 'error'>('info');

  // Load initial database state
  useEffect(() => {
    fetchDatabase();
    
    // Read cached login if any
    const cachedToken = localStorage.getItem('google_access_token');
    if (cachedToken) {
      setAccessToken(cachedToken);
      setOauthConnected(true);
    }
  }, []);

  // Synchronize scraping states with loaded database state
  useEffect(() => {
    if (database) {
      setModalScrapingToken(database.scrapingToken || '');
      setModalQuotaMax(database.scrapingQuotaMax || 1000);
      setModalQuotaUsed(database.scrapingQuotaUsed || 0);
    }
  }, [database]);

  // Listen for Google OAuth callback from popup page
  useEffect(() => {
    const handleOauthMessage = (event: MessageEvent) => {
      // Validate origin is safe (same origin, or cloud run, or localhost/dev)
      const origin = event.origin;
      const isAllowedOrigin = 
        origin === window.location.origin ||
        origin.endsWith('.run.app') || 
        origin.includes('localhost') || 
        origin.includes('3000') ||
        origin.includes('onrender.com');
        
      if (!isAllowedOrigin) {
        return;
      }
      
      if (event.data?.type === 'OAUTH_AUTH_SUCCESS' && event.data?.token) {
        const token = event.data.token;
        localStorage.setItem('google_access_token', token);
        setAccessToken(token);
        setOauthConnected(true);
        setIsOauthModalOpen(false);
        showToast('Erfolgreich mit aktivem Google Workspace-Konto authentifiziert!', 'success');
      }
    };
    window.addEventListener('message', handleOauthMessage);
    return () => window.removeEventListener('message', handleOauthMessage);
  }, []);

  // CROSS-ORIGIN SANDBOX BACKUP EFFECT: Listen for storage change events
  // This allows the auth popup to simply write to localStorage, and the main window automatically detects it
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'google_access_token' && e.newValue) {
        const token = e.newValue;
        if (token && token.length > 15 && token !== accessToken) {
          setAccessToken(token);
          setOauthConnected(true);
          setIsOauthModalOpen(false);
          showToast('Google Workspace erfolgreich synchronisiert!', 'success');
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [accessToken]);

  // SECONDARY RETRY BACKUP ENGINE: Active polling synchronizer
  // Polling checks localStorage once a second while the OAuth Dialog is active
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isOauthModalOpen) {
      interval = setInterval(() => {
        const token = localStorage.getItem('google_access_token');
        if (token && token.length > 15 && token !== accessToken) {
          setAccessToken(token);
          setOauthConnected(true);
          setIsOauthModalOpen(false);
          showToast('Google Workspace erfolgreich verbunden!', 'success');
        }
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOauthModalOpen, accessToken]);

  const fetchDatabase = async () => {
    try {
      const res = await fetch('/api/database');
      if (res.ok) {
        const data: DatabaseState = await res.json();
        setDatabase(data);
        // Default select first apartment
        if (data.apartments.length > 0 && !selectedApartmentId) {
          setSelectedApartmentId(data.apartments[0].id);
        }
      }
    } catch (e) {
      console.error('Failed to load database state from API', e);
      showToast('Offline-Modus', 'error');
    }
  };

  const handleScrapeLink = async (url: string, emailId: string) => {
    setIsScrapingLinkMap(prev => ({ ...prev, [url]: true }));
    try {
      const res = await fetch('/api/scrape-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url, emailId })
      });
      const data = await res.json();
      if (data.success) {
        setDatabase(data.database);
        showToast(data.message || "Inserat erfolgreich gescrobbelt!", 'success');
      } else {
        showToast("Scraping fehlgeschlagen: " + (data.error || "Unbekannter Fehler"), 'error');
      }
    } catch (err) {
      console.error("Scraping connection failed:", err);
      showToast("Konnte temporär keine Verbindung zum Scraper aufbauen.", 'error');
    } finally {
      setIsScrapingLinkMap(prev => ({ ...prev, [url]: false }));
    }
  };

  const handleUpdateScrapingConfig = async (token: string, quotaMax: number, quotaUsed: number) => {
    setIsSavingScraping(true);
    try {
      const res = await fetch('/api/scraping/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token, quotaMax, quotaUsed })
      });
      const data = await res.json();
      if (data.success) {
        setDatabase(data.database);
        showToast("Scraping-Konfiguration erfolgreich aktualisiert!", 'success');
        setIsScrapingModalOpen(false);
      } else {
        showToast("Aktualisierung fehlgeschlagen: " + (data.error || "Unbekannter Fehler"), 'error');
      }
    } catch (err) {
      console.error("Failed to save config:", err);
      showToast("Verbindungsfehler beim Speichern der Konfiguration.", 'error');
    } finally {
      setIsSavingScraping(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Google OAuth flow triggers the modal instead of budget prompt
  const handleConnectOauth = () => {
    if (oauthConnected) {
      // Log out / clear
      localStorage.removeItem('google_access_token');
      setAccessToken(null);
      setOauthConnected(false);
      showToast('Verbindung zum Google Workspace getrennt.', 'info');
      return;
    }
    setIsOauthModalOpen(true);
  };

  // Triggers secondary Google popup
  const handleTriggerGooglePopup = () => {
    const clientIdToUse = customClientId.trim();
    if (!clientIdToUse) {
      showToast('Bitte geben Sie eine gültige Google-Client-ID ein.', 'error');
      return;
    }

    localStorage.setItem('google_client_id', clientIdToUse);
    
    // Scopes authorization payload matching USER_REQUEST
    const scopes = [
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.compose',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/documents.readonly'
    ].join(' ');

    const redirectUri = `${window.location.origin}/auth/callback`;

    const params = new URLSearchParams({
      client_id: clientIdToUse,
      redirect_uri: redirectUri,
      response_type: 'token',
      scope: scopes,
      prompt: 'select_account' // Bypass repetitive full scope-approval screens if already consented!
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    
    const popup = window.open(
      googleAuthUrl,
      'google_oauth_popup',
      'width=550,height=650,left=150,top=100,status=no,resizable=yes'
    );

    if (!popup) {
      showToast('Popup blockiert! Bitte erlauben Sie Popups für diese Webseite, um sich anzumelden.', 'error');
    }
  };

  // Direct mock/simulated sandbox activation helper
  const handleActivateSandbox = () => {
    const tokenToUse = 'mock-dev-token-9988';
    localStorage.setItem('google_access_token', tokenToUse);
    setAccessToken(tokenToUse);
    setOauthConnected(true);
    setIsOauthModalOpen(false);
    showToast('Workspace Sandbox-Synchronisierung aktiv: bellanewhome26@gmail.com', 'success');
  };

  // Manual token input savior (e.g. from Playground)
  const handleSaveManualToken = () => {
    const cleansed = manualTokenInput.trim();
    if (!cleansed) {
      showToast('Bitte geben Sie eine gültige Token-Zeichenfolge ein.', 'error');
      return;
    }
    localStorage.setItem('google_access_token', cleansed);
    setAccessToken(cleansed);
    setOauthConnected(true);
    setIsOauthModalOpen(false);
    showToast('Aktives Google Workspace-Token erfolgreich verbunden!', 'success');
  };

  // Archive unrelated alerts from Gmail and local database
  const handleArchiveUnrelated = async (emailIds: string[]) => {
    if (!accessToken) {
      showToast('Bitte verknüpfen Sie zuerst Ihr Google-Konto, um E-Mails zu archivieren.', 'error');
      return;
    }

    setIsArchivingInProgress(true);
    try {
      const headers: Record<string, string> = { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`
      };

      const res = await fetch('/api/gmail/archive-unrelated', {
        method: 'POST',
        headers,
        body: JSON.stringify({ emailIds })
      });

      if (res.ok) {
        const result = await res.json();
        setDatabase(result.database);
        showToast(result.message || `${emailIds.length} E-Mails erfolgreich archiviert und bereinigt!`, 'success');
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Fehler beim Archivieren der E-Mails.', 'error');
      }
    } catch (error) {
      console.error('Failed to archive emails:', error);
      showToast('Netzwerkfehler beim Versenden des Archivierungsbefehls.', 'error');
    } finally {
      setIsArchivingInProgress(false);
    }
  };

  // Synchronize alerts inbox
  const handleSyncInbox = async () => {
    setIsSyncing(true);
    showToast('Scanne Posteingang von bellanewhome26@gmail.com nach Wohnungsalarmen...', 'info');

    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const res = await fetch('/api/fetch-emails', {
        method: 'POST',
        headers
      });

      if (res.status === 401) {
        const result = await res.json().catch(() => ({}));
        if (result.authError) {
          localStorage.removeItem('google_access_token');
          setAccessToken(null);
          setOauthConnected(false);
          showToast('Die Google Workspace-Sitzung ist abgelaufen oder ungültig. Bitte verbinden Sie sich erneut.', 'error');
          setIsOauthModalOpen(true);
          return;
        }
      }

      if (res.ok) {
        const result = await res.json();
        setDatabase(result.database);
        
        if (result.count > 0) {
          showToast(`Erfolg! ${result.count} neue Wohnungsalarme gefunden und verarbeitet!`, 'success');
          // Highlight first parsed
          const parsedMails = result.database.emails.filter((e: EmailAlert) => !e.parsed);
          if (result.database.apartments.length > 0) {
            setSelectedApartmentId(result.database.apartments[0].id);
          }
        } else {
          showToast('Der Posteingang ist auf dem neuesten Stand. Keine neuen Angebote gefunden.', 'success');
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || 'Posteingangs-Scan mit Antwortcodes abgeschlossen.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Synchronisierung der Alarme konnte nicht abgeschlossen werden.', 'error');
    } finally {
      setIsSyncing(false);
    }
  };

  // Select apartment from email link
  const handleSelectApartmentByEmail = (emailId: string) => {
    if (!database) return;
    const email = database.emails.find(e => e.id === emailId);
    if (email && email.apartmentId) {
      setSelectedApartmentId(email.apartmentId);
      setActiveLeftTab('apartments');
      // Highlight selection text
      showToast('Wohnung im Immobilienregister markiert.', 'success');
    }
  };

  // Modify status (Interested, Applied, etc.)
  const handleUpdateStatus = async (id: string, status: Apartment['status']) => {
    try {
      const res = await fetch(`/api/apartments/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (res.ok) {
        const result = await res.json();
        // Update local database
        setDatabase(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            apartments: prev.apartments.map(a => a.id === id ? { ...a, status } : a)
          };
        });
        showToast(`Status aktualisiert auf: ${status}`, 'success');
      }
    } catch (e) {
      console.error(e);
      showToast('Der Status der Wohnung konnte nicht aktualisiert werden.', 'error');
    }
  };

  // Modify custom comments/notes
  const handleUpdateNotes = async (id: string, notes: string) => {
    try {
      const res = await fetch(`/api/apartments/${id}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes })
      });
      if (res.ok) {
        setDatabase(prev => {
          if (!prev) return prev;
          return {
            ...prev,
            apartments: prev.apartments.map(a => a.id === id ? { ...a, notes } : a)
          };
        });
        showToast('Notizen erfolgreich gespeichert.', 'success');
      }
    } catch (e) {
      console.error(e);
      showToast('Notizen konnten nicht in der Datenbank gespeichert werden.', 'error');
    }
  };

  // Send Chat message to Co-Pilot
  const handleSendMessage = async (text: string) => {
    if (!database || !text.trim()) return;

    // Build mock user log immediately to optimize layout response
    const newUserMsg: ChatMessage = {
      id: 'ch_temp_' + Date.now(),
      role: 'user',
      text,
      timestamp: new Date().toISOString(),
      referencedApartmentId: selectedApartmentId
    };

    setDatabase(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        chatHistory: [...prev.chatHistory, newUserMsg]
      };
    });

    setIsChatting(true);

    try {
      // Pull and compile thread of active conversations
      const msgList = database.chatHistory.map(m => ({
        role: m.role,
        text: m.text
      }));
      msgList.push({ role: 'user', text });

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: msgList,
          activeApartmentId: selectedApartmentId
        })
      });

      if (res.ok) {
        const result = await res.json();
        setDatabase(result.database);
        
        // Focus chat panel
        setActiveRightTab('chat');
      } else {
        showToast('KI-Wohnungsassistent ist offline. Bitte Zugangsdaten in den Einstellungen prüfen.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Verbindung zum Wohnungsassistenten fehlgeschlagen.', 'error');
    } finally {
      setIsChatting(false);
    }
  };

  // File analysis handler
  const handleUploadFile = async (fileDetails: { name: string; size: string; type: string; content: string }) => {
    setIsUploading(true);
    showToast(`Analysiere '${fileDetails.name}' mit dem Gemini Immobilien-Scanner...`, 'info');

    try {
      const res = await fetch('/api/upload-file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fileDetails)
      });

      if (res.ok) {
        const result = await res.json();
        setDatabase(result.database);
        showToast(`Bewerbungsdossier ergänzt: '${fileDetails.name}' erfolgreich verifiziert!`, 'success');
        
        // Add chat message about successful analysis
        await handleSendMessage(`Ich habe mein Dokument hochgeladen: ${fileDetails.name}. Kannst du kurz zusammenfassen, welche Details für unsere Zürcher Mietanforderungen passen?`);
      }
    } catch (e) {
      console.error(e);
      showToast('Hochgeladenes Dokument konnte nicht analysiert werden.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  // Write appointment details to Calendar API
  const handleAddViewingEvent = async (eventDetails: { apartmentId: string; title: string; start: string; end: string; location: string }) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
      const res = await fetch('/api/calendar/add-event', {
        method: 'POST',
        headers,
        body: JSON.stringify(eventDetails)
      });

      if (res.status === 401) {
        const result = await res.json().catch(() => ({}));
        if (result.authError) {
          localStorage.removeItem('google_access_token');
          setAccessToken(null);
          setOauthConnected(false);
          showToast('Die Google Workspace-Sitzung ist abgelaufen oder ungültig. Bitte verbinden Sie sich erneut.', 'error');
          setIsOauthModalOpen(true);
          return;
        }
      }

      if (res.ok) {
        const result = await res.json();
        setDatabase(result.database);
        showToast("Besichtigungstermin wurde erfolgreich in Ihren Google-Kalender eingetragen!", "success");
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || "Besichtigungstermin im Kalender konnte nicht eingetragen werden.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Besichtigungstermin im Kalender konnte nicht eingetragen werden.", "error");
    }
  };

  // Compose and submit inquiry letters to landlord via Gmail api
  const handleSendEmailInquiry = async (emailDetails: { apartmentId: string; toEmail: string; subject: string; text: string; sendDirectly: boolean }) => {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    try {
      const res = await fetch('/api/gmail/send-inquiry', {
        method: 'POST',
        headers,
        body: JSON.stringify(emailDetails)
      });

      if (res.status === 401) {
        const result = await res.json().catch(() => ({}));
        if (result.authError) {
          localStorage.removeItem('google_access_token');
          setAccessToken(null);
          setOauthConnected(false);
          showToast('Die Google Workspace-Sitzung ist abgelaufen oder ungültig. Bitte verbinden Sie sich erneut.', 'error');
          setIsOauthModalOpen(true);
          return;
        }
      }

      if (res.ok) {
        const result = await res.json();
        setDatabase(result.database);
        showToast(result.status, "success");
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || "Anschreiben konnte nicht gesendet werden.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Entwurf konnte nicht gespeichert werden.", "error");
    }
  };

  // Import a Google Doc file into the local applicant dossier
  const handleImportGoogleDoc = async (fileId: string, fileName: string) => {
    setIsImportingDoc(true);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    try {
      const res = await fetch('/api/google-docs/import', {
        method: 'POST',
        headers,
        body: JSON.stringify({ fileId, fileName })
      });

      if (res.status === 401) {
        localStorage.removeItem('google_access_token');
        setAccessToken(null);
        setOauthConnected(false);
        showToast('Die Google Workspace-Sitzung ist abgelaufen oder ungültig. Bitte verbinden Sie sich erneut.', 'error');
        setIsOauthModalOpen(true);
        return;
      }

      if (res.ok) {
        const result = await res.json();
        setDatabase(result.database);
        showToast(`Dokument erfolgreich importiert und analysiert: "${fileName}"`, "success");
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || "Google-Dokument konnte nicht ausgelesen werden.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Netzwerkfehler beim Importieren des Google-Dokuments.", "error");
    } finally {
      setIsImportingDoc(false);
    }
  };

  // Autodraft structured Swiss cover letter direct to user's Google Doc
  const handleCreateGoogleDocLetter = async (apartmentId: string, customContent?: string) => {
    // Guidelines: Always ask the user's explicit confirmation before writing/mutating documents or sending emails!
    const confirmed = window.confirm(
      "Möchten Sie ein massgeschneidertes Bewerbungsschreiben auf Hochdeutsch direkt in Google Docs für diese Wohnung erstellen lassen?"
    );
    if (!confirmed) return;

    setIsCreatingDoc(true);
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    try {
      const res = await fetch('/api/google-docs/create-letter', {
        method: 'POST',
        headers,
        body: JSON.stringify({ apartmentId, customContent })
      });

      if (res.status === 401) {
        localStorage.removeItem('google_access_token');
        setAccessToken(null);
        setOauthConnected(false);
        showToast('Die Google Workspace-Sitzung ist abgelaufen oder ungültig. Bitte verbinden Sie sich erneut.', 'error');
        setIsOauthModalOpen(true);
        return;
      }

      if (res.ok) {
        const result = await res.json();
        setDatabase(result.database);
        showToast(`Google Doc erstellt: "${result.docTitle}"`, "success");
        if (result.docUrl) {
          window.open(result.docUrl, '_blank');
        }
      } else {
        const errData = await res.json().catch(() => ({}));
        showToast(errData.error || "Erstellung des Bewerbungsschreibens fehlgeschlagen.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Netzwerkfehler beim Erstellen des Bewerbungsschreibens.", "error");
    } finally {
      setIsCreatingDoc(false);
    }
  };

  // Database seed reset helper
  const handleResetDatabase = async () => {
    if (!confirm("Möchten Sie alle gefundenen Wohnungen, Notizen, Termine und hochgeladenen Dokumente auf die Zürcher Ausgangswerte zurücksetzen?")) {
      return;
    }
    try {
      const res = await fetch('/api/reset', { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        setDatabase(result.database);
        setSelectedApartmentId(result.database.apartments[0]?.id);
        showToast("Zürcher Wohnungsregister wurde auf die Standardwerte zurückgesetzt.", "success");
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Update Candidate Profile manually
  const handleUpdateProfile = async (profileData: any) => {
    try {
      const res = await fetch('/api/profile/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData)
      });
      if (res.ok) {
        const result = await res.json();
        setDatabase(result.database);
        showToast('Mietbewerber-Profil erfolgreich gespeichert!', 'success');
      } else {
        showToast('Fehler beim Speichern des Mietprofils.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Profilspeicherung fehlgeschlagen.', 'error');
    }
  };

  // Clear simulated matching results and view only scanned emails
  const handleClearSimulated = async () => {
    try {
      const res = await fetch('/api/simulated/clear', { method: 'POST' });
      if (res.ok) {
        const result = await res.json();
        setDatabase(result.database);
        showToast('Simulationsdaten vollständig entfernt. Es verbleiben nur noch tatsächlich gescannte E-Mail-Meldungen.', 'success');
      } else {
        showToast('Simulierte Daten konnten nicht gelöscht werden.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Konnte Verbindung zum Löschen nicht aufbauen.', 'error');
    }
  };

  // Find active selected apartment details
  const activeApartment = database?.apartments.find(a => a.id === selectedApartmentId);

  if (!database) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-8">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="w-10 h-10 text-indigo-500 animate-spin" />
          <h2 className="text-lg font-display font-semibold select-none">ZüriHome-KI wird initialisiert...</h2>
          <p className="text-xs text-slate-500 max-w-sm text-center font-sans">
            Lade lokale Zürcher Steuerdatenbanken und konfigurierte Google Workspace-Anbindungen...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans flex flex-col selection:bg-indigo-600 selection:text-white">
      {/* Header bar component */}
      <Header
        isSyncing={isSyncing}
        onSync={handleSyncInbox}
        oauthConnected={oauthConnected}
        onConnectOauth={handleConnectOauth}
        onConfigureScraping={() => setIsScrapingModalOpen(true)}
        hasScrapingTokenConfigured={!!(database.scrapingToken && database.scrapingToken !== "sc_active_sandbox_demo_88f9" && !database.scrapingToken.startsWith("sc_demo"))}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
        
        {/* Toast Alert overlay */}
        <AnimatePresence>
          {toastMessage && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl border shadow-md flex items-center gap-2.5 text-xs font-semibold ${
                toastType === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' :
                toastType === 'error' ? 'bg-rose-50 border-rose-200 text-rose-800' :
                'bg-indigo-50 border-indigo-200 text-indigo-800'
              }`}
            >
              <div className={`w-1.5 h-1.5 rounded-full ${
                toastType === 'success' ? 'bg-emerald-500' :
                toastType === 'error' ? 'bg-rose-500' : 'bg-indigo-500'
              }`} />
              <span>{toastMessage}</span>
            </motion.div>
          )}
        </ AnimatePresence>

        {/* Bento stats list */}
        <AnalyticsGrid
          data={database}
          selectedApartment={activeApartment}
        />

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          {/* LEFT 3/4 PANEL: Registry List + Schematic Map */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Custom interactive topological map */}
            <ZurcherMap
              apartments={database.apartments}
              selectedId={selectedApartmentId}
              onSelect={(apt) => {
                setSelectedApartmentId(apt.id);
                showToast(`Fokus auf: ${apt.title}`, 'info');
              }}
            />

            {/* Main Listings Feed container */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col min-h-[460px]">
              
              {/* Tabs for choosing display type */}
              <div className="flex border-b border-slate-100 mb-4 text-xs font-semibold select-none">
                <button
                  onClick={() => setActiveLeftTab('apartments')}
                  className={`pb-2.5 px-4 relative flex items-center gap-1.5 ${
                    activeLeftTab === 'apartments' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>Gefundene Wohnungen</span>
                  <span className="bg-slate-100 text-slate-600 text-[9px] px-1.5 py-0.5 rounded-full font-mono">
                    {database.apartments.length}
                  </span>
                </button>

                <button
                  onClick={() => setActiveLeftTab('inbox')}
                  className={`pb-2.5 px-4 relative flex items-center gap-1.5 ${
                    activeLeftTab === 'inbox' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>E-Mail-Posteingang</span>
                  <span className="bg-slate-100 text-slate-600 text-[9px] px-1.5 py-0.5 rounded-full font-mono">
                    {database.emails.length}
                  </span>
                </button>
              </div>

              {activeLeftTab === 'apartments' ? (
                <ApartmentList
                  apartments={database.apartments}
                  selectedId={selectedApartmentId}
                  onSelect={(apt) => setSelectedApartmentId(apt.id)}
                  onUpdateStatus={handleUpdateStatus}
                  onUpdateNotes={handleUpdateNotes}
                  onDraftGoogleDoc={handleCreateGoogleDocLetter}
                />
              ) : (
                <EmailFeed
                  emails={database.emails}
                  onSelectApartmentByEmail={handleSelectApartmentByEmail}
                  onClearSimulated={handleClearSimulated}
                  onArchiveUnrelated={handleArchiveUnrelated}
                  isArchivingInProgress={isArchivingInProgress}
                  accessToken={accessToken}
                  onScrapeLink={handleScrapeLink}
                  isScrapingLinkMap={isScrapingLinkMap}
                />
              )}
            </div>
          </div>

          {/* RIGHT 2/4 RESIZABLE PANEL: AI Co-Pilot & Dossier */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            
            {/* Side-by-side tabs inside workpane */}
            <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex flex-col h-full min-h-[580px]">
              <div className="flex border-b border-slate-100 mb-4 text-xs font-semibold select-none">
                <button
                  onClick={() => setActiveRightTab('chat')}
                  className={`pb-2.5 px-4 relative flex items-center gap-1.5 ${
                    activeRightTab === 'chat' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 animate-pulse text-indigo-500" />
                  <span>KI-Wohnungsassistent</span>
                </button>

                <button
                  onClick={() => setActiveRightTab('dossier')}
                  className={`pb-2.5 px-4 relative flex items-center gap-1.5 ${
                    activeRightTab === 'dossier' ? 'text-slate-900 border-b-2 border-slate-900' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Bewerbungsdossier</span>
                  <span className="bg-slate-100 text-slate-600 text-[9px] px-1.5 py-0.5 rounded-full font-mono">
                    {database.files.length}
                  </span>
                </button>
              </div>

              {activeRightTab === 'chat' ? (
                <CoPilotChat
                  data={database}
                  activeApartment={activeApartment}
                  selectedApartmentId={selectedApartmentId}
                  onSendMessage={handleSendMessage}
                  isChatting={isChatting}
                  onAddViewingEvent={handleAddViewingEvent}
                  onSendEmailInquiry={handleSendEmailInquiry}
                />
              ) : (
                <DossierManager
                  data={database}
                  onUploadFile={handleUploadFile}
                  isUploading={isUploading}
                  accessToken={accessToken}
                  onImportGoogleDoc={handleImportGoogleDoc}
                  isImportingDoc={isImportingDoc}
                  onUpdateProfile={handleUpdateProfile}
                />
              )}
            </div>

            {/* Utility Admin operations (Reset) */}
            <div className="flex justify-between items-center bg-slate-50 p-4 border border-slate-100 rounded-xl select-none text-2xs text-slate-400 font-mono">
              <span>Zürcher KI-Wohnungssystem v2.6 • Aktiv</span>
              <button
                onClick={handleResetDatabase}
                className="text-red-700 hover:underline font-semibold flex items-center gap-1 cursor-pointer font-sans"
              >
                Datenbank zurücksetzen
              </button>
            </div>

          </div>
        </div>
      </main>

      {/* Modern, elegant Google Workspace OAuth Configuration Assistant Modal */}
      <AnimatePresence>
        {isOauthModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-xl w-full p-6 md:p-8 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                      <Mail className="w-5 h-5" />
                    </span>
                    Google Workspace verbinden
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Verbinden Sie <strong>bellanewhome26@gmail.com</strong> für den Echtzeit-Gmail-Abgleich und Kalender-Einträge.
                  </p>
                </div>
                <button
                  onClick={() => setIsOauthModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              {/* Alert Warning Box */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                <div className="flex gap-2.5">
                  <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-amber-900">Verbindungsmethode wählen:</h4>
                    <p className="text-2xs text-amber-800 leading-normal mt-0.5">
                      Da diese App in einem iFrame läuft, stehen Ihnen unten zwei flexible Wege zur Authentifizierung und Nutzung von echten E-Mails und Kalendereinträgen bereit.
                    </p>
                  </div>
                </div>
              </div>

              {/* SECTION 1: Standard Popup-based implicit OAuth flow */}
              <div className="border border-slate-100 rounded-xl p-5 mb-5 hover:border-slate-200 transition">
                <span className="text-[10px] uppercase tracking-wider font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-full">
                  Option A: Eigene Google-Client-ID konfigurieren (Empfohlen)
                </span>
                
                <p className="text-2xs text-slate-500 leading-normal mt-3">
                  Tragen Sie Ihre Client-ID aus der Google Cloud Console ein, um sich sicher zu verbinden.
                </p>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 mb-1">
                      Ihre Google OAuth Client-ID (Vom Typ Webanwendung)
                    </label>
                    <input
                      type="text"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-850 font-mono focus:outline-indigo-500"
                      placeholder="z.B. 1234567-abcdefg.apps.googleusercontent.com"
                      value={customClientId}
                      onChange={(e) => setCustomClientId(e.target.value)}
                    />
                  </div>

                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-100 space-y-1.5 text-2xs text-slate-600 font-mono">
                    <div className="font-bold text-slate-700 flex items-center justify-between">
                      <span>Authorized Redirect URI / Autorisierte Weiterleitungs-URI:</span>
                      <span className="text-[10px] bg-indigo-50 text-indigo-700 px-1 py-0.2 rounded shrink-0">Copy</span>
                    </div>
                    <div className="select-all bg-white px-2 py-1.5 rounded border border-indigo-200 text-indigo-600 font-semibold break-all outline-hidden">{window.location.origin}/auth/callback</div>
                    
                    <div className="pt-2 border-t border-slate-200 text-[10px] font-sans text-slate-500">
                      <p className="font-bold text-rose-600 flex items-center gap-1">
                        <span>⚠️</span> How to fix Error 400: redirect_uri_mismatch?
                      </p>
                      <p className="leading-snug mt-1 font-sans">
                        Since your app is running on a custom domain/sandbox, you must add this exact URL to your Google Cloud Console registry:
                      </p>
                      <ol className="list-decimal list-inside space-y-1 mt-1.5 pl-0.5 font-sans">
                        <li>Open the <a href="https://console.cloud.google.com/apis/credentials" target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">Google Cloud Credentials page</a>.</li>
                        <li>Click on your <strong>OAuth 2.0 Client ID</strong> (Web Application).</li>
                        <li>Find the field <strong>Authorized redirect URIs</strong> (Autorisierte Weiterleitungs-URIs).</li>
                        <li>Add the exact URL above (e.g. <code className="bg-slate-100 px-1 rounded select-all font-mono">https://zuri-apartment-finder.onrender.com/auth/callback</code> or current sandbox URL) and click <strong>Save</strong>.</li>
                        <li>Reload this page and try signing in again!</li>
                      </ol>
                    </div>
                  </div>

                  <button
                    onClick={handleTriggerGooglePopup}
                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-semibold py-2 px-4 rounded-lg text-xs leading-none transition duration-150 flex items-center justify-center gap-2"
                  >
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                      <path d="M12.24 10.285V13.4h6.86c-.277 1.56-1.602 4.585-6.86 4.585-4.54 0-8.24-3.765-8.24-8.4s3.7-8.4 8.24-8.4c2.58 0 4.307 1.095 5.298 2.045l2.465-2.37C18.285 1.15 15.54 0 12.24 0c-6.63 0-12 5.37-12 12s5.37 12 12 12c6.915 0 11.52-4.86 11.52-11.73 0-.788-.083-1.395-.188-1.985h-11.34z"/>
                    </svg>
                    <span>Mit Google-Konto anmelden</span>
                  </button>
                </div>
              </div>

              {/* SECTION 2: Paste manual temporary Access Token */}
              <div className="border border-slate-100 rounded-xl p-5 mb-5 hover:border-slate-200 transition">
                <span className="text-[10px] uppercase tracking-wider font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-full">
                  Option B: Temporäres Workspace-Sitzungstoken
                </span>
                
                <p className="text-2xs text-slate-500 leading-normal mt-3">
                  Geben Sie ein aktives Zugriffstoken aus dem Google OAuth Playground ein (mit Gmail- und Kalender-Berechtigungen).
                </p>

                <div className="mt-4 flex gap-2">
                  <input
                    type="password"
                    className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-850 font-mono focus:outline-indigo-500"
                    placeholder="ya29.a0..."
                    value={manualTokenInput}
                    onChange={(e) => setManualTokenInput(e.target.value)}
                  />
                  <button
                    onClick={handleSaveManualToken}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold px-4 rounded-lg text-xs transition duration-150"
                  >
                    Token speichern
                  </button>
                </div>
              </div>

              {/* SECTION 3: Activated Sandbox Simulation fallback */}
              <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <h4 className="text-2xs font-bold text-slate-800">Schnelltest: Sandbox-Simulationsmodus</h4>
                  <p className="text-3xs text-slate-500">Aktiviert die Simulation von Immobilienalarmen, um alle Funktionen sofort ohne Google-Konto zu testen.</p>
                </div>
                <button
                  onClick={handleActivateSandbox}
                  className="bg-white hover:bg-slate-100 text-slate-700 border border-slate-250 font-semibold px-3 py-1.5 rounded-lg text-2xs transition"
                >
                  Sandbox aktivieren
                </button>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modern, elegant Scraping & Web-Scrobbler Configuration Modal */}
      <AnimatePresence>
        {isScrapingModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/75 backdrop-blur-md z-50 flex items-center justify-center p-4 selection:bg-indigo-600 selection:text-white"
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-xl w-full p-6 md:p-8 overflow-y-auto max-h-[90vh]"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                      <Globe className="w-5 h-5 animate-pulse" />
                    </span>
                    Wohnungs-Scrobbler & Scraper einrichten
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Option 2 & 3: Plattform-Scrobbling für ImmoScout24, Flatfox, Homegate & Co.
                  </p>
                </div>
                <button
                  onClick={() => setIsScrapingModalOpen(false)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-50 hover:text-slate-700 transition"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
              </div>

              {/* Informative Hybrid-Platform explanation block */}
              <div className="bg-gradient-to-br from-indigo-50/60 to-slate-100 border border-indigo-100/50 rounded-xl p-4 mb-6 text-xs text-slate-705">
                <div className="flex gap-2.5">
                  <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs font-bold text-indigo-950">Wie funktioniert das Web-Scrobbling?</h4>
                    <p className="text-[10px] text-indigo-900 leading-relaxed mt-1 font-sans">
                      <strong>Option 2: Lokaler Scrobbler (Baseline)</strong> ruft das HTML des Wohnungsinserats ab, säubert Skripte/Stile und analysiert den echten Textinhalt per Gemini, um Steuer- und Geodaten eigenständig zuzuordnen.
                    </p>
                    <p className="text-[10px] text-indigo-900 leading-relaxed mt-1.5 font-sans">
                      <strong>Option 3: Scraping-Bridges (Anti-Bot Bypass)</strong> integriert Premium-Dienste wie <em>ScraperAPI</em> oder <em>ScrapingBee</em>. Diese bieten rotierende Proxys, um Firewalls auf Schweizer Portalen (ImmoScout24, Flatfox) zu überwinden!
                    </p>
                  </div>
                </div>
              </div>

              {/* Editable Fields */}
              <div className="space-y-4">
                <div>
                  <label className="block text-2xs font-bold text-slate-700 mb-1.5">
                    Premium API-Token für Scraper (ScraperAPI / ScrapingBee / Custom Gateway)
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-10 py-2.5 text-slate-850 font-mono focus:outline-indigo-500"
                      placeholder="Geben Sie hier Ihren Scraper-Token ein"
                      value={modalScrapingToken}
                      onChange={(e) => setModalScrapingToken(e.target.value)}
                    />
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Key className="h-4 w-4 text-slate-400" />
                    </div>
                  </div>
                  <p className="text-[9px] text-slate-500 mt-1 leading-snug font-sans">
                    Geben Sie einen echten Proxy-Token ein oder nutzen Sie den standardmäßig bereitgestellten Sandbox-Testtoken <code className="bg-slate-100 px-1 py-0.2 rounded font-mono">sc_active_sandbox_demo_88f9</code> für sofortige Simulationsergebnisse.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 mb-1">
                      Maximale Abfrageanzahl (Soll-Quota)
                    </label>
                    <input
                      type="number"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-850 font-mono focus:outline-indigo-505"
                      value={modalQuotaMax}
                      onChange={(e) => setModalQuotaMax(Number(e.target.value))}
                    />
                  </div>
                  <div>
                    <label className="block text-2xs font-bold text-slate-700 mb-1">
                      Bereits beansprucht (Ist-Quota)
                    </label>
                    <input
                      type="number"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-850 font-mono focus:outline-indigo-505"
                      value={modalQuotaUsed}
                      onChange={(e) => setModalQuotaUsed(Number(e.target.value))}
                    />
                  </div>
                </div>

                {/* Quota Progress viz */}
                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100">
                  <div className="flex justify-between items-center mb-1.5 font-sans">
                    <span className="text-2xs font-bold text-slate-700">Verbleibende Scrobbler-Kapazität:</span>
                    <span className="text-2xs font-bold text-indigo-600 font-mono">
                      {Math.max(0, modalQuotaMax - modalQuotaUsed)} / {modalQuotaMax} Aufrufe übrig
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden shadow-inner">
                    <div 
                      className={`h-full transition-all duration-300 rounded-full ${
                        (modalQuotaMax - modalQuotaUsed) / modalQuotaMax < 0.25 ? 'bg-rose-500' :
                        (modalQuotaMax - modalQuotaUsed) / modalQuotaMax < 0.5 ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.max(0, Math.min(100, ((modalQuotaMax - modalQuotaUsed) / modalQuotaMax) * 100))}%` }}
                    />
                  </div>
                </div>

                {/* Hybrid / Compatibility Answer container */}
                <div className="bg-slate-900 text-slate-200 rounded-xl p-4 border border-slate-850">
                  <span className="text-[8px] uppercase tracking-wider font-bold bg-slate-800 text-indigo-300 px-2 py-0.5 rounded-md">
                    System-Antwort: Kompatibilität
                  </span>
                  <h4 className="text-[11px] font-bold text-white mt-2 flex items-center gap-1.5">
                    <HelpCircle className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                    <span>Funktioniert das für alle Webseiten oder ist das eine Einzelfalllösung?</span>
                  </h4>
                  <p className="text-[10px] text-slate-400 mt-1.5 leading-normal font-sans text-slate-300">
                    Das System nutzt einen <strong>hybriden Ansatz</strong>:
                  </p>
                  <ul className="list-disc list-inside space-y-1 mt-1 font-sans text-[3xs] text-slate-450 pl-0.5">
                    <li><strong>Universelle Struktur-Datenbank per KI:</strong> Da die KI-Modelle das HTML inhaltsbasiert erfassen, sind starre Code-Regeln überflüssig. Sie versteht Zimmer, Preis und Lage auf <em>jeder</em> realen Wohnungssite sofort.</li>
                    <li><strong>Einzelfall-Bypass für Anti-Scraping-Firewalls:</strong> Große Plattformen (z.B. ImmoScout24) blockieren einfache Abfragen mit Schutzschilden. Ein Premium-Proxy (ScraperAPI/ScrapingBee) überwindet diese im Einzelfall zuverlässig.</li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => setIsScrapingModalOpen(false)}
                    className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 rounded-lg text-xs leading-none transition cursor-pointer"
                  >
                    Abbrechen
                  </button>
                  <button
                    onClick={() => handleUpdateScrapingConfig(modalScrapingToken, modalQuotaMax, modalQuotaUsed)}
                    disabled={isSavingScraping}
                    className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-lg text-xs leading-none transition cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {isSavingScraping ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Sichern...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                        <span>Einstellungen sichern</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
