package uppgift3.exception;

import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class WebApplicationExceptionMapper implements ExceptionMapper<WebApplicationException> {

    @Override
    public Response toResponse(WebApplicationException exception) {
        Response original = exception.getResponse();
        Response.StatusType status = original.getStatusInfo();
        ErrorResponse body = ErrorResponse.of(status.getStatusCode(), status.getReasonPhrase(), status.getReasonPhrase());

        return Response.fromResponse(original)
                .type(MediaType.APPLICATION_JSON_TYPE)
                .entity(body)
                .build();
    }
}
