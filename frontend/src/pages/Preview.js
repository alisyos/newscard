import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateImage } from '../utils/api';
import { downloadCardImage, downloadAllImages } from '../utils/download';

// 기본 샘플 데이터 (API 응답이 없을 경우 사용)
const sampleCards = [
  { title: '카드 1', content: '첫 번째 카드 내용', image: '', highlight: '강조문구1' },
  { title: '카드 2', content: '두 번째 카드 내용', image: '', highlight: '강조문구2' },
  { title: '카드 3', content: '세 번째 카드 내용', image: '', highlight: '강조문구3' },
];

// 이미지 스타일 옵션
const styleOptions = [
  "사진", "만화", "일러스트", "수채화", "유화", "디지털 아트", "3D 렌더링", "픽셀 아트", "심플 그래픽"
];

// 배경색 옵션
const colorOptions = [
  "", "흰색", "검정색", "파란색", "빨간색", "녹색", "노란색", "보라색", "분홍색", "주황색", "하늘색"
];

const Preview = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [cards, setCards] = useState(sampleCards);
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedCard, setEditedCard] = useState({});
  const [imageStyle, setImageStyle] = useState('사진');
  const [backgroundColor, setBackgroundColor] = useState('');
  
  useEffect(() => {
    // 세션 스토리지에서 카드뉴스 데이터 가져오기
    const storedData = sessionStorage.getItem('cardNewsData');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        if (parsedData.cards && parsedData.cards.length > 0) {
          setCards(parsedData.cards);
        }
      } catch (error) {
        console.error('Failed to parse card news data:', error);
      }
    }
  }, []);

  useEffect(() => {
    // 현재 카드가 변경될 때마다 편집 데이터 초기화
    if (cards[page]) {
      setEditedCard(cards[page]);
    }
  }, [page, cards]);

  const handleGenerateImage = async (cardIndex) => {
    // 이미지 생성 API 호출
    const card = isEditing ? editedCard : cards[cardIndex];
    if (!card.image) {
      setLoading(true);
      try {
        // 프롬프트가 없는 경우 새로운 형식에 맞는 기본 프롬프트 생성
        const prompt = card.prompt || `고품질의 카드뉴스 이미지를 생성해주세요. "${card.title}"의 주제에 맞는 시각적으로 매력적인 이미지. 텍스트 없이 시각적 요소만으로 주제를 전달할 수 있도록 해주세요.`;
        
        // 카드의 제목, 내용, 강조 문구를 함께 전달
        const result = await generateImage(
          prompt, 
          card.title, 
          card.content, 
          card.highlight,
          imageStyle,
          backgroundColor
        );
        
        // 이미지 URL 업데이트
        if (result.image_url) {
          if (isEditing) {
            setEditedCard({
              ...editedCard,
              image: result.image_url
            });
          } else {
            const updatedCards = [...cards];
            updatedCards[cardIndex] = {
              ...updatedCards[cardIndex],
              image: result.image_url
            };
            setCards(updatedCards);
            
            // 세션 스토리지에도 업데이트
            sessionStorage.setItem('cardNewsData', JSON.stringify({ cards: updatedCards }));
          }
        }
      } catch (error) {
        console.error('Failed to generate image:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // 편집 모드 종료 시 변경사항 저장
      const updatedCards = [...cards];
      updatedCards[page] = editedCard;
      setCards(updatedCards);
      
      // 세션 스토리지에도 업데이트
      sessionStorage.setItem('cardNewsData', JSON.stringify({ cards: updatedCards }));
    }
    setIsEditing(!isEditing);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedCard({
      ...editedCard,
      [name]: value
    });
  };

  const handleDownloadCurrent = async () => {
    const card = isEditing ? editedCard : cards[page];
    if (card.image) {
      await downloadCardImage(card, page);
    }
  };

  const handleDownloadAll = async () => {
    setDownloadLoading(true);
    try {
      // 이미지가 있는 카드만 필터링
      const cardsWithImages = cards.filter(card => card.image);
      if (cardsWithImages.length === 0) {
        alert('다운로드할 이미지가 없습니다. 먼저 이미지를 생성해주세요.');
        return;
      }
      
      // 모든 이미지 다운로드
      const count = await downloadAllImages(cardsWithImages);
      alert(`${count}개의 이미지가 다운로드되었습니다.`);
    } catch (error) {
      console.error('다운로드 오류:', error);
      alert('다운로드 중 오류가 발생했습니다.');
    } finally {
      setDownloadLoading(false);
    }
  };

  const card = isEditing ? editedCard : cards[page];

  // 카드 편집 폼
  const renderEditForm = () => (
    <div style={{marginBottom: 16, border: '1px solid #ddd', padding: 16, borderRadius: 8}}>
      <h3>카드 내용 편집</h3>
      <div style={{marginBottom: 10}}>
        <label style={{display: 'block', marginBottom: 5}}>메인문구:</label>
        <input
          type="text"
          name="title"
          value={editedCard.title || ''}
          onChange={handleInputChange}
          style={{width: '100%', padding: 8}}
        />
      </div>
      <div style={{marginBottom: 10}}>
        <label style={{display: 'block', marginBottom: 5}}>강조 문구:</label>
        <input
          type="text"
          name="highlight"
          value={editedCard.highlight || ''}
          onChange={handleInputChange}
          style={{width: '100%', padding: 8}}
        />
      </div>
      <div style={{marginBottom: 10}}>
        <label style={{display: 'block', marginBottom: 5}}>내용:</label>
        <textarea
          name="content"
          value={editedCard.content || ''}
          onChange={handleInputChange}
          style={{width: '100%', padding: 8, minHeight: 100}}
        />
      </div>
      <div style={{marginBottom: 10}}>
        <label style={{display: 'block', marginBottom: 5}}>이미지 프롬프트:</label>
        <textarea
          name="prompt"
          value={editedCard.prompt || ''}
          onChange={handleInputChange}
          style={{width: '100%', padding: 8, minHeight: 60}}
          placeholder="이미지 생성을 위한 상세 지침을 입력하세요"
        />
      </div>
      
      <div style={{display: 'flex', marginBottom: 10}}>
        <div style={{flex: 1, marginRight: 10}}>
          <label style={{display: 'block', marginBottom: 5}}>이미지 스타일:</label>
          <select
            value={imageStyle}
            onChange={(e) => setImageStyle(e.target.value)}
            style={{width: '100%', padding: 8}}
          >
            {styleOptions.map(option => (
              <option key={option} value={option}>{option}</option>
            ))}
          </select>
        </div>
        <div style={{flex: 1}}>
          <label style={{display: 'block', marginBottom: 5}}>배경색:</label>
          <select
            value={backgroundColor}
            onChange={(e) => setBackgroundColor(e.target.value)}
            style={{width: '100%', padding: 8}}
          >
            <option value="">선택 안함</option>
            {colorOptions.filter(c => c).map(color => (
              <option key={color} value={color}>{color}</option>
            ))}
          </select>
        </div>
      </div>
      
      <button 
        onClick={() => handleGenerateImage(page)} 
        disabled={loading}
        style={{
          padding: '10px 15px',
          backgroundColor: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginTop: 10
        }}
      >
        {loading ? '이미지 생성 중...' : '이미지 다시 생성하기'}
      </button>
    </div>
  );

  const renderCardPreview = () => (
    <div style={{border: '1px solid #ccc', borderRadius: 8, padding: 24, marginBottom: 16}}>
      <h3>{card.title}</h3>
      {card.image ? (
        <div>
          <img 
            src={card.image} 
            alt={card.title} 
            style={{width: '100%', marginBottom: 16, borderRadius: 4}}
          />
          <button 
            onClick={handleDownloadCurrent} 
            style={{
              marginBottom: 16,
              padding: 8,
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: 4,
              cursor: 'pointer'
            }}
          >
            현재 이미지 다운로드
          </button>
        </div>
      ) : (
        <button 
          onClick={() => handleGenerateImage(page)} 
          disabled={loading}
          style={{
            marginBottom: 16,
            padding: 8,
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: loading ? 'not-allowed' : 'pointer'
          }}
        >
          {loading ? '이미지 생성 중...' : '이미지 생성하기'}
        </button>
      )}
      <p>{card.content}</p>
      <strong style={{color: '#1976d2'}}>{card.highlight}</strong>
      
      {card.prompt && (
        <div style={{marginTop: 10, fontSize: '0.9em', color: '#666', fontStyle: 'italic'}}>
          <p>이미지 프롬프트: {card.prompt}</p>
        </div>
      )}
    </div>
  );

  return (
    <div style={{maxWidth: 500, margin: '40px auto', textAlign: 'center'}}>
      <h2>카드뉴스 미리보기</h2>
      
      <div style={{display: 'flex', justifyContent: 'flex-end', marginBottom: 10}}>
        <button 
          onClick={handleEditToggle}
          style={{
            padding: '6px 12px',
            backgroundColor: isEditing ? '#4caf50' : '#f1f1f1',
            color: isEditing ? 'white' : 'black',
            border: 'none',
            borderRadius: 4,
            cursor: 'pointer'
          }}
        >
          {isEditing ? '저장' : '편집'}
        </button>
      </div>
      
      {isEditing ? renderEditForm() : renderCardPreview()}
      
      <div>
        <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0}>이전</button>
        <span style={{margin: '0 16px'}}>{page+1} / {cards.length}</span>
        <button onClick={() => setPage(p => Math.min(cards.length-1, p+1))} disabled={page === cards.length-1}>다음</button>
      </div>
      <div style={{marginTop: 24}}>
        <button 
          onClick={handleDownloadAll} 
          disabled={downloadLoading}
          style={{
            padding: 8,
            backgroundColor: '#1976d2',
            color: 'white',
            border: 'none',
            borderRadius: 4,
            cursor: downloadLoading ? 'not-allowed' : 'pointer'
          }}
        >
          {downloadLoading ? '다운로드 중...' : '모든 이미지 다운로드'}
        </button>
      </div>
      <div style={{marginTop: 12}}>
        <button onClick={() => navigate('/editor')}>다시 만들기</button>
        <button style={{marginLeft: 8}} onClick={() => navigate('/')}>홈으로</button>
      </div>
    </div>
  );
};
export default Preview; 