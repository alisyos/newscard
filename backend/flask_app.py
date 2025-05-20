from flask import Flask, request, jsonify
from flask_cors import CORS
import os
import json
import logging
import re
from openai import OpenAI
from dotenv import load_dotenv

# 로깅 설정
logging.basicConfig(level=logging.DEBUG, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# 환경 변수 로드
load_dotenv()

# OpenAI API 키 설정
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    logger.warning("WARNING: OPENAI_API_KEY is not set in .env file")

# OpenAI 클라이언트 생성
client = OpenAI(api_key=api_key)

app = Flask(__name__)
CORS(app)  # CORS 설정

# 카드 클래스 정의
class Card:
    def __init__(self, title, content, highlight, image="", prompt=""):
        self.title = title
        self.content = content
        self.highlight = highlight
        self.image = image
        self.prompt = prompt
    
    def to_dict(self):
        return {
            "title": self.title,
            "content": self.content,
            "highlight": self.highlight,
            "image": self.image,
            "prompt": self.prompt
        }

# 샘플 카드 생성 함수
def get_sample_cards(error_message="API 호출 중 오류가 발생했습니다"):
    return [
        Card("샘플 카드 1", f"첫 번째 카드 내용입니다. {error_message}", "강조 문구 1").to_dict(),
        Card("샘플 카드 2", "두 번째 카드 내용입니다.", "강조 문구 2").to_dict(),
        Card("샘플 카드 3", "세 번째 카드 내용입니다.", "강조 문구 3").to_dict(),
    ]

# 텍스트 분석 함수
def analyze_text(text):
    try:
        if not text or len(text.strip()) == 0:
            logger.error("Empty text provided for analysis")
            return get_sample_cards()
            
        logger.info(f"Starting text analysis with OpenAI API, text length: {len(text)}")
        
        # OpenAI API 키 확인
        if not api_key:
            logger.error("OpenAI API key is not set")
            return get_sample_cards("API 키가 설정되지 않았습니다")
        
        # 카드 수 추출 (기본값: 5)
        card_count = 5
        try:
            card_count_match = re.search(r'카드수:\s*(\d+)', text)
            if card_count_match:
                extracted_count = int(card_count_match.group(1))
                # 1-10 사이의 유효한 값으로 제한
                card_count = max(1, min(10, extracted_count))
                logger.info(f"Extracted card count: {card_count}")
        except Exception as count_error:
            logger.warning(f"Failed to extract card count, using default: {str(count_error)}")
        
        messages = [
            {"role": "system", "content": """당신은 고품질 카드뉴스를 생성하는 AI입니다. 
            주어진 텍스트를 분석하여 카드뉴스 구성을 제안하세요.
            각 카드는 다음 형식으로 작성해주세요:
            
            카드 1:
            제목: [카드 제목]
            내용: [카드 내용]
            강조: [강조 문구]
            이미지: [이미지 프롬프트]
            
            카드 2:
            제목: [카드 제목]
            내용: [카드 내용]
            강조: [강조 문구]
            이미지: [이미지 프롬프트]
            
            이런 식으로 각 카드를 명확히 구분해서 작성해주세요."""},
            {"role": "user", "content": f"""다음 텍스트를 바탕으로 SNS용 카드뉴스를 만들어주세요.
            - 각 페이지마다 주제와 설명을 포함하고,
            - 총 {card_count}장으로 구성되게 하며, 강조 문구는 따로 구분해주세요.
            - 주제와 설명을 강조하기 위한 이미지 제안을 해주세요.
            
            텍스트: {text}"""}
        ]
        
        logger.info("Calling OpenAI API...")
        
        try:
            response = client.chat.completions.create(
                model="gpt-4.1",
                messages=messages,
                temperature=0.7,
                max_tokens=1500,
            )
            
            content = response.choices[0].message.content
            logger.info(f"OpenAI API response received, content length: {len(content)}")
            logger.info(f"OpenAI API raw response: {content}")
            
            # 응답 파싱
            cards = []
            
            # 새로운 파싱 로직
            # '카드 1:', '카드 2:' 등의 패턴으로 분할
            card_pattern = r'카드\s*\d+\s*:'
            card_blocks = re.split(card_pattern, content)
            
            # 첫 번째 블록은 카드가 아닐 수 있으므로 건너뛰기
            card_blocks = [block for block in card_blocks if block.strip()]
            
            logger.info(f"Found {len(card_blocks)} card blocks")
            
            for i, block in enumerate(card_blocks):
                logger.info(f"Processing card block {i+1}: {block[:100]}...")
                lines = block.strip().split('\n')
                
                title = ""
                card_content = []
                highlight = ""
                prompt = ""
                
                for line in lines:
                    line = line.strip()
                    if not line:
                        continue
                    
                    if line.startswith("제목:"):
                        title = line.replace("제목:", "").strip()
                    elif line.startswith("강조:"):
                        highlight = line.replace("강조:", "").strip()
                    elif line.startswith("이미지:"):
                        prompt = line.replace("이미지:", "").strip()
                    elif line.startswith("내용:"):
                        card_content.append(line.replace("내용:", "").strip())
                    elif not (line.startswith("카드") or line.startswith("제목") or line.startswith("강조") or line.startswith("이미지")):
                        card_content.append(line)
                
                content_text = "\n".join(card_content).strip()
                
                if title:  # 제목이 있는 경우에만 카드 추가
                    logger.info(f"Adding card: {title}")
                    cards.append(Card(title, content_text, highlight, "", prompt).to_dict())
            
            # 백업 파싱 로직 - 기존 카드가 없는 경우
            if not cards:
                logger.warning("Primary parsing failed, trying backup parsing method")
                sections = content.split("카드 ")
                
                for i, section in enumerate(sections[1:]):
                    logger.debug(f"Backup parsing - section {i+1}: {section[:100]}...")
                    lines = section.strip().split("\n")
                    if len(lines) >= 2:
                        title_line = lines[0].strip()
                        title = title_line.replace(":", "").strip()
                        content_lines = [l for l in lines[1:] if not (l.startswith("강조:") or l.startswith("이미지:"))]
                        content_text = "\n".join(content_lines).strip()
                        
                        # 강조 문구 추출
                        highlight = next((l.replace("강조:", "").strip() for l in lines if l.startswith("강조:")), "")
                        
                        # 이미지 프롬프트 추출
                        prompt = next((l.replace("이미지:", "").strip() for l in lines if l.startswith("이미지:")), "")
                        
                        if title:  # 제목이 있는 경우에만 카드 추가
                            logger.info(f"Adding card from backup method: {title}")
                            cards.append(Card(title, content_text, highlight, "", prompt).to_dict())
            
            # 마지막 백업 - 응답 전체 분석
            if not cards:
                logger.warning("Both parsing methods failed, attempting content extraction")
                
                # 최소한 제목이라도 추출
                title_matches = re.findall(r'제목:([^\n]+)', content)
                
                if title_matches:
                    for i, title in enumerate(title_matches):
                        title = title.strip()
                        logger.info(f"Extracted title: {title}")
                        cards.append(Card(
                            title, 
                            f"카드 내용 {i+1}", 
                            f"강조 {i+1}", 
                            "", 
                            f"이미지 프롬프트 {i+1}"
                        ).to_dict())
            
            # 카드가 없으면 샘플 카드 제공
            if not cards:
                logger.warning("All parsing methods failed, using sample cards")
                return get_sample_cards()
                
            logger.info(f"Successfully generated {len(cards)} cards")
            return cards
            
        except Exception as api_error:
            logger.error(f"OpenAI API call failed: {str(api_error)}")
            # API 호출 실패 시 샘플 카드 반환
            return get_sample_cards(f"API 오류: {str(api_error)}")
            
    except Exception as e:
        logger.error(f"Error in analyze_text: {str(e)}")
        # 오류 발생 시 샘플 카드 반환
        return get_sample_cards(f"처리 오류: {str(e)}")

# 이미지 생성 함수
def generate_image(prompt, title="", content="", highlight="", style="", background_color=""):
    try:
        if not prompt or len(prompt.strip()) == 0:
            logger.error("Empty prompt provided for image generation")
            return ""
            
        # 추가 스타일 정보는 사용자가 명시적으로 지정한 경우에만 포함
        additional_styles = ""
        if style or background_color:
            style_parts = []
            if style:
                style_parts.append(f"스타일: {style}")
            if background_color:
                style_parts.append(f"배경색: {background_color}")
                
            if style_parts:
                additional_styles = "\n\n" + "\n".join(style_parts)
        
        # 카드 정보를 조합하여 풍부한 프롬프트 구성 (스타일 옵션 제외)
        enhanced_prompt = f"""당신은 카드뉴스 생성 전문가 입니다. 아래 조건에 맞는 바로 매체에 등록가능한 수준의 카드뉴스 이미지를 생성해주세요.

[이미지 프롬프트]
{prompt}

[이미지 안에 다음 문구를 포함]
메인문구: {title}
강조: {highlight}
내용: {content}{additional_styles}"""

        logger.info(f"Starting image generation with OpenAI API, prompt length: {len(enhanced_prompt)}")
        logger.debug(f"Enhanced prompt: {enhanced_prompt}")
        
        # OpenAI API 키 확인
        if not api_key:
            logger.error("OpenAI API key is not set")
            return ""
            
        response = client.images.generate(
            model="gpt-image-1",  # 최신 이미지 생성 모델
            prompt=enhanced_prompt,
            size="1024x1024",
            quality="high",
            n=1,
        )
        
        logger.info("Image generated successfully")
        
        # gpt-image-1 모델은 항상 base64 형식으로 이미지를 반환합니다
        if hasattr(response.data[0], 'b64_json'):
            # base64 이미지 데이터 형식: "data:image/png;base64,{base64_encoded_data}"
            return f"data:image/png;base64,{response.data[0].b64_json}"
        elif hasattr(response.data[0], 'url'):
            # 이전 모델 호환성을 위해 url이 있는 경우 url 반환
            return response.data[0].url
        else:
            logger.error("No image data found in API response")
            return ""
        
    except Exception as e:
        logger.error(f"Image generation error: {str(e)}")
        return ""

# 루트 엔드포인트
@app.route('/')
def root():
    return jsonify({"status": "ok", "message": "API server is running"})

# 텍스트 분석 엔드포인트
@app.route('/api/analyze-text', methods=['POST'])
def api_analyze_text():
    try:
        data = request.json
        logger.debug(f"Received raw request data: {data}")
        
        if not data or 'text' not in data:
            return jsonify({"error": "No text provided"}), 400
            
        text = data['text']
        logger.debug(f"Raw input text encoding: {text.encode()}")
        logger.info(f"Analyzing text: {text[:100]}...")
        
        cards = analyze_text(text)
        logger.info(f"Generated {len(cards)} cards")
        
        return jsonify({"cards": cards})
    except Exception as e:
        logger.error(f"Error in analyze_text API: {str(e)}")
        return jsonify({"error": str(e)}), 500

# 파일 업로드 엔드포인트
@app.route('/api/upload-file', methods=['POST'])
def api_upload_file():
    try:
        if 'file' not in request.files:
            return jsonify({"error": "No file part"}), 400
            
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({"error": "No selected file"}), 400
            
        logger.info(f"File upload requested: {file.filename}")
        
        # 파일 내용 읽기
        text_content = file.read().decode('utf-8')
        logger.info(f"File content (first 100 chars): {text_content[:100]}...")
        
        # 텍스트 분석
        cards = analyze_text(text_content)
        logger.info(f"Generated {len(cards)} cards from file")
        
        return jsonify({"cards": cards})
    except Exception as e:
        logger.error(f"Error in upload_file API: {str(e)}")
        return jsonify({"error": str(e)}), 500

# 이미지 생성 엔드포인트
@app.route('/api/generate-image', methods=['POST'])
def api_generate_image():
    try:
        data = request.json
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        if 'prompt' not in data:
            return jsonify({"error": "No prompt provided"}), 400
            
        prompt = data['prompt']
        # 추가 카드 정보를 가져옴
        title = data.get('title', '')
        content = data.get('content', '') 
        highlight = data.get('highlight', '')
        style = data.get('style', '사진')
        background_color = data.get('backgroundColor', '')
        
        logger.info(f"Image generation requested for title: '{title[:30]}...' with prompt: {prompt[:100]}...")
        
        image_url = generate_image(
            prompt, 
            title, 
            content, 
            highlight,
            style, 
            background_color
        )
        
        if not image_url:
            logger.error("Image generation failed - empty URL returned")
            return jsonify({"error": "이미지 생성에 실패했습니다."}), 500
            
        logger.info("Image generated successfully")
        return jsonify({"image_url": image_url})
    except Exception as e:
        logger.error(f"Error in generate_image API: {str(e)}")
        return jsonify({"error": str(e)}), 500

# 에코 엔드포인트 (테스트용)
@app.route('/api/echo', methods=['POST'])
def echo():
    return jsonify({"received": request.json})

# 애플리케이션 직접 실행 시에만 서버 시작
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=8000) 