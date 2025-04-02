document.addEventListener('DOMContentLoaded', function() {
  const enableSwitch = document.getElementById('enableSwitch');
  const statusText = document.getElementById('statusText');

  // Lấy trạng thái hiện tại của trang web
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    const currentUrl = new URL(tabs[0].url);
    const hostname = currentUrl.hostname;
    
    // Lấy trạng thái từ storage
    chrome.storage.local.get([hostname], function(result) {
      const isEnabled = result[hostname] || false;
      enableSwitch.checked = isEnabled;
      statusText.textContent = isEnabled ? 'Bật' : 'Tắt';
    });
  });

  // Xử lý khi người dùng thay đổi trạng thái
  enableSwitch.addEventListener('change', function() {
    chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
      const currentUrl = new URL(tabs[0].url);
      const hostname = currentUrl.hostname;
      const isEnabled = enableSwitch.checked;
      
      // Lưu trạng thái vào storage
      chrome.storage.local.set({[hostname]: isEnabled}, function() {
        statusText.textContent = isEnabled ? 'Bật' : 'Tắt';
      });
    });
  });
}); 