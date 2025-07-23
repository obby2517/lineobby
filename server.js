const express = require('express');
const app = express();

// ให้บริการไฟล์สแตติกจากโฟลเดอร์ public
app.use(express.static('public'));

// เริ่มต้นเซิร์ฟเวอร์
const listener = app.listen(process.env.PORT, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});