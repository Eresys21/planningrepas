// Fonction serveur Netlify : relaie le scan photo vers l'API Claude.
// La clé est lue dans la variable d'environnement ANTHROPIC_API_KEY
// (réglée dans Netlify : Site configuration > Environment variables).
// Elle n'est jamais envoyée au navigateur.

export default async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: { message: 'Méthode non autorisée' } }), { status: 405 });
  }
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) {
    return new Response(JSON.stringify({ error: { message: 'Clé API absente sur le serveur' } }), { status: 500 });
  }

  let body;
  try { body = await req.json(); } catch {
    return new Response(JSON.stringify({ error: { message: 'Requête invalide' } }), { status: 400 });
  }

  // On n'accepte qu'un seul message utilisateur, et on fixe le modèle et la longueur max,
  // pour que personne ne puisse se servir de cette fonction pour autre chose.
  const messages = Array.isArray(body.messages) ? body.messages.slice(0, 1) : [];
  if (!messages.length) {
    return new Response(JSON.stringify({ error: { message: 'Requête invalide' } }), { status: 400 });
  }

  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': key,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-opus-4-5',
      max_tokens: 2000,
      messages
    })
  });

  return new Response(await resp.text(), {
    status: resp.status,
    headers: { 'Content-Type': 'application/json' }
  });
};
