DROP DATABASE IF EXISTS navidad;
CREATE DATABASE navidad;
USE navidad;

-- Tabla de participantes (solo para login)
CREATE TABLE participantes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nombre VARCHAR(100) UNIQUE NOT NULL,
  deseo TEXT NULL
);

-- Tabla de asignaciones (quién le tocó a quién)
CREATE TABLE asignaciones (
  id INT AUTO_INCREMENT PRIMARY KEY,
  usuario_id INT NOT NULL,
  amigo_secreto_id INT NOT NULL,
  fecha_asignacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES participantes(id),
  FOREIGN KEY (amigo_secreto_id) REFERENCES participantes(id),
  UNIQUE KEY (usuario_id),  -- Un usuario solo puede girar UNA vez
  UNIQUE KEY (amigo_secreto_id)  -- Una persona solo puede ser amigo secreto de UNA persona
);

-- Insertar participantes
INSERT INTO participantes (nombre) VALUES
('SANDRA PATRICIA HUELGOS CASAS'),
('JEIMY MARCELA RAMIREZ'),
('JULIAN MELENDEZ'),
('MATEO SANCHEZ'),
('MARTIN MELENDEZ'),
('JEISON DAVID RAMIREZ'),
('ELVIA ROCIO HUELGOS CASAS'),
('FELIPE VARGAS'),
('ANGELICA AYALA'),
('JULIETA VARGAS'),
('ANDRES VARGAS'),
('GISEL ANDREA HUELGOS CASAS'),
('LUIS ALBERTO MAHECHA'),
('LUIS ALEJANDRO MAHECHA'),
('VIVIANA CARDOZO'),
('PAULA JARAMILLO'),
('ABIGAIL CASAS'),
('ALCIBIADES MORALES');

INSERT INTO participantes (nombre) VALUES
('LEIDY CAROLINA HUELGOS CHITIVA'),
('GUILLERMO LEONEL HUELGOS CHITIVA'),
('ELVIA ROCIO HUELGOS CHITIVA'),
('JENNY HUELGOS CHITIVA');