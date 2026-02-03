const response = await fetch('http://localhost:8000/llmo/reports/stream', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',  // pour envoyer les cookies
  body: JSON.stringify({ url: 'https://www.example.com' })
});

const reader = response.body.getReader();
const decoder = new TextDecoder();
let buffer = '';

while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  buffer += decoder.decode(value, { stream: true });
  const lines = buffer.split('\n\n');
  buffer = lines.pop() || '';
  for (const chunk of lines) {
    const eventMatch = chunk.match(/^event: (.+)/m);
    const dataMatch = chunk.match(/^data: (.+)/ms);
    const event = eventMatch ? eventMatch[1].trim() : 'message';
    const data = dataMatch ? JSON.parse(dataMatch[1].trim()) : {};
    console.log(event, data);
    if (event === 'module_completed') {
      console.log(`Module ${data.module_index}/${data.total_modules} (${data.llm_name})`);
    }
    if (event === 'llm_completed') {
      console.log(`LLM ${data.llm_name} terminé en ${data.duration_sec}s`);
    }
    if (event === 'analysis_completed') {
      console.log('Rapport prêt:', data.report_filename);
    }
    if (event === 'error') {
      console.error('Erreur:', data.message);
    }
  }
}