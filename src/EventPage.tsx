import { useEffect, useState } from 'react';
import { supabase } from './lib/supabaseClient';

export default function EventPage() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data } = await supabase.from('events').select('*');
      setEvents(data || []);
    };
    fetchEvents();
  }, []);

  return (
    <div style={{ backgroundColor: '#F8F9FA', minHeight: '100vh', fontFamily: 'Pretendard, sans-serif' }}>
      {/* 피그마의 상단 헤더 */}
      <div style={{ backgroundColor: '#fff', padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #EEE' }}>
        <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#3ecf8e' }}>Odd School</span>
        <div style={{ width: '24px' }}></div> {/* 균형을 위한 빈 공간 */}
      </div>

      <div style={{ padding: '24px 20px' }}>
        <h2 style={{ fontSize: '22px', fontWeight: '800', marginBottom: '8px', letterSpacing: '-0.5px' }}>이벤트 알림</h2>
        <p style={{ color: '#888', fontSize: '14px', marginBottom: '24px' }}>오드 스쿨의 최신 소식을 만나보세요.</p>

        {/* 이벤트 카드 영역 */}
        <div style={{ display: 'grid', gap: '16px' }}>
          {events.map(e => (
            <div key={e.id} style={{ backgroundColor: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 10px 20px rgba(0,0,0,0.04)', border: '1px solid #F1F1F1' }}>
              <div style={{ display: 'inline-block', backgroundColor: '#E8F9F1', color: '#3ecf8e', padding: '4px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: '700', marginBottom: '12px' }}>
                EVENT
              </div>
              <h3 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px', color: '#1A1A1A' }}>{e.title}</h3>
              <p style={{ color: '#666', fontSize: '14px', marginBottom: '20px' }}>📍 {e.location}</p>
              
              {/* 피그마에서 본 그 버튼! */}
              <button style={{ 
                width: '100%', 
                padding: '14px', 
                backgroundColor: '#3ecf8e', 
                color: '#fff', 
                border: 'none', 
                borderRadius: '12px', 
                fontWeight: '700',
                fontSize: '15px',
                cursor: 'pointer'
              }}>
                자세히 보기
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}