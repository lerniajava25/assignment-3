package uppgift3.exception;

import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class NotFoundExceptionMapper implements ExceptionMapper<NotFoundException> {

    static final String DEFAULT_MESSAGE = "The requested resource was not found";

    @Override
    public Response toResponse(NotFoundException exception) {
        ErrorResponse body = ErrorResponse.of(404, "Not Found", messageFor(exception.getMessage()));
        return Response.status(Response.Status.NOT_FOUND)
                .type(MediaType.APPLICATION_JSON_TYPE)
                .entity(body)
                .build();
    }

    static String messageFor(String message) {
        if (message == null || message.isBlank() || message.startsWith("RESTEASY") || message.startsWith("HTTP 404")) {
            return DEFAULT_MESSAGE;
        }
        return message;
    }
}
