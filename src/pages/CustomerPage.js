import React, { useState } from 'react';

function CustomerPage() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('帳單爭議');
  const [content, setContent] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();

    const newTicket = {
      id: Date.now(), 
      customer: name,
      category: category,
      content: content,
      sentiment: "未偵測", 
      ai_tag: category,
      status: "待處理",      // 預設狀態
      customReply: ""       // 預留客服自行輸入的欄位
    };

    const localData = JSON.parse(localStorage.getItem('customTickets') || '[]');
    const updatedTickets = [newTicket, ...localData];
    localStorage.setItem('customTickets', JSON.stringify(updatedTickets));

    setName('');
    setContent('');
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div style={{ padding: '50px', textAlign: 'center', fontFamily: '"Microsoft JhengHei", sans-serif' }}>
        <h2 style={{ color: '#F08300' }}>⚠️ 感謝您的回報！</h2>
        <p>您的案件已透過 AI 優先發送至客服中控台。</p>
        <button 
          onClick={() => setSubmitted(false)} 
          style={{ padding: '10px 20px', backgroundColor: '#F08300', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer' }}
        >
          再傳一則
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', padding: '20px', fontFamily: '"Microsoft JhengHei", sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '30px' }}>
        <h1 style={{ color: '#F08300' }}>台灣大哥大 | 客戶支援入口</h1>
        <p>請填寫下方表單，中控台將即時同步您的需求</p>
      </header>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <label>
          <strong>客戶姓名：</strong>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            required 
            style={{ width: '100%', padding: '12px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }} 
          />
        </label>

        <label>
          <strong>問題類別：</strong>
          <select 
            value={category} 
            onChange={(e) => setCategory(e.target.value)} 
            style={{ width: '100%', padding: '12px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc' }}
          >
            <option value="帳單爭議">帳單爭議</option>
            <option value="收訊問題">收訊問題</option>
            <option value="硬體故障">硬體故障</option>
          </select>
        </label>

        <label>
          <strong>問題內文：</strong>
          <textarea 
            value={content} 
            onChange={(e) => setContent(e.target.value)} 
            rows="5" 
            required 
            style={{ width: '100%', padding: '12px', marginTop: '5px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }}
          ></textarea>
        </label>

        <button type="submit" style={{ padding: '15px', backgroundColor: '#F08300', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer', fontSize: '16px' }}>
          提交反應
        </button>
      </form>
    </div>
  );
}

export default CustomerPage;