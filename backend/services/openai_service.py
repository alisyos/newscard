import openai
import os
from typing import List
from dotenv import load_dotenv
from models.card_news import Card
import logging

# 로깅 설정
logger = logging.getLogger(__name__)

load_dotenv()

# API 키 확인
api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    logger.warning("WARNING: OPENAI_API_KEY is not set in .env file")

# OpenAI API 키 설정
openai.api_key = api_key

class OpenAIService:
    @staticmethod
    async def analyze_text(text: str) -> List[Card]:
        """
        텍스트를 분석하여 카드뉴스 구조 생성
        """
        try:
            if not text or len(text.strip()) == 0:
                logger.error("Empty text provided for analysis")
                return OpenAIService._get_sample_cards()
                
            logger.info(f"Starting text analysis with OpenAI API, text length: {len(text)}")
            
            # OpenAI API 키 확인
            if not openai.api_key:
                logger.error("OpenAI API key is not set")
                return OpenAIService._get_sample_cards("API 키가 설정되지 않았습니다")
            
            messages = [
                {"role": "system", "content": """당신은 고품질 카드뉴스를 생성하는 AI입니다. 
                주어진 텍스트를 분석하여 3-5장 분량의 카드뉴스 구성을 제안하세요.
                각 카드에는 제목, 본문 내용, 강조 문구를 포함해야 합니다.
                또한 각 카드의 이미지에 대한 프롬프트도 제안하세요."""},
                {"role": "user", "content": f"""다음 텍스트를 바탕으로 SNS용 카드뉴스를 만들어주세요.
                - 각 페이지마다 주제와 설명을 포함하고,
                - 총 5장으로 구성되게 하며, 강조 문구는 따로 구분해주세요.
                - 주제와 설명을 강조하기 위한 이미지 제안을 해주세요.
                
                텍스트: {text}"""}
            ]
            
            logger.info("Calling OpenAI API...")
            
            try:
                response = openai.chat.completions.create(
                    model="gpt-4.1", # 최신 GPT 모델 사용
                    messages=messages,
                    temperature=0.7,
                    max_tokens=1500,
                )
                
                content = response.choices[0].message.content
                logger.info(f"OpenAI API response received, content length: {len(content)}")
                
                # 응답 파싱
                cards = []
                sections = content.split("카드 ")
                
                for i, section in enumerate(sections[1:]):  # 첫 번째는 비어있을 수 있으므로 건너뜀
                    logger.debug(f"Processing section {i+1}: {section[:100]}...")
                    lines = section.strip().split("\n")
                    if len(lines) >= 3:
                        title = lines[0].replace(":", "").strip()
                        content = "\n".join([l for l in lines[1:] if not (l.startswith("강조:") or l.startswith("이미지:"))]).strip()
                        
                        # 강조 문구 추출
                        highlight = next((l.replace("강조:", "").strip() for l in lines if l.startswith("강조:")), "")
                        
                        # 이미지 프롬프트 추출
                        prompt = next((l.replace("이미지:", "").strip() for l in lines if l.startswith("이미지:")), "")
                        
                        cards.append(Card(
                            title=title,
                            content=content,
                            highlight=highlight,
                            prompt=prompt
                        ))
                
                # 카드가 없으면 샘플 카드 제공
                if not cards:
                    logger.warning("No cards generated from API response")
                    return OpenAIService._get_sample_cards()
                    
                logger.info(f"Successfully generated {len(cards)} cards")
                return cards
                
            except Exception as api_error:
                logger.error(f"OpenAI API call failed: {str(api_error)}")
                # API 호출 실패 시 샘플 카드 반환
                return OpenAIService._get_sample_cards(f"API 오류: {str(api_error)}")
                
        except Exception as e:
            logger.error(f"Error in analyze_text: {str(e)}")
            # 오류 발생 시 샘플 카드 반환
            return OpenAIService._get_sample_cards(f"처리 오류: {str(e)}")
    
    @staticmethod
    async def generate_image(
        prompt: str, 
        title: str = "", 
        content: str = "", 
        highlight: str = "",
        style: str = "사진",
        background_color: str = ""
    ) -> str:
        """
        이미지 생성 API 호출
        """
        try:
            if not prompt or len(prompt.strip()) == 0:
                logger.error("Empty prompt provided for image generation")
                return ""
                
            # 스타일 정보
            style_str = f"스타일: {style}" if style else ""
            
            # 배경색 정보
            bg_color_str = f"배경색: {background_color}" if background_color else ""
            
            # 추가 스타일 정보 결합
            additional_styles = ""
            if style_str or bg_color_str:
                additional_styles = f"\n\n[스타일 옵션]\n{style_str}\n{bg_color_str}".strip()
            
            # 카드 정보를 조합하여 풍부한 프롬프트 구성
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
            if not openai.api_key:
                logger.error("OpenAI API key is not set")
                return ""
                
            response = openai.images.generate(
                model="gpt-image-1",  # 최신 이미지 생성 모델
                prompt=enhanced_prompt,
                size="1024x1024",
                quality="high",
                n=1,
            )
            
            logger.info("Image generated successfully")
            
            # gpt-image-1 모델은 항상 base64 형식으로 이미지를 반환합니다
            # 이전: return response.data[0].url
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
            
    @staticmethod
    def _get_sample_cards(error_message="API 호출 중 오류가 발생했습니다") -> List[Card]:
        """샘플 카드 데이터 반환"""
        return [
            Card(title="샘플 카드 1", content=f"첫 번째 카드 내용입니다. {error_message}", highlight="강조 문구 1"),
            Card(title="샘플 카드 2", content="두 번째 카드 내용입니다.", highlight="강조 문구 2"),
            Card(title="샘플 카드 3", content="세 번째 카드 내용입니다.", highlight="강조 문구 3"),
        ] 