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

const Preview = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [cards, setCards] = useState(sampleCards);
  const [loading, setLoading] = useState(false);
  const [downloadLoading, setDownloadLoading] = useState(false);
  
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

  const handleGenerateImage = async (cardIndex) => {
    // 이미지 생성 API 호출
    const card = cards[cardIndex];
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
          card.highlight
        );
        
        // 이미지 URL 업데이트
        if (result.image_url) {
          const updatedCards = [...cards];
          updatedCards[cardIndex] = {
            ...updatedCards[cardIndex],
            image: result.image_url
          };
          setCards(updatedCards);
          
          // 세션 스토리지에도 업데이트
          sessionStorage.setItem('cardNewsData', JSON.stringify({ cards: updatedCards }));
        }
      } catch (error) {
        console.error('Failed to generate image:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleDownloadCurrent = async () => {
    const card = cards[page];
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

  const card = cards[page];

  return (
    <div style={{maxWidth: 500, margin: '40px auto', textAlign: 'center'}}>
      <h2>카드뉴스 미리보기</h2>
      <div style={{border: '1px solid #ccc', borderRadius: 8, padding: 24, marginBottom: 16}}>
        <h3>{card.title}</h3>
        {card.image ? (
          <div>
            <img 
              src={card.image} 
              alt={card.title} 
              style={{width: '100%', marginBottom: 16, borderRadius: 4}}
            />
            <button onClick={handleDownloadCurrent} style={{marginBottom: 16}}>
              현재 이미지 다운로드
            </button>
          </div>
        ) : (
          <button 
            onClick={() => handleGenerateImage(page)} 
            disabled={loading}
            style={{marginBottom: 16}}
          >
            {loading ? '이미지 생성 중...' : '이미지 생성하기'}
          </button>
        )}
        <p>{card.content}</p>
        <strong style={{color: '#1976d2'}}>{card.highlight}</strong>
      </div>
      <div>
        <button onClick={() => setPage(p => Math.max(0, p-1))} disabled={page === 0}>이전</button>
        <span style={{margin: '0 16px'}}>{page+1} / {cards.length}</span>
        <button onClick={() => setPage(p => Math.min(cards.length-1, p+1))} disabled={page === cards.length-1}>다음</button>
      </div>
      <div style={{marginTop: 24}}>
        <button onClick={handleDownloadAll} disabled={downloadLoading}>
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