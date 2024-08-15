const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql');
const cors = require('cors');
  
const app = express();
const port = 8088;
  
const db = mysql.createConnection({
  host: 'sql110.infinityfree.com',
  user: 'if0_37102802',
  password: 'VcqDQxmbtxxYO',
  database: 'if0_37102802_db_receptionist'
});
  
db.connect(err => {
  if (err) {
    throw err;
  }
  console.log('Connected to MySQL');
});
  
app.use(bodyParser.json());
app.use(cors());
  
app.get('/posts', (req, res) => {
  db.query('SELECT reservasi.*, tamu.tujuan, tamu.jenis_tamu, tamu.nama_prshn, employee.nama, employee.divisi FROM reservasi JOIN tamu ON reservasi.id_tamu = tamu.id_tamu JOIN employee ON reservasi.id_employee = employee.id_employee ORDER BY reservasi.create_at DESC', (err, results) => {
    if (err) {
      res.status(500).send('Error fetching posts');
      return;
    }
    res.json(results);
  });
});

app.post('/posts/create', (req, res) => {
  const { reservation_date, id_employee, keterangan, jmlh_tamu, lokasi, ruangan, tujuan, jenis_tamu, nama_prshn } = req.body;

  db.beginTransaction(err => {
    if (err) {
      console.error('Error starting transaction:', err);
      return res.status(500).send('Error starting transaction');
    }

    const insertTamuQuery = `
      INSERT INTO tamu (tujuan, jenis_tamu, nama_prshn)
      VALUES (?, ?, ?)`;

    const insertTamuValues = [tujuan, jenis_tamu, nama_prshn];

    db.query(insertTamuQuery, insertTamuValues, (err, result) => {
      if (err) {
        return db.rollback(() => {
          console.error('Error inserting tamu:', err);
          
          res.status(500).send('Error inserting tamu');
        });
      }

      const id_tamu = result.insertId;

      const insertReservasiQuery = `
        INSERT INTO reservasi (id_tamu, id_employee, reservation_date, keterangan, jmlh_tamu, lokasi, ruangan, status, update_at, create_at)
        VALUES (?,?, ?, ?, ?, ?, ?, 'WAITING', NOW(), NOW())`;

      const insertReservasiValues = [id_tamu, id_employee,reservation_date, keterangan, jmlh_tamu, lokasi, ruangan];

      db.query(insertReservasiQuery, insertReservasiValues, (err, result) => {
        if (err) {
          return db.rollback(() => {
            console.error('Error inserting reservasi:', err);
            res.status(500).send('Error inserting reservasi');
          });
        }

        const id_reservasi = result.insertId;

        db.commit(err => {
          if (err) {
            return db.rollback(() => {
              console.error('Error committing transaction:', err);
              res.status(500).send('Error committing transaction');
            });
          }

          db.query('SELECT reservasi.*, tamu.* FROM reservasi JOIN tamu ON reservasi.id_tamu = tamu.id_tamu WHERE reservasi.id_reservasi = ?', [id_reservasi], (err, result) => {
            if (err) {
              console.error('Error fetching created reservation and guest:', err);
              res.status(500).send('Error fetching created reservation and guest');
              return;
            }
            res.status(201).json(result[0]);
          });
        });
      });
    });
  });
});

app.put('/posts/:id', (req, res) => {
  const postId = req.params.id;
  const { reservation_date, keterangan, jmlh_tamu, lokasi, ruangan, tujuan, jenis_tamu, nama_prshn } = req.body;

  db.beginTransaction(err => {
    if (err) {
      console.error('Error starting transaction:', err);
      return res.status(500).send('Error starting transaction');
    }

    db.query('SELECT id_tamu FROM reservasi WHERE id_reservasi = ?', [postId], (err, results) => {
      if (err) {
        return db.rollback(() => {
          console.error('Error fetching id_tamu:', err);
          res.status(500).send('Error fetching id_tamu');
        });
      }

      if (results.length === 0) {
        return db.rollback(() => {
          res.status(404).send('Reservation not found');
        });
      }

      const id_tamu = results[0].id_tamu;

      const updateReservasiQuery = `
        UPDATE reservasi 
        SET reservation_date = ?, keterangan = ?, jmlh_tamu = ?, lokasi = ?, ruangan = ?, update_at = NOW(), status = 'WAITING'
        WHERE id_reservasi = ?`;

      const updateReservasiValues = [reservation_date, keterangan, jmlh_tamu, lokasi, ruangan, postId];

      db.query(updateReservasiQuery, updateReservasiValues, (err) => {
        if (err) {
          return db.rollback(() => {
            console.error('Error updating reservasi:', err);
            res.status(500).send('Error updating reservasi');
          });
        }

        const updateTamuQuery = `
          UPDATE tamu 
          SET tujuan = ?, jenis_tamu = ?, nama_prshn = ?
          WHERE id_tamu = ?`;

        const updateTamuValues = [tujuan, jenis_tamu, nama_prshn, id_tamu];

        db.query(updateTamuQuery, updateTamuValues, (err) => {
          if (err) {
            return db.rollback(() => {
              console.error('Error updating tamu:', err);
              res.status(500).send('Error updating tamu');
            });
          }

          db.commit(err => {
            if (err) {
              return db.rollback(() => {
                console.error('Error committing transaction:', err);
                res.status(500).send('Error committing transaction');
              });
            }

            db.query('SELECT reservasi.*, tamu.* FROM reservasi JOIN tamu ON reservasi.id_tamu = tamu.id_tamu WHERE reservasi.id_reservasi = ?', [postId], (err, result) => {
              if (err) {
                console.error('Error fetching updated reservation and guest:', err);
                res.status(500).send('Error fetching updated reservation and guest');
                return;
              }
              res.json(result[0]);
            });
          });
        });
      });
    });
  });
});
  
  
app.delete('/posts/:id', (req, res) => {
  const postId = req.params.id;

  db.beginTransaction(err => {
    if (err) {
      console.error('Error starting transaction:', err);
      return res.status(500).send('Error starting transaction');
    }

    db.query('SELECT id_tamu FROM reservasi WHERE id_reservasi = ?', [postId], (err, results) => {
      if (err) {
        return db.rollback(() => {
          console.error('Error fetching id_tamu:', err);
          res.status(500).send('Error fetching id_tamu');
        });
      }

      if (results.length === 0) {
        return db.rollback(() => {
          res.status(404).send('Reservation not found');
        });
      }

      const id_tamu = results[0].id_tamu;

      db.query('DELETE FROM tamu WHERE id_tamu = ?', [id_tamu], (err) => {
        if (err) {
          return db.rollback(() => {
            console.error('Error deleting guest:', err);
            res.status(500).send('Error deleting guest');
          });
        }

        db.query('DELETE FROM reservasi WHERE id_reservasi = ?', [postId], (err) => {
          if (err) {
            return db.rollback(() => {
              console.error('Error deleting reservation:', err);
              res.status(500).send('Error deleting reservation');
            });
          }

          db.commit(err => {
            if (err) {
              return db.rollback(() => {
                console.error('Error committing transaction:', err);
                res.status(500).send('Error committing transaction');
              });
            }

            res.status(200).json({ msg: 'Post and guest deleted successfully' });
          });
        });
      });
    });
  });
});

app.post('/posts/akun', (req, res) => {
  const { username, password } = req.body;

  const query = 'SELECT * FROM employee WHERE userID = ? AND password = ?';
  db.query(query, [username, password], (err, results) => {
    if (err) {
      console.error('Error checking login:', err);
      res.status(500).send('Error checking login');
      return;
    }
    if (results.length > 0) {
      res.json({ message: 'Login successful', user: results[0] });
    } else {
      console.log(`Invalid login attempt for user: ${username}`);
      res.status(401).json({ message: 'Invalid credentials' });
    }
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});