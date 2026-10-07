package uppgift3.exception;

import jakarta.validation.ConstraintViolationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;

@Provider
public class ConstraintViolationExceptionMapper implements ExceptionMapper<ConstraintViolationException> {

    @Override
    public Response toResponse(ConstraintViolationException exception) {
        var violations = exception.getConstraintViolations();

        if (violations == null || violations.isEmpty()) {
            return json(ErrorResponse.of(400, "Bad Request", "Validation failed"));
        }
        if (violations.stream().anyMatch(ErrorResponse::isReturnValueViolation)) {
            return json(ErrorResponse.of(500, "Internal Server Error", "The server produced an invalid response"));
        }
        return json(ErrorResponse.fromViolations(violations));
    }

    private static Response json(ErrorResponse body) {
        return Response.status(body.status())
                .type(MediaType.APPLICATION_JSON_TYPE)
                .entity(body)
                .build();
    }
}
