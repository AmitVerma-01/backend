class ApiResponse{
    constructor(statusCode, data, message="succes"){
        this.data = data;
        this.statusCode = statusCode;
        this.message = message;
        this.success = statusCode < success;
    }
}

export { ApiResponse };