import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('API Error:', error.response.data)
      throw new Error(error.response.data.message || 'Er is een fout opgetreden')
    } else if (error.request) {
      // The request was made but no response was received
      console.error('Network Error:', error.request)
      throw new Error('Kan geen verbinding maken met de server')
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request Error:', error.message)
      throw new Error('Er is een fout opgetreden bij het verwerken van het verzoek')
    }
  }
)

export default api 