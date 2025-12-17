const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./db');

const app = express();

app.use(cors());
app.use(express.json());

/* ===== SERVIR FRONTEND ===== */
app.use(express.static(path.join(__dirname, '../FRONTEND')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../FRONTEND/index.html'));
});

/* ===== LOGIN USUARIO ===== */
app.post('/usuario', async (req, res) => {
  const { nombre } = req.body;

  if (!nombre) {
    return res.status(400).json({ error: 'Nombre requerido' });
  }

  try {
    // Buscar el usuario
    const [rows] = await db.query(
      'SELECT * FROM participantes WHERE nombre = ?',
      [nombre]
    );

    if (!rows.length) {
      return res.status(404).json({ error: 'Usuario no existe' });
    }

    const usuario = rows[0];

    // Verificar si ya tiene asignación
    const [asignaciones] = await db.query(
      `SELECT p.nombre as asignado, p.deseo as deseo_asignado
       FROM asignaciones a 
       JOIN participantes p ON a.amigo_secreto_id = p.id 
       WHERE a.usuario_id = ?`,
      [usuario.id]
    );

    if (asignaciones.length > 0) {
      usuario.asignado = asignaciones[0].asignado;
      usuario.deseo_asignado = asignaciones[0].deseo_asignado;
    }

    res.json(usuario);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error en servidor' });
  }
});

/* ===== OBTENER DISPONIBLES ===== */
app.get('/disponibles/:nombre', async (req, res) => {
  const { nombre } = req.params;
  
  try {
    // Personas que NO están en la tabla de asignaciones como amigo_secreto
    // Y que NO son el usuario actual
    const [disponibles] = await db.query(
      `SELECT p.nombre 
       FROM participantes p
       WHERE p.nombre != ?
       AND p.id NOT IN (SELECT amigo_secreto_id FROM asignaciones)
       ORDER BY p.nombre`,
      [nombre]
    );
    
    res.json(disponibles.map(p => p.nombre));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al obtener disponibles' });
  }
});

/* ===== GIRAR RULETA ===== */
app.post('/girar', async (req, res) => {
  const { nombre } = req.body;

  const conn = await db.getConnection();
  
  try {
    await conn.beginTransaction();

    // 1. Obtener usuario
    const [[usuario]] = await conn.query(
      'SELECT * FROM participantes WHERE nombre = ? FOR UPDATE',
      [nombre]
    );

    if (!usuario) {
      await conn.rollback();
      return res.status(404).json({ error: 'Usuario no existe' });
    }

    // 2. Verificar si ya giró
    const [[yaGiro]] = await conn.query(
      'SELECT * FROM asignaciones WHERE usuario_id = ?',
      [usuario.id]
    );

    if (yaGiro) {
      const [[asignado]] = await conn.query(
        'SELECT nombre FROM participantes WHERE id = ?',
        [yaGiro.amigo_secreto_id]
      );
      await conn.commit();
      return res.json({ 
        asignado: asignado.nombre,
        yaGiro: true 
      });
    }

    // 3. Buscar disponibles (que NO estén en asignaciones como amigo_secreto)
    const [disponibles] = await conn.query(
      `SELECT p.* 
       FROM participantes p
       WHERE p.nombre != ?
       AND p.id NOT IN (SELECT amigo_secreto_id FROM asignaciones)
       FOR UPDATE`,
      [nombre]
    );

    if (!disponibles.length) {
      await conn.rollback();
      return res.status(400).json({ error: 'No hay personas disponibles' });
    }

    // 4. Elegir ganador aleatorio
    const ganador = disponibles[Math.floor(Math.random() * disponibles.length)];

    // 5. Insertar asignación (esto previene duplicados por las UNIQUE keys)
    await conn.query(
      'INSERT INTO asignaciones (usuario_id, amigo_secreto_id) VALUES (?, ?)',
      [usuario.id, ganador.id]
    );

    await conn.commit();
    res.json({ asignado: ganador.nombre });

  } catch (err) {
    await conn.rollback();
    console.error('Error en /girar:', err);
    
    // Si es error de duplicado (por race condition)
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(400).json({ error: 'Esta persona ya fue asignada, intenta de nuevo' });
    }
    
    res.status(500).json({ error: 'Error interno del servidor' });
  } finally {
    conn.release();
  }
});

/* ===== REINICIAR JUEGO ===== */
app.post('/reiniciar', async (req, res) => {
  try {
    await db.query('DELETE FROM asignaciones');
    res.json({ mensaje: 'Juego reiniciado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al reiniciar' });
  }
});

/* ===== VER TODAS LAS ASIGNACIONES (DEBUG) ===== */
app.get('/asignaciones', async (req, res) => {
  try {
    const [asignaciones] = await db.query(
      `SELECT 
        p1.nombre as usuario,
        p2.nombre as amigo_secreto
       FROM asignaciones a
       JOIN participantes p1 ON a.usuario_id = p1.id
       JOIN participantes p2 ON a.amigo_secreto_id = p2.id
       ORDER BY p1.nombre`
    );
    res.json(asignaciones);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error' });
  }
});

/* ===== GUARDAR DESEO ===== */
app.post('/deseo', async (req, res) => {
  const { nombre, deseo } = req.body;

  if (!nombre || !deseo) {
    return res.status(400).json({ error: 'Nombre y deseo requeridos' });
  }

  try {
    await db.query(
      'UPDATE participantes SET deseo = ? WHERE nombre = ?',
      [deseo, nombre]
    );
    res.json({ mensaje: 'Deseo guardado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al guardar deseo' });
  }
});

/* ===== START ===== */
app.listen(3000, () => {
  console.log('Servidor corriendo en http://localhost:3000');
});