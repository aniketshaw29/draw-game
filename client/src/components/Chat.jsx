import { useEffect, useRef, useState } from 'react';
import { api } from '../socket.js';

export default function Chat({ messages }) {
  const [text, setText] = useState('');
  const listRef = useRef(null);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const submit = (e) => {
    e.preventDefault();
    const t = text.trim();
    if (!t) return;
    api.message(t);
    setText('');
  };

  return (
    <div className="chat">
      <div className="chat-list" ref={listRef}>
        {messages.map((m) => (
          <div
            key={m.id}
            className={
              m.kind === 'system'
                ? 'msg system'
                : m.isCorrect
                  ? 'msg correct'
                  : 'msg'
            }
          >
            {m.kind !== 'system' && <strong>{m.name}: </strong>}
            {m.isCorrect ? `${m.text} ✔` : m.text}
          </div>
        ))}
        {messages.length === 0 && (
          <div className="muted small">Type a guess here!</div>
        )}
      </div>
      <form onSubmit={submit} className="chat-input">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your guess…"
          maxLength={200}
          autoComplete="off"
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );
}
