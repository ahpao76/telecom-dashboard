import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
// 引入你剛剛搬家好的兩個房間
import CustomerPage from './pages/CustomerPage'; 
import AdminPage from './pages/AdminPage';

function App() {
  return (
    <Router>
      <Routes>
        {/* 當網址是 http://localhost:3000/ 時，顯示客戶報修頁 */}
        <Route path="/" element={<CustomerPage />} />

        {/* 當網址是 http://localhost:3000/admin 時，顯示客服中控台 */}
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  );
}

export default App;