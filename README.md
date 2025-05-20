# AI 카드뉴스 생성기

OpenAI API를 활용한, 텍스트 입력에서 고품질 카드뉴스를 자동으로 생성하는 웹 애플리케이션입니다.

## 주요 기능

- 주제, 요점, 키메시지를 입력해 카드뉴스 생성
- 텍스트 직접 입력 또는 파일 업로드 지원
- GPT-4.1 기반의 카드뉴스 텍스트 자동 생성
- GPT-Image-1 기반의 고품질 이미지 자동 생성
- 생성된 카드뉴스 이미지 다운로드 기능

## 기술 스택

### 백엔드
- Python
- Flask
- OpenAI API (GPT-4.1, GPT-Image-1)

### 프론트엔드
- React
- JavaScript
- Axios

## 설치 및 실행 방법

### 백엔드 설정

1. 백엔드 디렉토리로 이동
   ```
   cd backend
   ```

2. 필요한 패키지 설치
   ```
   pip install -r requirements.txt
   ```

3. `.env` 파일 생성 및 OpenAI API 키 설정
   ```
   OPENAI_API_KEY=your_api_key_here
   ```

4. 서버 실행
   ```
   python flask_app.py
   ```

### 프론트엔드 설정

1. 프론트엔드 디렉토리로 이동
   ```
   cd frontend
   ```

2. 필요한 패키지 설치
   ```
   npm install
   ```

3. 개발 서버 실행
   ```
   npm start
   ```

## 사용 방법

1. 브라우저에서 `http://localhost:3000` 접속
2. 주제, 요점, 키메시지, 카드 수(1-10), 첨부내용 입력
3. "카드뉴스 생성" 버튼 클릭
4. 생성된 카드뉴스 확인 및 이미지 생성
5. 생성된 이미지 다운로드 