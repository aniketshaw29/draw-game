import { useEffect, useRef, useState } from 'react';
import { socket, api } from '../socket.js';

const COLORS = ['#000000', '#9e9e9e', '#f44336', '#ff9800', '#ffeb3b', '#4caf50', '#2196f3', '#9c27b0', '#795548', '#ffffff'];
const SIZES = [2, 4, 8, 14];

function drawStroke(ctx, s) {
  ctx.strokeStyle = s.tool === 'eraser' ? '#ffffff' : s.color;
  ctx.lineWidth = s.size;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.beginPath();
  s.points.forEach((p, i) => (i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
  ctx.stroke();
}

export default function Canvas({ canDraw, history }) {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const strokesRef = useRef([]);
  const bootstrappedRef = useRef(false);
  const currentRef = useRef(null);
  const toolRef = useRef({ color: '#000000', size: 4, eraser: false });
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(4);
  const [eraser, setEraser] = useState(false);

  const redraw = () => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    strokesRef.current.forEach((s) => drawStroke(ctx, s));
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctxRef.current = ctx;
    redraw();
  }, []);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    if (!Array.isArray(history) || history.length === 0) return;
    strokesRef.current = history.slice();
    bootstrappedRef.current = true;
    redraw();
  }, [history]);

  useEffect(() => {
    const onStroke = (s) => {
      if (strokesRef.current.some((x) => x.id === s.id)) return;
      strokesRef.current.push(s);
      redraw();
    };
    const onUndo = ({ id }) => {
      strokesRef.current = strokesRef.current.filter((s) => s.id !== id);
      redraw();
    };
    const onClear = () => {
      strokesRef.current = [];
      redraw();
    };
    socket.on('newStroke', onStroke);
    socket.on('strokeUndone', onUndo);
    socket.on('canvasCleared', onClear);
    return () => {
      socket.off('newStroke', onStroke);
      socket.off('strokeUndone', onUndo);
      socket.off('canvasCleared', onClear);
    };
  }, []);

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onPointerDown = (e) => {
    if (!canDraw) return;
    e.preventDefault();
    canvasRef.current.setPointerCapture(e.pointerId);
    currentRef.current = {
      id: crypto.randomUUID(),
      tool: toolRef.current.eraser ? 'eraser' : 'brush',
      color: toolRef.current.color,
      size: toolRef.current.size,
      points: [getPos(e)],
    };
  };

  const onPointerMove = (e) => {
    if (!canDraw || !currentRef.current) return;
    const last = currentRef.current.points[currentRef.current.points.length - 1];
    const pos = getPos(e);
    if (last && Math.abs(pos.x - last.x) + Math.abs(pos.y - last.y) < 3) return;
    currentRef.current.points.push(pos);
    const ctx = ctxRef.current;
    ctx.strokeStyle = currentRef.current.tool === 'eraser' ? '#ffffff' : currentRef.current.color;
    ctx.lineWidth = currentRef.current.size;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.stroke();
  };

  const onPointerUp = () => {
    if (!currentRef.current) return;
    const stroke = currentRef.current;
    currentRef.current = null;
    if (stroke.points.length < 2) return;
    strokesRef.current.push(stroke);
    api.drawStroke(stroke);
  };

  const setTool = (patch) => {
    toolRef.current = { ...toolRef.current, ...patch };
    if ('color' in patch) setColor(patch.color);
    if ('size' in patch) setSize(patch.size);
    if ('eraser' in patch) setEraser(patch.eraser);
  };

  return (
    <div className="canvas-wrap">
      <div className="canvas-frame">
        <canvas
          ref={canvasRef}
          className={canDraw ? 'drawing-surface' : 'drawing-surface read-only'}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerLeave={onPointerUp}
        />
        {!canDraw && (
          <div className="read-only-note">You're guessing — wait for your turn to draw</div>
        )}
      </div>

      {canDraw && (
        <div className="toolbar">
          <div className="tool-group">
            {COLORS.map((c) => (
              <button
                key={c}
                className={`swatch ${color === c && !eraser ? 'selected' : ''}`}
                style={{ background: c }}
                onClick={() => setTool({ color: c, eraser: false })}
              />
            ))}
          </div>
          <div className="tool-group">
            {SIZES.map((s) => (
              <button
                key={s}
                className={`size-dot ${size === s && !eraser ? 'selected' : ''}`}
                onClick={() => setTool({ size: s, eraser: false })}
              >
                <span
                  style={{
                    width: s * 2,
                    height: s * 2,
                    background: eraser ? '#fff' : color,
                    borderRadius: '50%',
                    display: 'inline-block',
                    border: '1px solid #bbb',
                  }}
                />
              </button>
            ))}
          </div>
          <div className="tool-group">
            <button
              className={eraser ? 'tool-btn selected' : 'tool-btn'}
              onClick={() => setTool({ eraser: !eraser })}
            >
              Eraser
            </button>
            <button className="tool-btn" onClick={() => api.undo()}>
              Undo
            </button>
            <button className="tool-btn" onClick={() => api.clear()}>
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
