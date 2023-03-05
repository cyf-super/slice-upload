import axios from 'axios'

const baseUrl = 'http://localhost:3002'

export const uploadFileApi = (fileData) => {
	return axios.post(`${baseUrl}/upload-chunk`, fileData, {
		headers: {
			'Content-Type': 'multipart/form-data'
		}
	})
}

export const mergeChunksApi = (data) => {
	return axios.post(`${baseUrl}/merge-chunk`, data, {
		headers: {
			'Content-Type': 'application/json'
		}
	})
}