import React, { useState, useRef, useEffect } from 'react';

export default function ChatPanel({ context, onProposeDiff, mode = 'panel' }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Ask me to explain, refactor, or write code. I have context from your open file and project.\n\nUse @file in your message to reference the current file.',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading || !window.aieditor) return;

    let userContent = input.trim();
    if (userContent.includes('@file') && context.openFile) {
      userContent = userContent.replace(
        '@file',
        `current file (${context.openFile.path}):\n\`\`\`\n${context.openFile.content}\n\`\`\``
      );
    }

    const userMsg = { role: 'user', content: userContent };
    const history = [...messages, userMsg];
    setMessages([...history, { role: 'assistant', content: '' }]);
    setInput('');
    setLoading(true);

    try {
      let accumulated = '';
      await window.aieditor.aiStream(
        history.filter((m) => m.role !== 'system'),
        context,
        (chunk) => {
          accumulated += chunk;
          setMessages((prev) => {
            const next = [...prev];
            next[next.length - 1] = { role: 'assistant', content: accumulated };
            return next;
          });
        }
      );

      const codeMatch = accumulated.match(/```[\w]*\n([\s\S]*?)```/);
      if (codeMatch && context.openFile) {
        onProposeDiff?.({
          filePath: context.openFile.path,
          oldContent: context.openFile.content,
          newContent: codeMatch[1].trim(),
        });
      }
    } catch (err) {
      setMessages((prev) => {
        const next = [...prev];
        next[next.length - 1] = { role: 'assistant', content: `**Error:** ${err.message}` };
        return next;
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`chat-panel ${mode}`}>
      {mode === 'panel' && <div className="panel-section-title">AI CHAT</div>}
      <div className="chat-messages">
        {messages.map((msg, i) => (
          <div key={i} className={`chat-bubble ${msg.role}`}>
            <div className="chat-avatar">{msg.role === 'user' ? 'You' : 'AI'}</div>
            <div className="chat-text">{msg.content}</div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      <div className="chat-composer">
        <div className="chat-context-hint">
          {context.openFile ? `📄 ${context.openFile.path.split(/[/\\]/).pop()}` : 'No file open'}
        </div>
        <textarea
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
          placeholder="Ask AI... (@file for context, Enter to send)"
          rows={4}
          disabled={loading}
        />
        <div className="chat-composer-footer">
          <span className="chat-model">gpt-4o-mini</span>
          <button className="chat-send" onClick={sendMessage} disabled={loading || !input.trim()}>
            {loading ? 'Generating...' : 'Send ↑'}
          </button>
        </div>
      </div>
    </div>
  );
}
