const mysql = require('mysql2/promise');

async function fix() {
  try {
    const conn = await mysql.createConnection({ user: 'root', password: '', database: 'portfolio_db' });
    const [users] = await conn.execute("SELECT id FROM users WHERE email='rajnish@test.com'");
    
    if (users.length > 0) {
      const userId = users[0].id;
      const [res] = await conn.execute("UPDATE portfolios SET userId = ? WHERE slug = 'rajnish-kumar'", [userId]);
      console.log('Successfully updated portfolio! Rows affected:', res.affectedRows);
    } else {
      console.log('User not found.');
    }
    
    await conn.end();
  } catch(err) {
    console.error('Migration fix failed:', err);
  }
}

fix();
