package uppgift3.exception;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ElementKind;
import jakarta.validation.Path;

import java.util.Comparator;
import java.util.List;
import java.util.Set;

public record ErrorResponse(int status, String error, String message, List<FieldError> errors) {

    public record FieldError(String field, String message, Object rejectedValue) {
    }

    public static ErrorResponse of(int status, String error, String message) {
        return new ErrorResponse(status, error, message, List.of());
    }

    public static ErrorResponse fromViolations(Set<? extends ConstraintViolation<?>> violations) {
        List<FieldError> errors = violations.stream()
                .map(v -> new FieldError(fieldName(v.getPropertyPath()), v.getMessage(), v.getInvalidValue()))
                .sorted(Comparator.comparing(FieldError::field).thenComparing(FieldError::message))
                .toList();
        String message = errors.size() == 1
                ? "Validation failed for 1 field"
                : "Validation failed for " + errors.size() + " fields";
        return new ErrorResponse(400, "Bad Request", message, errors);
    }

    static String fieldName(Path path) {
        Path.Node last = null;
        for (Path.Node node : path) {
            last = node;
        }
        if (last == null || last.getName() == null) {
            return "request";
        }
        if (last.getKind() == ElementKind.PARAMETER && last.getName().matches("arg\\d+")) {
            return "request";
        }
        return last.getName();
    }

    static boolean isReturnValueViolation(ConstraintViolation<?> violation) {
        for (Path.Node node : violation.getPropertyPath()) {
            if (node.getKind() == ElementKind.RETURN_VALUE) {
                return true;
            }
        }
        return false;
    }
}
