import axios from 'axios';

// API 기본 URL - 개발 환경과 프로덕션 환경에 따라 다르게 설정
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const analyzeText = async (text) => {
  try {
    console.log('Sending text for analysis:', text);
    const response = await api.post('/api/analyze-text', { text });
    console.log('Response received:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error analyzing text:', error);
    console.error('Error details:', error.response?.data || error.message);
    throw error;
  }
};

export const uploadFile = async (file) => {
  try {
    console.log('Uploading file:', file.name);
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post('/api/upload-file', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    console.log('Upload response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    console.error('Error details:', error.response?.data || error.message);
    throw error;
  }
};

export const generateImage = async (
  prompt, 
  title = "", 
  content = "", 
  highlight = "", 
  style = "", 
  backgroundColor = ""
) => {
  try {
    console.log('Generating image with prompt:', prompt);
    console.log('Additional card info:', { 
      title, 
      content, 
      highlight,
      style,
      backgroundColor
    });
    
    const response = await api.post('/api/generate-image', { 
      prompt,
      title,
      content, 
      highlight,
      style,
      backgroundColor
    });
    
    console.log('Image generation response:', response.data);
    return response.data;
  } catch (error) {
    console.error('Error generating image:', error);
    console.error('Error details:', error.response?.data || error.message);
    throw error;
  }
};

export default api; 