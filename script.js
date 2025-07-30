// ตั้งค่า LIFF ID และ Google Apps Script URL
const CONFIG = {
  liffId: "2007320827-YerWeZvN",
  googleScriptUrl: "https://script.google.com/macros/s/AKfycbw_eg_87z2bEScZudTAVxRIrMgfqat6_Op92Ls6QqjQfELtc0LudKJCuR2gefexYKUN/exec",
  defaultProfileImage: "https://i.imgur.com/3J3WQwX.png"
};

// ฟังก์ชันหลักเมื่อ DOM โหลดเสร็จ
document.addEventListener('DOMContentLoaded', function() {
  initModal();
  initLIFF();
});

// ฟังก์ชันจัดการ Modal
function initModal() {
  const modal = document.getElementById('profile-modal');
  const modalImg = document.getElementById('modal-profile-image');
  const previewImg = document.getElementById('profile-preview');
  const closeModal = document.querySelector('.modal-close');

  previewImg.addEventListener('click', () => modal.classList.add('show'));
  closeModal.addEventListener('click', () => modal.classList.remove('show'));
  modal.addEventListener('click', (e) => {
    if (e.target === modal) modal.classList.remove('show');
  });
}

// ฟังก์ชันเริ่มต้น LIFF
function initLIFF() {
  liff.init({ liffId: CONFIG.liffId })
    .then(handleLIFFInit)
    .then(handleProfileFetch)
    .catch(handleError);
}

// ฟังก์ชันจัดการการเริ่มต้น LIFF
function handleLIFFInit() {
  if (!liff.isLoggedIn()) {
    liff.login({ redirectUri: window.location.href });
    return Promise.reject(new Error('Redirecting to login...'));
  }
  return Promise.all([liff.getProfile(), liff.getDecodedIDToken()]);
}

// ฟังก์ชันจัดการข้อมูลโปรไฟล์
function handleProfileFetch([profile, idToken]) {
  hideLoading();
  displayProfile(profile);
  setupForm(profile);
}

// ฟังก์ชันแสดงข้อมูลโปรไฟล์
function displayProfile(profile) {
  document.getElementById('display-name').textContent = profile.displayName;
  document.getElementById('user-id').textContent = profile.userId;
  document.getElementById('status-message').textContent = 
    profile.statusMessage || 'ไม่ได้ตั้งค่าสถานะ';

  setupProfileImage(profile.pictureUrl);
}

// ฟังก์ชันตั้งค่ารูปโปรไฟล์
function setupProfileImage(pictureUrl) {
  const previewImg = document.getElementById('profile-preview');
  const modalImg = document.getElementById('modal-profile-image');
  const imageUrl = pictureUrl || CONFIG.defaultProfileImage;
  
  previewImg.src = imageUrl;
  modalImg.src = imageUrl;
}

// ฟังก์ชันตั้งค่าฟอร์ม
function setupForm(profile) {
  document.getElementById('additional-form').addEventListener('submit', (e) => {
    e.preventDefault();
    handleFormSubmit(profile);
  });
}

// ฟังก์ชันจัดการการส่งฟอร์ม
function handleFormSubmit(profile) {
  const formData = prepareFormData(profile);
  const submitBtn = document.querySelector('button[type="submit"]');
  const submitLoading = document.getElementById('submit-loading');
  
  // Hide form and show loading
  document.getElementById('form-section').style.display = 'none';
  submitLoading.style.display = 'block';
  
  sendToGoogleSheets(formData)
    .then(() => handleSubmitSuccess(submitBtn, submitLoading))
    .catch(error => handleSubmitError(submitBtn, error, submitLoading));
}

// ฟังก์ชันเตรียมข้อมูลฟอร์ม
function prepareFormData(profile) {
  return {
    lineUserId: profile.userId,
    displayName: profile.displayName,
    pictureUrl: profile.pictureUrl || '',
    statusMessage: profile.statusMessage || '',
    comments: document.getElementById('comments').value,
    timestamp: new Date().toISOString()
  };
}

// ฟังก์ชันจัดการการส่งข้อมูลสำเร็จ
function handleSubmitSuccess(submitBtn, submitLoading) {
  submitLoading.style.display = 'none';
  updateButtonState(submitBtn, 'success', 'ส่งข้อมูลสำเร็จ!');
  showSuccessMessage(submitBtn);
  setTimeout(() => liff.closeWindow(), 3000);
}

// ฟังก์ชันจัดการข้อผิดพลาดในการส่งข้อมูล
function handleSubmitError(submitBtn, error, submitLoading) {
  console.error('Error:', error);
  submitLoading.style.display = 'none';
  document.getElementById('form-section').style.display = 'block';
  updateButtonState(submitBtn, 'error', 'ส่งข้อมูลไม่สำเร็จ');
  showErrorMessage(submitBtn, error);
  resetButtonAfterDelay(submitBtn);
}

// ฟังก์ชันอัพเดตสถานะปุ่ม
function updateButtonState(button, state, text) {
  const icons = {
    loading: '<span class="spinner"></span>',
    success: '<span style="display: inline-block; margin-right: 8px;">✓</span>',
    error: '<span style="display: inline-block; margin-right: 8px;">✗</span>'
  };
  
  button.innerHTML = `${icons[state]} ${text}`;
  button.style.backgroundColor = state === 'error' ? 'var(--error-color)' : 
                               state === 'success' ? 'var(--success-color)' : 
                               'var(--primary-color)';
  button.disabled = state === 'loading';
}

// ฟังก์ชันแสดงข้อความสำเร็จ
function showSuccessMessage(submitBtn) {
  const successMessage = document.createElement('div');
  successMessage.className = 'success-message';
  successMessage.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="#4CAF50" style="vertical-align: middle; margin-right: 8px;">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
    </svg>
    บันทึกข้อมูลสำเร็จ หน้าต่างจะปิดอัตโนมัติใน 3 วินาที...
  `;
  submitBtn.parentNode.insertBefore(successMessage, submitBtn.nextSibling);
}

// ฟังก์ชันแสดงข้อความผิดพลาด
function showErrorMessage(submitBtn, error) {
  const errorDiv = document.createElement('div');
  errorDiv.className = 'error-message';
  errorDiv.textContent = 'เกิดข้อผิดพลาดในการส่งข้อมูล: ' + error.message;
  submitBtn.parentNode.insertBefore(errorDiv, submitBtn.nextSibling);
}

// ฟังก์ชันรีเซ็ตปุ่มหลังจากดีเลย์
function resetButtonAfterDelay(submitBtn) {
  setTimeout(() => {
    submitBtn.innerHTML = '<span style="display: inline-block; margin-right: 8px;">✓</span> ส่งข้อมูล';
    submitBtn.style.backgroundColor = 'var(--primary-color)';
    submitBtn.disabled = false;
    
    const errorDiv = submitBtn.nextElementSibling;
    if (errorDiv && errorDiv.className === 'error-message') {
      errorDiv.remove();
    }
  }, 3000);
}

// ฟังก์ชันซ่อน loading
function hideLoading() {
  document.getElementById('loading').style.display = 'none';
  document.getElementById('profile').style.display = 'block';
}

// ฟังก์ชันจัดการข้อผิดพลาด
function handleError(err) {
  console.error('เกิดข้อผิดพลาด:', err);
  document.getElementById('loading').innerHTML = `
    <div style="color: var(--error-color); background: #fdecea; padding: 15px; border-radius: 6px; margin-bottom: 15px;">
      <p style="font-weight: 500; margin-bottom: 10px;">เกิดข้อผิดพลาดในการดึงข้อมูลโปรไฟล์</p>
      <p style="font-size: 14px;">${err.message || 'ไม่สามารถเชื่อมต่อกับ LINE ได้'}</p>
    </div>
    <button onclick="window.location.reload()" style="background-color: var(--error-color);">ลองอีกครั้ง</button>
  `;
}

// ฟังก์ชันสำหรับส่งข้อมูลไปยัง Google Sheets
async function sendToGoogleSheets(data) {
  try {
    const url = new URL(CONFIG.googleScriptUrl);
    url.searchParams.append('callback', 'handleResponse');
    
    const response = await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      redirect: 'follow'
    });
    
    return { status: 'success', message: 'Data submitted' };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}
