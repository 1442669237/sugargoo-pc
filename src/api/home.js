import { get, post } from '@/utils/request'

export const getHome = (config = {}) => get('/home', {}, config)
export const getProducts = (category, config = {}) => get('/products', { category }, config)
export const getShippingEstimate = (data) => post('/shipping/estimate', data)
