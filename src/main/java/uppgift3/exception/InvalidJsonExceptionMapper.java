package uppgift3.exception;

import jakarta.ws.rs.ProcessingException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class InvalidJsonExceptionMapper implements ExceptionMapper<ProcessingException> {

    static final String READ_MESSAGE =
            "The request body could not be read. Check that it is valid JSON and that hungerLevel and happiness are whole numbers";
    static final String WRITE_MESSAGE = "The server could not create a response";

    @Override
    public Response toResponse(ProcessingException exception) {
        ErrorResponse body = isWriteError(exception.getMessage())
                ? ErrorResponse.of(500, "Internal Server Error", WRITE_MESSAGE)
                : ErrorResponse.of(400, "Bad Request", READ_MESSAGE);

        return Response.status(body.status())
                .type(MediaType.APPLICATION_JSON_TYPE)
                .entity(body)
                .build();
    }

    static boolean isWriteError(String message) {
        return message != null && message.contains("serialization error") && !message.contains("deserialization");
    }
}
