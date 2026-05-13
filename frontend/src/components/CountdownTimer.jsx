import { useEffect, useState } from "react";

export default function CountdownTimer({ seconds, onComplete, color }) {
  const [time, setTime] = useState(seconds);
  
  useEffect(() => {
    if (time > 0) {
      const timer = setTimeout(() => setTime(time - 1), 1000);
      return () => clearTimeout(timer);
    } else if (onComplete) {
      onComplete();
    }
  }, [time, onComplete]);
  
  return (
    <div style={{
      fontSize: "5rem",
      fontWeight: "bold",
      color: color || "#3B82F6",
      textAlign: "center"
    }}>
      {time}s
    </div>
  );
}