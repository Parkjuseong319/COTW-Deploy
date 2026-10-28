import axios from 'axios';

const instance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 180000,
  withCredentials: true, // Refresh Token 쿠키 전송 및 수신
  headers: {
    'Content-Type': 'application/json',
  },
});

// 요청 인터셉터
instance.interceptors.request.use(
  (config) => {
    const authData = localStorage.getItem('auth');

    if (authData) {
      try {
        const parsedAuth = JSON.parse(authData);
        const token = parsedAuth.accessToken;

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Auth data parsing error:', error);
      }
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// 응답 인터셉터
instance.interceptors.response.use(
  (response) => {
    const requestUrl = response.config.url || '';

    // 로그인 응답은 Access Token이 헤더에 있으므로 별도 추출
    if (requestUrl.replace(/\/$/, '') === '/api/auth/login') {
      const authorization = response.headers['authorization'];

      const accessToken = authorization
        ? authorization.replace(/^Bearer\s+/i, '').trim()
        : null;

      return {
        data: response.data,
        accessToken,
        status: response.status,
      };
    }

    // 나머지 API는 기존처럼 응답 본문만 반환
    return response.data;
  },
  (error) => {
    console.error('API 요청 실패:', error);

    if (error.response?.status === 401) {
      console.warn('인증이 필요합니다.');
    }

    return Promise.reject(error);
  }
);

export default instance;
