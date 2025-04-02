// Tạo context menu khi extension được cài đặt
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "openSimilarLinks",
    title: "Mở tất cả link tương tự trong tab mới",
    contexts: ["link"]
  });
});

// Xử lý khi người dùng click vào context menu
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "openSimilarLinks") {
    // Lấy URL của link được click
    const clickedUrl = info.linkUrl;
    
    // Kiểm tra xem extension có được bật cho trang web này không
    const hostname = new URL(tab.url).hostname;
    chrome.storage.local.get([hostname], function(result) {
      if (result[hostname]) {
        // Nếu đã bật, thực hiện mở các links
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          function: findSimilarLinks,
          args: [clickedUrl]
        });
      }
    });
  }
});

// Hàm tìm và mở các link tương tự
function findSimilarLinks(clickedUrl) {
  // Hàm chuẩn hóa URL (loại bỏ hash và query parameters)
  function normalizeUrl(url) {
    try {
      // Nếu URL không có protocol, thêm https://
      const urlWithProtocol = url.startsWith('http') ? url : `https://${url}`;
      const urlObj = new URL(urlWithProtocol);
      
      // Chỉ giữ lại protocol, hostname và pathname
      return `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname}`;
    } catch (e) {
      return url; // Trả về URL gốc nếu có lỗi
    }
  }

  // Hàm kiểm tra xem hai URL có đồng dạng không
  function isSimilarUrl(url1, url2) {
    try {
      const u1 = new URL(url1);
      const u2 = new URL(url2);
      
      // Kiểm tra hostname giống nhau
      if (u1.hostname !== u2.hostname) return false;
      
      // Tách pathname thành các phần
      const p1 = u1.pathname.split('/').filter(part => part);
      const p2 = u2.pathname.split('/').filter(part => part);
      
      // Kiểm tra cấu trúc pathname giống nhau
      if (p1.length !== p2.length) return false;
      
      // Kiểm tra từng phần của pathname
      for (let i = 0; i < p1.length; i++) {
        // Nếu phần đầu tiên khác nhau (ví dụ: /t/ vs /f/), return false
        if (i === 0 && p1[i] !== p2[i]) return false;
        
        // Nếu phần cuối cùng khác nhau (ví dụ: số ID), vẫn coi là đồng dạng
        if (i === p1.length - 1) continue;
        
        // Các phần còn lại phải giống nhau
        if (p1[i] !== p2[i]) return false;
      }
      
      return true;
    } catch (e) {
      return false;
    }
  }
  
  // Lấy tất cả các link trong trang
  const links = document.getElementsByTagName('a');
  const similarLinks = new Set(); // Sử dụng Set để loại bỏ các link trùng lặp

  for (const link of links) {
    const href = link.href;
    if (!href) continue;
    
    try {
      // Kiểm tra xem link có đồng dạng với link được click không
      if (isSimilarUrl(href, clickedUrl)) {
        // Thêm URL đã được chuẩn hóa vào Set
        const normalizedUrl = normalizeUrl(href);
        similarLinks.add(normalizedUrl);
      }
    } catch (e) {
      // Bỏ qua URL không hợp lệ
    }
  }

  // Chuyển Set thành Array và giới hạn số lượng links
  const limitedLinks = Array.from(similarLinks).slice(0, 30);

  // Mở các link tương tự trong tab mới
  limitedLinks.forEach(url => {
    window.open(url, '_blank');
  });
} 