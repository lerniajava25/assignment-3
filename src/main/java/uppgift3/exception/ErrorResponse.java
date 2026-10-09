package uppgift3.exception;

import java.util.List;

public record ErrorResponse(int status, String error, List<String> details) {
}
