"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, MessageCircle, Paperclip, Send } from "lucide-react";
import { getAuthFromStorage } from "@/lib/auth.storage";
import { showError, showSuccess } from "@/components/toastUtils";
import {
  getConversationByPeer,
  getConversations,
  sendDirectMessage,
  type ConversationItem,
  type DirectMessage,
  type MessageUser,
} from "@/services/messages.service";

export default function MessagesPage() {
  const router = useRouter();

  const [checked, setChecked] = useState(false);
  const [peerFromQuery, setPeerFromQuery] = useState("");
  const [loadingList, setLoadingList] = useState(false);
  const [loadingConversation, setLoadingConversation] = useState(false);
  const [sending, setSending] = useState(false);
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [activePeer, setActivePeer] = useState<MessageUser | null>(null);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [messageText, setMessageText] = useState("");
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const activePeerId = activePeer?.id || "";

  const sortedConversations = useMemo(
    () => conversations.slice().sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
    [conversations]
  );

  const loadConversations = async () => {
    setLoadingList(true);
    try {
      const rows = await getConversations();
      setConversations(rows);

      if (!activePeer && rows.length > 0) {
        setActivePeer(rows[0].peer);
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to load conversation list");
    } finally {
      setLoadingList(false);
    }
  };

  const loadConversation = async (peerId: string) => {
    if (!peerId) return;
    setLoadingConversation(true);
    try {
      const data = await getConversationByPeer(peerId);
      setActivePeer(data.peer);
      setMessages(data.messages);
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to load conversation");
    } finally {
      setLoadingConversation(false);
    }
  };

  useEffect(() => {
    const auth = getAuthFromStorage();
    if (!auth?.token) {
      router.replace("/sign-in?redirect=/messages");
      return;
    }
    setChecked(true);
    if (typeof window !== "undefined") {
      const search = new URLSearchParams(window.location.search);
      setPeerFromQuery(search.get("peerId") || "");
    }
  }, [router]);

  useEffect(() => {
    if (!checked) return;
    void loadConversations();
  }, [checked]);

  useEffect(() => {
    if (!checked) return;

    if (peerFromQuery) {
      void loadConversation(peerFromQuery);
      return;
    }

    if (activePeerId) {
      void loadConversation(activePeerId);
    }
  }, [checked, peerFromQuery]);

  useEffect(() => {
    if (!checked || !activePeerId) return;
    const timer = setInterval(() => {
      void loadConversation(activePeerId);
      void loadConversations();
    }, 5000);

    return () => clearInterval(timer);
  }, [checked, activePeerId]);

  const handleSend = async () => {
    if (!activePeerId) {
      showError("Choose a conversation first");
      return;
    }

    if (!messageText.trim() && pendingFiles.length === 0) {
      showError("Type a message or add files");
      return;
    }

    setSending(true);
    try {
      await sendDirectMessage({
        peerUserId: activePeerId,
        body: messageText,
        attachments: pendingFiles,
      });
      setMessageText("");
      setPendingFiles([]);
      await loadConversation(activePeerId);
      await loadConversations();
      showSuccess("Message sent");
    } catch (error) {
      showError(error instanceof Error ? error.message : "Failed to send message");
    } finally {
      setSending(false);
    }
  };

  if (!checked) return null;

  return (
    <div className="min-h-screen bg-cream-100 p-3 md:p-6">
      <div className="mx-auto grid h-[calc(100vh-2rem)] max-w-7xl grid-cols-1 gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
        <aside className="flex flex-col overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm">
          <div className="border-b border-cream-200 p-4">
            <h1 className="text-xl font-black text-brand-900">Messages</h1>
            <p className="text-sm text-cream-800/50">1:1 chats with photographers and clients</p>
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {loadingList && <p className="p-3 text-sm text-cream-800/50">Loading contacts...</p>}
            {!loadingList && sortedConversations.length === 0 && (
              <p className="p-3 text-sm text-cream-800/50">No conversations yet. Open a profile and tap Chat.</p>
            )}

            <div className="space-y-1">
              {sortedConversations.map((item) => {
                const active = activePeerId === item.peer.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => void loadConversation(item.peer.id)}
                    className={`w-full rounded-xl px-3 py-3 text-left transition-colors ${
                      active ? "bg-brand-900 text-white" : "bg-white text-brand-900 hover:bg-cream-100"
                    }`}
                  >
                    <p className="truncate text-sm font-semibold">{item.peer.name || item.peer.email}</p>
                    <p className={`truncate text-xs ${active ? "text-cream-800/30" : "text-cream-800/50"}`}>
                      {item.lastMessage?.body || (item.lastMessage?.attachments?.length ? "Sent an attachment" : "No messages")}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        <section className="flex flex-col overflow-hidden rounded-2xl border border-cream-200 bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-cream-200 p-4">
            <div>
              <p className="text-sm text-cream-800/50">Conversation with</p>
              <h2 className="text-lg font-bold text-brand-900">{activePeer ? activePeer.name || activePeer.email : "Select a contact"}</h2>
            </div>

            {activePeer ? (
              <div className="flex gap-2">
                <Link href={`/hire-photographer`} className="inline-flex items-center gap-1 rounded-lg border border-cream-200 px-3 py-2 text-sm font-semibold text-cream-800/80 hover:bg-cream-50">
                  <MessageCircle className="h-4 w-4" /> Marketplace
                </Link>
              </div>
            ) : null}
          </div>

          <div className="flex-1 overflow-y-auto bg-cream-50 p-4">
            {loadingConversation ? (
              <div className="flex h-full items-center justify-center text-cream-800/50">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-cream-800/50">Start the conversation with a text or file.</div>
            ) : (
              <div className="space-y-3">
                {messages.map((message) => {
                  const mine = message.sender_id !== activePeerId;
                  return (
                    <div key={message.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div className={`max-w-[78%] rounded-2xl px-4 py-3 text-sm ${mine ? "bg-brand-900 text-white" : "bg-white text-brand-900"}`}>
                        {message.body ? <p className="whitespace-pre-wrap">{message.body}</p> : null}
                        {message.attachments?.length ? (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map((file, index) => (
                              <a
                                key={`${file.url}-${index}`}
                                href={file.url}
                                target="_blank"
                                rel="noreferrer"
                                className={`block underline ${mine ? "text-cream-800/30" : "text-brand-600"}`}
                              >
                                {file.name}
                              </a>
                            ))}
                          </div>
                        ) : null}
                        <p className={`mt-2 text-xs ${mine ? "text-cream-800/30" : "text-cream-800/50"}`}>
                          {new Date(message.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-t border-cream-200 p-3">
            <div className="mb-2 flex flex-wrap gap-2">
              {pendingFiles.map((file, index) => (
                <span key={`${file.name}-${index}`} className="rounded-full bg-cream-100 px-3 py-1 text-xs text-cream-800/80">
                  {file.name}
                </span>
              ))}
            </div>
            <div className="flex items-end gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-cream-200 px-3 py-2 text-sm font-semibold text-cream-800/80 hover:bg-cream-50">
                <Paperclip className="h-4 w-4" />
                <input
                  type="file"
                  multiple
                  accept="image/jpeg,image/png,image/webp,application/pdf,text/plain,.doc,.docx"
                  className="hidden"
                  onChange={(event) => {
                    const files = Array.from(event.target.files || []);
                    setPendingFiles((previous) => [...previous, ...files]);
                  }}
                />
              </label>
              <textarea
                value={messageText}
                onChange={(event) => setMessageText(event.target.value)}
                placeholder="Type your message"
                className="min-h-12 flex-1 resize-y rounded-xl border border-cream-200 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || !activePeerId}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-900 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-600 disabled:opacity-60"
              >
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Send
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
