import React, { useState, useEffect } from 'react';
import '../App.css';

function AdminPage() {
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [displayedText, setDisplayedText] = useState(""); 
  const [isSending, setIsSending] = useState(false); 
  const [manualReply, setManualReply] = useState(""); 

  // 1. 初始化：只載入本地儲存（客戶端即時送來的資料）
  useEffect(() => {
    const localData = JSON.parse(localStorage.getItem('customTickets') || '[]');
    
    // 依據時間 (id) 從舊到新排序，確保編號順序正確
    localData.sort((a, b) => a.id - b.id);
    
    // 動態賦予五位數流水號
    const formattedTasks = localData.map((task, index) => {
      return {
        ...task,
        ticketNo: String(index + 1).padStart(5, '0'),
        status: task.status || "待處理",
        customReply: task.customReply || ""
      };
    });

    // 最新提交的排在最上面
    setTasks(formattedTasks.reverse());
  }, []);

  // 2. 當切換/點擊任務時：串接真實 Gemini 1.5 Flash API + 觸發打字機效果
  useEffect(() => {
    // 定義一個非同步的 API 呼叫函式
    const fetchAiSuggestion = async () => {
      if (!selectedTask) return;
      
      setDisplayedText("🪄 AI 正在深度分析客戶訴求並擬定草稿...");
      setManualReply(selectedTask.customReply || ""); 

      // ⚠️ 請在此處填入你從 Google AI Studio 申請到的真實 API Key
      const GEMINI_API_KEY = process.env.REACT_APP_GEMINI_API_KEY; 
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;

      // 建立 System Prompt，限制 AI 必須扮演台灣大客服，且必須使用台灣在地用語
      const systemPrompt = `你是一位精通電信業務的「台灣大哥大」高級客服專家。
請針對使用者的抱怨或報修內容，進行專業安撫並給出具體的下一步解決步驟。
回覆規範：
1. 必須使用親切的繁體中文（例如使用：您好、專員、門號、資費、續約、訊號，切勿出現內地或簡體用語）。
2. 字數控制在 100 到 150 字以內，語氣要溫柔客氣、富有同理心。`;

      try {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: `${systemPrompt}\n\n客戶姓名: ${selectedTask.customer}\n問題類別: ${selectedTask.category}\n客戶反映內文: ${selectedTask.content}`
              }]
            }]
          })
        });

        const data = await response.json();
        
        // 解析 Gemini 撈回來的真實文字
        const aiReply = data.candidates[0].content.parts[0].text;

        // 【打字機效果】將真實的 AI 文本一個一個字印在畫面上
        setDisplayedText(""); 
        let index = 0;
        const timer = setInterval(() => {
          setDisplayedText((prev) => prev + aiReply.charAt(index));
          index++;
          if (index >= aiReply.length) clearInterval(timer);
        }, 20); 

        return () => clearInterval(timer);

      } catch (error) {
        console.error("Gemini API 呼叫失敗：", error);
        setDisplayedText("❌ AI 助理目前連線超時，請檢查 API Key 或網路設定。");
      }
    };

    fetchAiSuggestion();
  }, [selectedTask]);

  // 3. 點擊任務與動態預設情緒（未來可進一步與 Gemini 整合一同判斷）
  const handleSelectTask = (task) => {
    if (task.sentiment === "未偵測") {
      const updatedTask = {
        ...task,
        sentiment: "憤怒", 
        ai_tag: task.category === "帳單爭議" ? "帳單爭議" : "技術支援"
      };
      setTasks(prev => prev.map(t => t.id === task.id ? updatedTask : t));
      setSelectedTask(updatedTask);
    } else {
      setSelectedTask(task);
    }
  };

  // 4. 更新處理狀態
  const handleStatusChange = (newStatus) => {
    if (!selectedTask) return;
    const updated = { ...selectedTask, status: newStatus };
    setTasks(prev => prev.map(t => t.id === selectedTask.id ? updated : t));
    setSelectedTask(updated);
  };

  // 5. 即時同步手動回覆內容
  const handleManualReplyChange = (text) => {
    setManualReply(text);
    const updated = { ...selectedTask, customReply: text };
    setTasks(prev => prev.map(t => t.id === selectedTask.id ? updated : t));
    selectedTask.customReply = text; 
  };

  const handleSend = () => {
    setIsSending(true);
    setTimeout(() => {
      alert(`✅ 案件 [${selectedTask.ticketNo}] 回覆發送成功\n處理狀態：${selectedTask.status}`);
      setIsSending(false);
    }, 1000);
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case '已結案': return { bg: '#e6ffed', text: '#52c41a', border: '#b7eb8f' };
      case '處理中': return { bg: '#fff7e6', text: '#fa8c16', border: '#ffd591' };
      default: return { bg: '#fff1f0', text: '#f5222d', border: '#ffa39e' };
    }
  };

  return (
    <div style={{ backgroundColor: '#f0f2f5', minHeight: '100vh', fontFamily: '"Microsoft JhengHei", sans-serif' }}>
      <header style={{ backgroundColor: '#F08300', color: 'white', padding: '15px 30px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: '24px' }}>台灣大 | AI 全通路客服中控台</h1>
        <span>管理員：Admin</span>
      </header>

      <main style={{ display: 'flex', padding: '20px', gap: '20px', height: 'calc(100vh - 100px)' }}>
        {/* 左側：任務列表 */}
        <section style={{ flex: 1, backgroundColor: 'white', borderRadius: '8px', overflowY: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ padding: '15px', borderBottom: '2px solid #F08300', position: 'sticky', top: 0, backgroundColor: 'white', zIndex: 1 }}>
            <h2 style={{ margin: 0, fontSize: '18px' }}>待處理任務 ({tasks.length})</h2>
          </div>
          
          {tasks.length === 0 ? (
            <div style={{ padding: '30px', textAlign: 'center', color: '#999', fontSize: '14px' }}>
              📭 目前尚無新進案件
            </div>
          ) : (
            tasks.map(item => {
              const statusStyle = getStatusStyle(item.status);
              return (
                <div 
                  key={item.id} 
                  onClick={() => handleSelectTask(item)} 
                  style={{ 
                    padding: '15px', borderBottom: '1px solid #eee', cursor: 'pointer', 
                    backgroundColor: selectedTask?.id === item.id ? '#fff7e6' : 'white',
                    transition: 'background-color 0.2s'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', alignItems: 'center' }}>
                    <strong>#{item.ticketNo} 客戶: {item.customer}</strong>
                    <span style={{ 
                      fontSize: '11px', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold',
                      backgroundColor: statusStyle.bg, color: statusStyle.text, border: `1px solid ${statusStyle.border}`
                    }}>
                      {item.status}
                    </span>
                  </div>
                  <div style={{ fontSize: '13px', color: '#666', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    [{item.category}] {item.content}
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* 右側：詳細內容面板 */}
        <section style={{ flex: 2, backgroundColor: 'white', borderRadius: '8px', padding: '25px', display: 'flex', flexDirection: 'column', overflowY: 'auto', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          {selectedTask ? (
            <>
              <div style={{ borderBottom: '1px solid #eee', marginBottom: '15px', paddingBottom: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h2 style={{ color: '#333', marginTop: 0 }}>案件編號 #{selectedTask.ticketNo} 詳情</h2>
                  <div>
                    <strong style={{ fontSize: '14px', marginRight: '5px' }}>進度管理：</strong>
                    <select 
                      value={selectedTask.status} 
                      onChange={(e) => handleStatusChange(e.target.value)}
                      style={{ padding: '6px', borderRadius: '4px', border: '1px solid #ccc', fontWeight: 'bold' }}
                    >
                      <option value="待處理">🔴 待處理</option>
                      <option value="處理中">🟡 處理中</option>
                      <option value="已結案">🟢 已結案</option>
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '15px', marginTop: '10px' }}>
                  <span style={{ 
                    padding: '4px 12px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold',
                    backgroundColor: selectedTask.sentiment === '憤怒' ? '#fff1f0' : selectedTask.sentiment === '未偵測' ? '#f5f5f5' : '#f6ffed',
                    color: selectedTask.sentiment === '憤怒' ? '#f5222d' : selectedTask.sentiment === '未偵測' ? '#666' : '#52c41a',
                    border: `1px solid ${selectedTask.sentiment === '憤怒' ? '#ffa39e' : selectedTask.sentiment === '未偵測' ? '#d9d9d9' : '#b7eb8f'}`
                  }}>
                    情緒偵測：{selectedTask.sentiment} {selectedTask.sentiment === '憤怒' ? '⚠️' : selectedTask.sentiment === '未偵測' ? '🔍' : '😊'}
                  </span>
                </div>
                
                <p style={{ 
                  backgroundColor: selectedTask.sentiment === '憤怒' ? '#fffbfa' : '#f9f9f9', 
                  padding: '15px', borderRadius: '5px', 
                  borderLeft: `4px solid ${selectedTask.sentiment === '憤怒' ? '#f5222d' : '#F08300'}` 
                }}>
                  <strong>客戶反映：</strong>{selectedTask.content}
                </p>
              </div>

              <div style={{ backgroundColor: '#e6f7ff', padding: '20px', borderRadius: '8px', border: '1px solid #91d5ff', marginBottom: '15px' }}>
                <h3 style={{ marginTop: 0, color: '#0050b3', fontSize: '16px' }}>🪄 AI 智慧助理建議</h3>
                <p style={{ margin: '5px 0' }}><strong>建議處理方向：</strong> <span style={{ background: '#bae7ff', padding: '2px 8px', borderRadius: '4px' }}>{selectedTask.ai_tag}</span></p>
                <div style={{ marginTop: '10px' }}>
                  <strong>建議回覆草稿：</strong>
                  <div style={{ backgroundColor: 'white', padding: '12px', borderRadius: '5px', marginTop: '5px', fontSize: '14px', lineHeight: '1.6', minHeight: '60px', border: '1px solid #d9d9d9', color: '#555' }}>
                    {displayedText}
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#f9f9f9', padding: '20px', borderRadius: '8px', border: '1px solid #d9d9d9', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <h3 style={{ marginTop: 0, color: '#333', fontSize: '16px' }}>手動回覆</h3>
                <textarea 
                  value={manualReply}
                  onChange={(e) => handleManualReplyChange(e.target.value)}
                  placeholder="可在此輸入自訂回覆內容..."
                  rows="4"
                  style={{ width: '100%', padding: '10px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box', fontFamily: 'inherit', resize: 'vertical' }}
                />
                <button 
                  onClick={handleSend}
                  disabled={isSending}
                  style={{ 
                    alignSelf: 'flex-end', padding: '10px 25px', 
                    backgroundColor: isSending ? '#ccc' : '#F08300', 
                    color: 'white', border: 'none', borderRadius: '5px', 
                    cursor: isSending ? 'not-allowed' : 'pointer', fontWeight: 'bold'
                  }}
                >
                  {isSending ? "發送中..." : "確認發送此案件回覆"}
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#999' }}>
              請從左側選擇一個任務進行處理
            </div>
          )}
        </section>
      </main>
    </div>
  );
}

export default AdminPage;