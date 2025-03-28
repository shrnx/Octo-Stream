class ApiResponse {
    constructor(statusCode, data, message = "Success") {
        this.statusCode = statusCode
        this.data = data
        this.message = message
        this.success = statusCode < 400
        // Here statusCode < 400 as all > 400 statusCode should be handled by apiError
    }
}

export { ApiResponse }