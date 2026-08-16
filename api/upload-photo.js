// Função serverless (Vercel). Recebe uma foto (base64) do admin.html,
// confirma que quem está enviando tem uma sessão válida do Firebase Auth
// (o mesmo login usado no painel) e só então grava no Vercel Blob.
// O token de leitura/escrita do Blob fica só nas variáveis de ambiente
// do Vercel (BLOB_READ_WRITE_TOKEN) e nunca é exposto ao navegador.

const { put } = require("@vercel/blob");

const FIREBASE_API_KEY = "AIzaSyAdz5zKoPHdLnLqoFjrtQBmpeL9upQvsKA";

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

    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      res.status(500).json({ error: "O Vercel Blob ainda não foi conectado a este projeto (falta BLOB_READ_WRITE_TOKEN)." });
      return;
    }

    const buffer = Buffer.from(fileBase64, "base64");
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `products/${Date.now()}_${safeName}`;

    const blob = await put(path, buffer, {
      access: "public",
      contentType: contentType || "application/octet-stream",
    });

    res.status(200).json({ url: blob.url });
  } catch (err) {
    res.status(500).json({ error: "Erro inesperado: " + err.message });
  }
};
