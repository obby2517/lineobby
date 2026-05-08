// ตั้งค่า LIFF ID และ Google Apps Script
const liffId = "2007320827-m3ygVAKM";                    // ← เปลี่ยนเป็นของจริง
const googleScriptUrl = "https://script.google.com/macros/s/AKfycbzAyZdIfSnp8aCarZPZQ0ueZ3S5YYOEjBsS3EntQCMphMeASv1eY2BzDyWYcC3YKKKf/exec"; // ← เปลี่ยนเป็นของจริง

document.addEventListener('DOMContentLoaded', function() {

  // Modal
  const modal = document.getElementById('profile-modal');
  const modalImg = document.getElementById('modal-profile-image');
  const previewImg = document.getElementById('profile-preview');
  const closeModal = document.querySelector('.modal-close');

  previewImg.addEventListener('click', () => modal.classList.add('show'));
  closeModal.addEventListener('click', () => modal.classList.remove('show'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('show');
  });

  // เริ่มต้น LIFF
  liff.init({ liffId: liffId })
    .then(() => {
      if (!liff.isLoggedIn()) {
        liff.login({ redirectUri: window.location.href });
        return;
      }
      return Promise.all([
        liff.getProfile(),
        liff.getDecodedIDToken()
      ]);
    })
    .then(([profile, idToken]) => {
      // ซ่อน loading แสดงเนื้อหา
      document.getElementById('loading').style.display = 'none';
      document.getElementById('profile').style.display = 'block';

      // แสดงข้อมูลพื้นฐาน
      document.getElementById('display-name').textContent = profile.displayName;
      document.getElementById('user-id').textContent = profile.userId;
      document.getElementById('status-message').textContent = 
        profile.statusMessage || 'ไม่ได้ตั้งค่าสถานะ';

      // ดึงข้อมูลจาก ID Token
      const lineEmail = idToken?.email || '';
      const linePhone = idToken?.phone_number || '';

      // จัดการอีเมล
      const emailInfo = document.getElementById('line-email-info');
      if (lineEmail) {
        document.getElementById('email').value = lineEmail;
        document.getElementById('line-email-value').textContent = lineEmail;
        emailInfo.style.display = 'block';
        document.getElementById('email').readOnly = true;
      }

      // จัดการเบอร์โทร
      const phoneInfo = document.getElementById('line-phone-info');
      if (linePhone) {
        document.getElementById('line-phone-value').textContent = linePhone;
        phoneInfo.style.display = 'block';
      }

      // แสดงรูปโปรไฟล์
      if (profile.pictureUrl) {
        previewImg.src = profile.pictureUrl;
        modalImg.src = profile.pictureUrl;
      } else {
        const defaultImg = 'https://i.imgur.com/3J3WQwX.png';
        previewImg.src = defaultImg;
        modalImg.src = defaultImg;
      }

      // Submit Form
      document.getElementById('additional-form').addEventListener('submit', function(e) {
        e.preventDefault();

        const formData = {
          lineUserId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl || '',
          statusMessage: profile.statusMessage || '',
          email: document.getElementById('email').value,
          fullName: document.getElementById('full-name').value.trim(),
          phone: linePhone,
          comments: document.getElementById('comments').value.trim(),
          timestamp: new Date().toISOString(),
          liffId: liffId
        };

        const submitBtn = document.querySelector('button[type="submit"]');
        submitBtn.innerHTML = '<span class="spinner"></span> กำลังส่งข้อมูล...';
        submitBtn.disabled = true;

        sendToGoogleSheets(formData)
          .then(() => {
            submitBtn.innerHTML = '✅ ส่งข้อมูลสำเร็จ!';
            submitBtn.style.backgroundColor = '#00c853';
            setTimeout(() => liff.closeWindow(), 1800);
          })
          .catch(error => {
            console.error(error);
            submitBtn.innerHTML = '❌ ส่งข้อมูลไม่สำเร็จ';
            submitBtn.style.backgroundColor = '#f44336';

            setTimeout(() => {
              submitBtn.innerHTML = '<span style="display: inline-block; margin-right: 8px;">✓</span> ส่งข้อมูล';
              submitBtn.style.backgroundColor = '';
              submitBtn.disabled = false;
            }, 3000);
          });
      });
    })
    .catch(err => {
      console.error(err);
      document.getElementById('loading').innerHTML = `
        <div style="color: #d32f2f; background: #ffebee; padding: 20px; border-radius: 8px;">
          <p style="font-weight: 500;">เกิดข้อผิดพลาดในการเชื่อมต่อกับ LINE</p>
          <p>${err.message || 'กรุณาลองใหม่อีกครั้ง'}</p>
          <button onclick="window.location.reload()" style="margin-top: 10px;">🔄 ลองใหม่</button>
        </div>
      `;
    });
});

// ส่งข้อมูลไป Google Apps Script
async function sendToGoogleSheets(data) {
  const response = await fetch(googleScriptUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
    mode: 'no-cors'        // ใช้ได้กับ Google Apps Script
  });

  // no-cors จะไม่สามารถอ่าน body ได้ แต่ส่งสำเร็จถือว่า OK
  return { status: 'success' };
}
