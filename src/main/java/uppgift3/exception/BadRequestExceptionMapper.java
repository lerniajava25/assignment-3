package uppgift3.exception;

import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class BadRequestExceptionMapper implements ExceptionMapper<BadRequestException> {

    static final String DEFAULT_MESSAGE =
            "Invalid request. Allowed: offset >= 0, limit >= 1, sortBy = id, name, species, hungerLevel or happiness, order = asc or desc";

    @Override
    public Response toResponse(BadRequestException exception) {
        ErrorResponse body = ErrorResponse.of(400, "Bad Request", messageFor(exception.getMessage()));
        return Response.status(Response.Status.BAD_REQUEST)
                .type(MediaType.APPLICATION_JSON_TYPE)
                .entity(body)
                .build();
    }

    static String messageFor(String message) {
        if (message == null || message.isBlank() || message.startsWith("HTTP 400") || message.startsWith("RESTEASY")) {
            return DEFAULT_MESSAGE;
        }
        return message;
    }
}
