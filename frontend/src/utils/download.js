// 카드뉴스 다운로드 기능을 위한 유틸리티

// 이미지 URL을 Blob으로 변환
export const urlToBlob = async (url) => {
  const response = await fetch(url);
  const blob = await response.blob();
  return blob;
};

// 단일 카드뉴스 이미지 다운로드
export const downloadCardImage = async (card, index) => {
  if (!card.image) {
    console.error('이미지가 없습니다.');
    return false;
  }
  
  try {
    const a = document.createElement('a');
    a.href = card.image;
    a.download = `카드뉴스_${index + 1}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return true;
  } catch (error) {
    console.error('이미지 다운로드 오류:', error);
    return false;
  }
};

// 모든 카드뉴스 이미지 다운로드 (zip 형태로)
export const downloadAllImages = async (cards) => {
  // zip 라이브러리가 필요한 경우 추가 구현
  // 여기서는 간단하게 각 이미지를 개별적으로 다운로드
  
  let successCount = 0;
  
  for (let i = 0; i < cards.length; i++) {
    const success = await downloadCardImage(cards[i], i);
    if (success) successCount++;
  }
  
  return successCount;
}; 