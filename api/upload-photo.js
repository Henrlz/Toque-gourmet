// Função serverless (Vercel). Recebe uma foto (base64) do admin.html,
// confirma que quem está enviando tem uma sessão válida do Firebase Auth
// (o mesmo login usado no painel) e só então grava no Supabase Storage.
// A chave secreta (service_role) fica só nas variáveis de ambiente do
// Vercel e nunca é exposta ao navegador.

const FIREBASE_API_KEY = "AIzaSyAdz5zKoPHdLnLqoFjrtQBmpeL9upQvsKA";
const SUPABASE_BUCKET = "products-photos";

module.exports = async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Método não permitido." });
    return;
  }

  try {
    const idToken = req.headers["x-firebase-token"];
    if (!idToken) {
      res.status(401).json({ error: "Não autenticado." });
      return;
    }

    const verifyRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ idToken }),
      }
    );
    if (!verifyRes.ok) {
      res.status(401).json({ error: "Sessão inválida ou expirada. Faça login novamente." });
      return;
    }

    const { fileBase64, fileName, contentType } = req.body || {};
    if (!fileBase64 || !fileName) {
      res.status(400).json({ error: "Faltam dados da imagem." });
      return;
    }

    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      res.status(500).json({ error: "O Supabase ainda não foi configurado nas variáveis de ambiente do Vercel (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY)." });
      return;
    }

    const buffer = Buffer.from(fileBase64, "base64");
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${Date.now()}_${safeName}`;

    const uploadRes = await fetch(
      `${supabaseUrl}/storage/v1/object/${SUPABASE_BUCKET}/${path}`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${serviceKey}`,
          "Content-Type": contentType || "application/octet-stream",
        },
        body: buffer,
      }
    );

    if (!uploadRes.ok) {
      const text = await uploadRes.text();
      res.status(502).json({ error: "Falha ao enviar para o Supabase: " + text });
      return;
    }

    const publicUrl = `${supabaseUrl}/storage/v1/object/public/${SUPABASE_BUCKET}/${path}`;
    res.status(200).json({ url: publicUrl });
  } catch (err) {
    res.status(500).json({ error: "Erro inesperado: " + err.message });
  }
};
