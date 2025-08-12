import React, { useEffect, useState } from 'react';

export default function App() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('http://localhost:8000/')
      .then((res) => res.json())
      .then((data) => setMessage(data.message))
      .catch((e) => console.error(e));
  }, []);

  return (
    <div>
      <h1>Nowl Frontend</h1>
      <p>APIからのメッセージ: {message}</p>
    </div>
  );
}