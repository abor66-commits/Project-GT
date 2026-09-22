# Web-to-Lead API 整合說明文件

歡迎使用 GCS CRM Web-to-Lead 整合功能。透過這個 API，您可以將您的官方網站、登陸頁 (Landing Page) 或是任何外部表單與系統無縫整合。

## 1. 取得 API 金鑰

在開始之前，您必須進入「行銷控制台 > 外部表單整合」頁面中，點擊 **「產生新金鑰」** 來取得您的專屬 API Key。
> ⚠️ **注意**：請妥善保管您的金鑰，並避免將金鑰直接寫在公開的前端程式碼中。建議透過您的後端伺服器進行代理轉發。

## 2. API Endpoint

- **Method**: `POST`
- **URL**: `https://<您的網域>/api/marketing/lead`
- **Headers**:
  - `Content-Type`: `application/json`
  - `x-api-key`: `<您的專屬 API 金鑰>`

## 3. Request Body 格式

API 接受 JSON 格式的資料，可傳遞的欄位如下：

| 欄位名稱    | 型別   | 必填 | 說明                         |
| ----------- | ------ | ---- | ---------------------------- |
| companyName | string | 是   | 客戶/公司名稱                |
| contactName | string | 否   | 主要聯絡人姓名               |
| email       | string | 否   | 聯絡人信箱                   |
| phone       | string | 否   | 聯絡電話                     |
| industry    | string | 否   | 產業別                       |
| tag         | string | 否   | 預設要貼上的標籤 (例如活動名)|

## 4. 實作範例 (Node.js / JavaScript)

以下是使用 `fetch` 的基本串接範例：

```javascript
async function submitLeadToCRM(leadData) {
  const endpoint = 'https://<您的網域>/api/marketing/lead';
  
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': '您的專屬 API 金鑰'
      },
      body: JSON.stringify(leadData)
    });

    const result = await response.json();
    if (result.success) {
      console.log('✅ 成功匯入名單至 CRM');
    } else {
      console.error('❌ 匯入失敗:', result.error);
    }
  } catch (error) {
    console.error('發生錯誤:', error);
  }
}

// 測試呼叫
submitLeadToCRM({
  companyName: '王牌科技有限公司',
  contactName: '王大明',
  email: 'ming@example.com',
  tag: '2026-夏季展覽'
});
```

## 5. 常見問題

**Q: 為什麼會出現 `Invalid API Key`？**
A: 請確認您在 Headers 中攜帶了正確的 `x-api-key`，且沒有多餘的空白字元。

**Q: 前端直接呼叫 API 安全嗎？**
A: 不建議。若您直接在網頁前端 (Client-side) 寫入 API Key，將導致金鑰外洩。建議將表單送至您的後端 (如 PHP, Node.js)，再由後端轉送至 CRM API。
