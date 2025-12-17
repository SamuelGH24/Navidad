const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

/* ===== SERVIR FRONTEND ===== */
app.use(express.static(path.join(__dirname, '../frontend')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});
/* =========================== */

/* ===== LOGIN USUARIO ===== */
app.post('/usuario', async (req, res) => {
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'Nombre requerido' });
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM participantes WHERE nombre = ?',
      [nombre]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Usuario no existe' });
    }

    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Error en servidor' });
  }
});

/* ===== GIRAR RULETA ===== */
app.post('/girar', async (req, res) => {
  const { nombre } = req.body;

  const conn = await db.getConnection();
  await conn.beginTransaction();

  try {
    // Bloquear usuario
    const [[usuario]] = await conn.query(
      'SELECT * FROM participantes WHERE nombre = ? FOR UPDATE',
      [nombre]
    );

    if (!usuario) {
      await conn.rollback();
      return res.status(404).json({ error: 'Usuario no existe' });
    }

    // Si ya tiene asignado
    if (usuario.asignado_id) {
      const [[asignado]] = await conn.query(
        'SELECT nombre FROM participantes WHERE id = ?',
        [usuario.asignado_id]
      );
      await conn.commit();
      return res.json({ asignado: asignado.nombre });
    }

    // Buscar disponibles
    const [disponibles] = await conn.query(
      'SELECT * FROM participantes WHERE seleccionado = FALSE AND nombre != ?',
      [nombre]
    );

    if (!disponibles.length) {
      await conn.rollback();
      return res.status(400).json({ error: 'No hay disponibles' });
    }

    // Elegir ganador
    const ganador =
      disponibles[Math.floor(Math.random() * disponibles.length)];

    // Asignar
    await conn.query(
      'UPDATE participantes SET asignado_id = ? WHERE id = ?',
      [ganador.id, usuario.id]
    );

    await conn.query(
      'UPDATE participantes SET seleccionado = TRUE WHERE id = ?',
      [ganador.id]
    );

    await conn.commit();
    res.json({ asignado: ganador.nombre });

  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: 'Error interno' });
  } finally {
    conn.release();
  }
});

/* ===== START ===== */
app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});
