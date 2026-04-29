// En React, consumir el WebSocket de FastAPI
const [data, setData] = useState(null);

useEffect(() => {
  const ws = new WebSocket("ws://localhost:8000/ws");
  ws.onmessage = (e) => setData(JSON.parse(e.data));
  return () => ws.close();
}, []);