fetch("http://localhost:3000/api/ai-synthesis", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ prompt: "TEST" })
}).then(r => r.json()).then(console.log).catch(console.error);
