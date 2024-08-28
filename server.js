require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const mysql = require('mysql2');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 8088;

console.log(process.env.DB_HOST);
console.log(process.env.DB_USERNAME);
console.log(process.env.DB_PASSWORD);
console.log(process.env.DATABASE);

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DATABASE
});
  
db.connect(err => {
  if (err) {
    throw err;
  }
  console.log('Connected to MySQL');
});
  
app.use(bodyParser.json());
app.use(cors());
  

// Tambahkan di bagian atas file bersama dengan require lainnya
const fs = require('fs');

// Tambahkan route untuk membuat tabel baru
app.post('/create-new-table', (req, res) => {
  const createTableQueries = [
    `
      CREATE TABLE IF NOT EXISTS reservasi (
        id_reservasi INT(20) AUTO_INCREMENT PRIMARY KEY,
        id_tamu INT(20),
        id_employee INT(20),
        created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
        update_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        reservation_date DATE NULL,
        tgl_datang DATETIME NULL,
        tgl_pulang DATETIME NULL,
        keterangan VARCHAR(255) NOT NULL,
        jmlh_tamu INT(20) NOT NULL,
        lokasi VARCHAR(50) NOT NULL,
        ruangan VARCHAR(20) NOT NULL,
        status VARCHAR(20) NULL
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS employee (
        id_employee INT(20) AUTO_INCREMENT PRIMARY KEY,
        userID VARCHAR(20) NOT NULL,
        nama VARCHAR(25) NOT NULL,
        divisi VARCHAR(20) NOT NULL,
        password VARCHAR(20) NOT NULL
      )
    `,
    `
      CREATE TABLE IF NOT EXISTS tamu (
        id_tamu INT(20) AUTO_INCREMENT PRIMARY KEY,
        id_dataTamu INT(20),
        jenis_tamu VARCHAR(20) NULL,
        tujuan VARCHAR(50) NULL,
        nama_prshn VARCHAR(50) NULL
      )
    `
  ];

  let queriesCompleted = 0;

  createTableQueries.forEach((query, index) => {
    db.query(query, (err, results) => {
      if (err) {
        console.error(`Error creating table ${index + 1}:`, err);
        return res.status(500).send(`Error creating table ${index + 1}`);
      }

      queriesCompleted++;
      if (queriesCompleted === createTableQueries.length) {
        res.status(200).send('All tables created successfully');
      }
    });
  });
});

app.delete('/delete-table', (req, res) => {
  const deleteTableQuery = 'DROP TABLE reservasi';

  db.query(deleteTableQuery, (err, results) => {
    if (err) {
      console.error('Error deleting table:', err);
      return res.status(500).send('Error deleting table');
    }
    res.status(200).send('Table deleted successfully');
  });
  const deleteTableQuery2 = 'DROP TABLE employee';

  db.query(deleteTableQuery2, (err, results) => {
    if (err) {
      console.error('Error deleting table:', err);
      return res.status(500).send('Error deleting table');
    }
    res.status(200).send('Table deleted successfully');
  });
});


app.get('/posts', (req, res) => {
  db.query('SELECT reservasi.*, tamu.tujuan, tamu.jenis_tamu, tamu.nama_prshn, employee.nama, employee.divisi FROM reservasi JOIN tamu ON reservasi.id_tamu = tamu.id_tamu JOIN employee ON reservasi.id_employee = employee.id_employee ORDER BY reservasi.create_at DESC', (err, results) => {
    if (err) {
      res.status(500).send('Error fetching posts');
      return;
    }
    res.json(results);
  });
});

app.get('/posts/userAccount', (req, res) => {
  db.query('SELECT * FROM employee', (err, results) => {
    if (err) {
      res.status(500).send('Error fetching posts');
      return;
    }
    console.log('berhasil login');
    

    res.json(results);
  });
});

// app.post('/posts/create', (req, res) => {
//   const { reservation_date, id_employee, keterangan, jmlh_tamu, lokasi, ruangan, tujuan, jenis_tamu, nama_prshn } = req.body;

//   db.beginTransaction(err => {
//     if (err) {
//       console.error('Error starting transaction:', err);
//       return res.status(500).send('Error starting transaction');
//     }

//     const insertTamuQuery = `
//       INSERT INTO tamu (tujuan, jenis_tamu, nama_prshn)
//       VALUES (?, ?, ?)`;

//     const insertTamuValues = [tujuan, jenis_tamu, nama_prshn];

//     db.query(insertTamuQuery, insertTamuValues, (err, result) => {
//       if (err) {
//         return db.rollback(() => {
//           console.error('Error inserting tamu:', err);
          
//           res.status(500).send('Error inserting tamu');
//         });
//       }

//       const id_tamu = result.insertId;

//       const insertReservasiQuery = `
//         INSERT INTO reservasi (id_tamu, id_employee, reservation_date, keterangan, jmlh_tamu, lokasi, ruangan, status, update_at, create_at)
//         VALUES (?,?, ?, ?, ?, ?, ?, 'WAITING', NOW(), NOW())`;

//       const insertReservasiValues = [id_tamu, id_employee,reservation_date, keterangan, jmlh_tamu, lokasi, ruangan];

//       db.query(insertReservasiQuery, insertReservasiValues, (err, result) => {
//         if (err) {
//           return db.rollback(() => {
//             console.error('Error inserting reservasi:', err);
//             res.status(500).send('Error inserting reservasi');
//           });
//         }

//         const id_reservasi = result.insertId;

//         db.commit(err => {
//           if (err) {
//             return db.rollback(() => {
//               console.error('Error committing transaction:', err);
//               res.status(500).send('Error committing transaction');
//             });
//           }

//           db.query('SELECT reservasi.*, tamu.* FROM reservasi JOIN tamu ON reservasi.id_tamu = tamu.id_tamu WHERE reservasi.id_reservasi = ?', [id_reservasi], (err, result) => {
//             if (err) {
//               console.error('Error fetching created reservation and guest:', err);
//               res.status(500).send('Error fetching created reservation and guest');
//               return;
//             }
//             res.status(201).json(result[0]);
//           });
//         });
//       });
//     });
//   });
// });

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
        INSERT INTO reservasi (id_tamu, id_employee, reservation_date, keterangan, jmlh_tamu, lokasi, ruangan, status, created_at, update_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 'WAITING', NOW(), NOW())`;

      const insertReservasiValues = [id_tamu, id_employee, reservation_date, keterangan, jmlh_tamu, lokasi, ruangan];

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

// app.put('/posts/:id', (req, res) => {
//   const postId = req.params.id;
//   const { status } = req.body;

// });

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
  console.log(req.body);
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

let roomData = null;
app.post('/posts/panggilan', (req, res) => {
  const { roomId, tujuan, lokasi, ruangan } = req.body;
  
  if (!roomId || !tujuan || !lokasi || !ruangan) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  // app.get('/posts/panggilan', (req, res) => {
  //   if (roomData) {
  //     res.status(200).json(roomData);
  //   } else {
  //     res.status(404).json({ message: 'No data found' });
  //   }
  // });
  roomData = {
    roomId: roomId,
    details: {
      tujuan: tujuan,
      lokasi: lokasi,
      ruangan: ruangan
    }
  };
  res.status(200).json(roomData);
  console.log(req.body);
});

app.get('/posts/getpanggilan', (req, res) => {
  if (roomData) {
    res.status(200).json(roomData);
  } else {
    res.status(404).json({ message: 'No data found' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});