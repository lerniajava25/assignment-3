package uppgift3.exception;

import jakarta.validation.ConstraintViolation;
import jakarta.validation.ElementKind;
import jakarta.validation.Path;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Proxy;
import java.util.List;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.*;

class ErrorResponseTest {

    @Test
    void violationsBecomeOneFieldErrorEachWithTheJsonFieldName() {
        var nameBlank = violation("name cannot be blank", "",
                node("adoptPet", ElementKind.METHOD), node("arg0", ElementKind.PARAMETER), node("name", ElementKind.PROPERTY));
        var hungerTooHigh = violation("hungerLevel cannot exceed 100", 150,
                node("adoptPet", ElementKind.METHOD), node("arg0", ElementKind.PARAMETER), node("hungerLevel", ElementKind.PROPERTY));
        var missingBody = violation("request body is required", null,
                node("adoptPet", ElementKind.METHOD), node("arg0", ElementKind.PARAMETER));

        ErrorResponse response = ErrorResponse.fromViolations(Set.of(nameBlank, hungerTooHigh, missingBody));

        assertEquals(400, response.status());
        assertEquals("Validation failed for 3 fields", response.message());
        assertEquals(List.of(
                new ErrorResponse.FieldError("hungerLevel", "hungerLevel cannot exceed 100", 150),
                new ErrorResponse.FieldError("name", "name cannot be blank", ""),
                new ErrorResponse.FieldError("request", "request body is required", null)
        ), response.errors());
    }

    @Test
    void returnValueViolationIsTheServersFault() {
        var fromServer = violation("must not be null", null,
                node("viewPetStatus", ElementKind.METHOD), node("<return value>", ElementKind.RETURN_VALUE));
        var fromClient = violation("name cannot be blank", "",
                node("adoptPet", ElementKind.METHOD), node("arg0", ElementKind.PARAMETER), node("name", ElementKind.PROPERTY));

        assertTrue(ErrorResponse.isReturnValueViolation(fromServer));
        assertFalse(ErrorResponse.isReturnValueViolation(fromClient));
    }

    @Test
    void serverInternalMessagesAreReplacedButOwnMessagesAreKept() {
        assertEquals("Pet 7 not found", NotFoundExceptionMapper.messageFor("Pet 7 not found"));
        assertEquals(NotFoundExceptionMapper.DEFAULT_MESSAGE,
                NotFoundExceptionMapper.messageFor("RESTEASY003210: Could not find resource for full path"));
        assertEquals(BadRequestExceptionMapper.DEFAULT_MESSAGE, BadRequestExceptionMapper.messageFor("HTTP 400 Bad Request"));
        assertEquals("limit must be 1 or greater", BadRequestExceptionMapper.messageFor("limit must be 1 or greater"));
        assertFalse(InvalidJsonExceptionMapper.isWriteError("RESTEASY008200: JSON Binding deserialization error: x"));
        assertTrue(InvalidJsonExceptionMapper.isWriteError("RESTEASY008205: JSON Binding serialization error x"));
    }

    private static Path.Node node(String name, ElementKind kind) {
        return (Path.Node) Proxy.newProxyInstance(Path.Node.class.getClassLoader(), new Class<?>[]{Path.Node.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "getName", "toString" -> name;
                    case "getKind" -> kind;
                    default -> null;
                });
    }

    private static ConstraintViolation<?> violation(String message, Object invalidValue, Path.Node... nodes) {
        List<Path.Node> list = List.of(nodes);
        Path path = (Path) Proxy.newProxyInstance(Path.class.getClassLoader(), new Class<?>[]{Path.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "iterator" -> list.iterator();
                    case "toString" -> String.join(".", list.stream().map(Path.Node::getName).toList());
                    default -> null;
                });
        return (ConstraintViolation<?>) Proxy.newProxyInstance(ConstraintViolation.class.getClassLoader(),
                new Class<?>[]{ConstraintViolation.class},
                (proxy, method, args) -> switch (method.getName()) {
                    case "getMessage" -> message;
                    case "getInvalidValue" -> invalidValue;
                    case "getPropertyPath" -> path;
                    case "hashCode" -> System.identityHashCode(proxy);
                    case "equals" -> proxy == args[0];
                    default -> null;
                });
    }
}
