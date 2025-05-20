import React, { useState, useEffect } from 'react';
import { analyzeText, uploadFile, generateImage } from '../utils/api';
import { downloadCardImage, downloadAllImages } from '../utils/download';

// 스타일 정의
const styles = {
  container: {
    display: 'flex',
    height: '100vh',
    width: '100%',
    flexDirection: 'row',
  },
  leftPanel: {
    flex: '1',
    borderRight: '1px solid #ddd',
    padding: '20px',
    overflowY: 'auto',
    backgroundColor: '#f8f9fa',
  },
  rightPanel: {
    flex: '1',
    padding: '20px',
    overflowY: 'auto',
    backgroundColor: '#fff',
  },
  header: {
    marginBottom: '20px',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: '15px',
  },
  label: {
    display: 'block',
    marginBottom: '5px',
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
  },
  numberInput: {
    width: '100%',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    appearance: 'textfield',
  },
  textarea: {
    width: '100%',
    height: '100px',
    marginBottom: '10px',
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    resize: 'vertical',
  },
  fileInput: {
    marginBottom: '20px',
  },
  tabs: {
    display: 'flex',
    marginBottom: '10px',
  },
  tab: {
    padding: '8px 16px',
    border: '1px solid #ddd',
    borderRadius: '4px 4px 0 0',
    backgroundColor: '#f1f1f1',
    cursor: 'pointer',
    marginRight: '5px',
  },
  activeTab: {
    padding: '8px 16px',
    border: '1px solid #ddd',
    borderBottom: '1px solid #fff',
    borderRadius: '4px 4px 0 0',
    backgroundColor: '#fff',
    cursor: 'pointer',
    marginRight: '5px',
    fontWeight: 'bold',
  },
  tabContent: {
    border: '1px solid #ddd',
    borderRadius: '0 4px 4px 4px',
    padding: '15px',
    backgroundColor: '#fff',
  },
  button: {
    padding: '10px 15px',
    margin: '5px',
    backgroundColor: '#1976d2',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  disabledButton: {
    padding: '10px 15px',
    margin: '5px',
    backgroundColor: '#ccc',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'not-allowed',
  },
  cardPreview: {
    border: '1px solid #ddd',
    borderRadius: '8px',
    padding: '20px',
    marginBottom: '20px',
    backgroundColor: '#fff',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
  },
  cardImage: {
    width: '100%',
    marginBottom: '16px',
    borderRadius: '4px',
  },
  navigation: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    margin: '20px 0',
  },
  errorMessage: {
    color: 'red',
    marginBottom: '10px',
  },
  highlightText: {
    color: '#1976d2',
    fontWeight: 'bold',
  }
};

// 기본 샘플 카드 데이터
const sampleCards = [
  { title: '샘플 카드', content: '샘플 카드 내용입니다. 실제 텍스트를 입력하거나 파일을 업로드하면 AI가 카드뉴스를 생성합니다.', image: '', highlight: '샘플 강조 문구' },
];

const SplitView = () => {
  const [topic, setTopic] = useState(''); // 주제
  const [keyPoints, setKeyPoints] = useState(''); // 요점
  const [keyMessage, setKeyMessage] = useState(''); // 키메시지
  const [cardCount, setCardCount] = useState(5); // 원하는 카드 수 (기본값 5)
  const [contentType, setContentType] = useState('text'); // text 또는 file
  const [additionalContent, setAdditionalContent] = useState(''); // 첨부내용 (텍스트)
  const [files, setFiles] = useState([]); // 첨부내용 (파일)
  const [cards, setCards] = useState(sampleCards);
  const [currentPage, setCurrentPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [imageLoading, setImageLoading] = useState(false);
  const [error, setError] = useState('');
  const [downloadLoading, setDownloadLoading] = useState(false);

  // 파일 선택 처리
  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };

  // 카드 수 변경 처리
  const handleCardCountChange = (e) => {
    const value = parseInt(e.target.value, 10);
    if (value >= 1 && value <= 10) {
      setCardCount(value);
    }
  };

  // 입력 필드 유효성 검사
  const validateInputs = () => {
    if (!topic.trim()) {
      setError('주제를 입력해주세요.');
      return false;
    }
    
    if (contentType === 'text' && !additionalContent.trim()) {
      setError('첨부내용을 입력해주세요.');
      return false;
    }
    
    if (contentType === 'file' && files.length === 0) {
      setError('파일을 업로드해주세요.');
      return false;
    }
    
    return true;
  };

  // 텍스트 또는 파일 제출 처리
  const handleSubmit = async () => {
    if (!validateInputs()) {
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      let result;
      
      // 모든 입력 필드 내용 조합
      const fullText = `주제: ${topic}\n요점: ${keyPoints}\n키메시지: ${keyMessage}\n카드수: ${cardCount}\n내용: ${contentType === 'text' ? additionalContent : '첨부 파일 참조'}`;
      
      // 텍스트 분석 또는 파일 업로드
      if (contentType === 'text') {
        console.log('Submitting text:', fullText);
        result = await analyzeText(fullText);
      } else if (contentType === 'file' && files.length > 0) {
        console.log('Submitting file:', files[0].name);
        result = await uploadFile(files[0]);
      }
      
      console.log('API response:', result);
      
      // 결과 처리
      if (result && result.cards && result.cards.length > 0) {
        setCards(result.cards);
        setCurrentPage(0);
      } else {
        setError('서버 응답에 카드 데이터가 없습니다.');
        console.error('Invalid response format:', result);
      }
    } catch (err) {
      setError('카드뉴스 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error('API call error:', err);
    } finally {
      setLoading(false);
    }
  };

  // 이미지 생성 처리
  const handleGenerateImage = async (cardIndex) => {
    const card = cards[cardIndex];
    if (!card.image) {
      setImageLoading(true);
      try {
        // 새로운 프롬프트 형식에 맞게 기본 프롬프트 업데이트
        const prompt = card.prompt || `고품질의 카드뉴스 이미지를 생성해주세요. "${card.title}"의 주제에 맞는 시각적으로 매력적인 이미지. 텍스트 없이 시각적 요소만으로 주제를 전달할 수 있도록 해주세요.`;
        
        // 카드의 제목, 내용, 강조 문구를 함께 전달
        const result = await generateImage(
          prompt, 
          card.title, 
          card.content, 
          card.highlight
        );
        
        if (result.image_url) {
          const updatedCards = [...cards];
          updatedCards[cardIndex] = {
            ...updatedCards[cardIndex],
            image: result.image_url
          };
          setCards(updatedCards);
        } else {
          setError('이미지 URL을 받지 못했습니다.');
        }
      } catch (error) {
        setError('이미지 생성 중 오류가 발생했습니다.');
        console.error('Failed to generate image:', error);
      } finally {
        setImageLoading(false);
      }
    }
  };

  // 현재 카드 이미지 다운로드
  const handleDownloadCurrent = async () => {
    const card = cards[currentPage];
    if (card.image) {
      await downloadCardImage(card, currentPage);
    } else {
      setError('다운로드할 이미지가 없습니다. 먼저 이미지를 생성해주세요.');
    }
  };

  // 모든 카드 이미지 다운로드
  const handleDownloadAll = async () => {
    setDownloadLoading(true);
    try {
      const cardsWithImages = cards.filter(card => card.image);
      if (cardsWithImages.length === 0) {
        setError('다운로드할 이미지가 없습니다. 먼저 이미지를 생성해주세요.');
        return;
      }
      
      const count = await downloadAllImages(cardsWithImages);
      alert(`${count}개의 이미지가 다운로드되었습니다.`);
    } catch (error) {
      setError('다운로드 중 오류가 발생했습니다.');
      console.error('다운로드 오류:', error);
    } finally {
      setDownloadLoading(false);
    }
  };

  // 현재 표시 중인 카드
  const currentCard = cards[currentPage] || sampleCards[0];
  
  return (
    <div style={styles.container} className="split-layout">
      {/* 좌측 패널 - 입력 영역 */}
      <div style={styles.leftPanel} className="split-panel">
        <div style={styles.header}>
          <h1>AI 카드뉴스 생성기</h1>
          <p>세부 정보를 입력하여 AI 카드뉴스를 생성해보세요.</p>
        </div>
        
        {/* 주제 입력 */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>주제</label>
          <input 
            type="text"
            style={styles.input}
            placeholder="카드뉴스의 주제를 입력하세요"
            value={topic}
            onChange={e => setTopic(e.target.value)}
          />
        </div>
        
        {/* 요점 입력 */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>요점</label>
          <textarea
            style={styles.textarea}
            placeholder="전달하고자 하는 핵심 요점을 입력하세요"
            value={keyPoints}
            onChange={e => setKeyPoints(e.target.value)}
          />
        </div>
        
        {/* 키메시지 입력 */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>키메시지</label>
          <textarea
            style={styles.textarea}
            placeholder="강조하고 싶은 메시지를 입력하세요"
            value={keyMessage}
            onChange={e => setKeyMessage(e.target.value)}
          />
        </div>
        
        {/* 카드 수 입력 */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>카드 수 (1-10)</label>
          <input
            type="number"
            min="1"
            max="10"
            style={styles.numberInput}
            value={cardCount}
            onChange={handleCardCountChange}
          />
          <p style={{fontSize: '0.8rem', marginTop: '5px', color: '#666'}}>
            생성할 카드뉴스의 장수를 선택하세요. (기본: 5장)
          </p>
        </div>
        
        {/* 첨부내용 - 탭 선택 */}
        <div style={styles.inputGroup}>
          <label style={styles.label}>첨부내용</label>
          <div style={styles.tabs}>
            <div 
              style={contentType === 'text' ? styles.activeTab : styles.tab}
              onClick={() => setContentType('text')}
            >
              직접 입력
            </div>
            <div 
              style={contentType === 'file' ? styles.activeTab : styles.tab}
              onClick={() => setContentType('file')}
            >
              파일 업로드
            </div>
          </div>
          
          {/* 탭 내용 */}
          <div style={styles.tabContent}>
            {contentType === 'text' ? (
              <textarea
                style={styles.textarea}
                placeholder="상세 내용을 입력하세요"
                value={additionalContent}
                onChange={e => setAdditionalContent(e.target.value)}
              />
            ) : (
              <div style={styles.fileInput}>
                <input 
                  type="file" 
                  accept=".txt,.pdf,.docx" 
                  onChange={handleFileChange} 
                />
                <p style={{fontSize: '0.8rem', marginTop: '5px'}}>
                  지원 형식: .txt, .pdf, .docx
                </p>
              </div>
            )}
          </div>
        </div>
        
        {error && <p style={styles.errorMessage}>{error}</p>}
        
        <button 
          style={loading ? styles.disabledButton : styles.button}
          onClick={handleSubmit} 
          disabled={loading}
        >
          {loading ? '생성 중...' : '카드뉴스 생성'}
        </button>
      </div>
      
      {/* 우측 패널 - 결과 미리보기 */}
      <div style={styles.rightPanel} className="split-panel">
        <div style={styles.header}>
          <h2>카드뉴스 미리보기</h2>
          <p>생성된 카드뉴스를 확인하고 이미지를 생성/다운로드할 수 있습니다.</p>
        </div>
        
        <div style={styles.cardPreview}>
          {/* 제목 */}
          <h3>{currentCard.title}</h3>
          
          {/* 강조 문구 */}
          <p style={{...styles.highlightText, marginBottom: '20px'}}>
            <strong>강조:</strong> {currentCard.highlight}
          </p>
          
          {/* 내용 */}
          <div style={{marginBottom: '20px'}}>
            <strong>내용:</strong>
            <p>{currentCard.content}</p>
          </div>
          
          {/* 프롬프트 */}
          <div style={{marginBottom: '20px'}}>
            <strong>이미지 프롬프트:</strong>
            <p style={{fontStyle: 'italic', color: '#555'}}>{currentCard.prompt || '프롬프트가 없습니다.'}</p>
          </div>
          
          {/* 이미지 또는 이미지 생성 버튼 */}
          {currentCard.image ? (
            <div>
              <img 
                src={currentCard.image} 
                alt={currentCard.title} 
                style={styles.cardImage}
              />
            </div>
          ) : (
            <button 
              style={imageLoading ? styles.disabledButton : styles.button}
              onClick={() => handleGenerateImage(currentPage)} 
              disabled={imageLoading}
            >
              {imageLoading ? '이미지 생성 중...' : '이미지 생성하기'}
            </button>
          )}
        </div>
        
        {/* 탐색 컨트롤 */}
        {cards.length > 1 && (
          <div style={styles.navigation}>
            <button 
              style={currentPage === 0 ? styles.disabledButton : styles.button}
              onClick={() => setCurrentPage(p => Math.max(0, p-1))} 
              disabled={currentPage === 0}
            >
              이전
            </button>
            <span style={{margin: '0 16px'}}>{currentPage+1} / {cards.length}</span>
            <button 
              style={currentPage === cards.length-1 ? styles.disabledButton : styles.button}
              onClick={() => setCurrentPage(p => Math.min(cards.length-1, p+1))} 
              disabled={currentPage === cards.length-1}
            >
              다음
            </button>
          </div>
        )}
        
        {/* 다운로드 버튼 */}
        <div style={{marginTop: '20px', textAlign: 'center'}}>
          <button 
            style={!currentCard.image ? styles.disabledButton : styles.button}
            onClick={handleDownloadCurrent} 
            disabled={!currentCard.image}
          >
            현재 이미지 다운로드
          </button>
          <button 
            style={downloadLoading ? styles.disabledButton : styles.button}
            onClick={handleDownloadAll} 
            disabled={downloadLoading}
          >
            {downloadLoading ? '다운로드 중...' : '모든 이미지 다운로드'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SplitView; 