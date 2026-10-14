import axios from 'axios'
import { getLanguage, t } from '../i18n/index.js'

const request = axios.create({
  baseURL: import.meta.env?.VITE_API_BASE_URL || '/api',
  timeout: 15000,
})

request.interceptors.request.use(
  (config) => {
    config.headers['Accept-Language'] = getLanguage()
    return config
  },
  (error) => Promise.reject(error),
)

const statusMessages = {
  400: 'errors.invalidRequest',
  401: 'errors.unauthorized',
  403: 'errors.forbidden',
  404: 'errors.notFound',
  429: 'errors.tooManyRequests',
}

request.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (axios.isCancel(error)) return Promise.reject(error)

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      error.message = t('errors.timeout')
    } else if (error.response) {
      const message = error.response.data?.message
      error.message =
        typeof message === 'string' && message.trim()
          ? message
          : t(statusMessages[error.response.status] || 'errors.requestFailed')
    } else if (error.request) {
      error.message = t('errors.network')
    }

    // 保留 AxiosError 的 response、code 等信息，由业务页面展示错误。
    return Promise.reject(error)
  },
)

// params 为 URL 查询参数，config 可传 headers、timeout、signal 等 Axios 配置。
export const get = (url, params = {}, config = {}) => request.get(url, { ...config, params })
export const del = (url, params = {}, config = {}) => request.delete(url, { ...config, params })
export const head = (url, params = {}, config = {}) => request.head(url, { ...config, params })
export const options = (url, params = {}, config = {}) =>
  request.options(url, { ...config, params })

// data 为请求体，也可以直接传入 FormData。
export const post = (url, data, config = {}) => request.post(url, data, config)
export const put = (url, data, config = {}) => request.put(url, data, config)
export const patch = (url, data, config = {}) => request.patch(url, data, config)

export default request
